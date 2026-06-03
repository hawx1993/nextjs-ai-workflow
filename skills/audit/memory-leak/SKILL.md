---
name: bydfi-audit-memory-leak
description: 全量审查客户端+服务端内存泄漏，生成报告 支持 $ARGUMENTS scope: ssg/ssr/core/components。
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Glob, Grep, Agent
---

全量按 `$ARGUMENTS` scope 扫描项目，穷举检查所有内存泄漏模式（事件监听、EventEmitter 订阅、全局缓存、定时器、Observer），逐一源码验证后生成报告。

## 参数

`$ARGUMENTS` 作为审查 scope，限定扫描范围：

| 参数         | 范围                           |
| ------------ | ------------------------------ |
| 空           | 全量默认范围                   |
| `ssg`        | `apps/byd-ssg`                 |
| `ssr`        | `apps/byd-ssr`                 |
| `core`       | `packages/apps-kit/core`       |
| `components` | `packages/apps-kit/components` |

传入其他值时必须停止执行并提示仅支持 `ssg` / `ssr` / `core` / `components`。后续 Glob / Grep / 脚本 / Agent 审查都必须只基于选定 scope；报告的“检查范围”也必须写明实际 scope。

## 泄漏分类

本 skill 检查 6 大类内存泄漏模式：

| 类别                          | 代号 | 典型表现                                                          |
| ----------------------------- | ---- | ----------------------------------------------------------------- |
| addEventListener 引用不匹配   | EVT  | add 和 remove 的函数引用不同，listener 永远无法移除               |
| EventEmitter 订阅未取消       | EMT  | .on() 无对应 .off()，或 .off() 的回调引用不匹配                   |
| 全局 Map/Set/Object 无上限    | MAP  | 模块顶层缓存只 set 不 delete，无 LRU/TTL/大小限制                 |
| setInterval/setTimeout 无清理 | TMR  | useEffect 中启动定时器但无 return cleanup                         |
| Observer 无 disconnect        | OBS  | IntersectionObserver/ResizeObserver/MutationObserver 创建后未断开 |
| 第三方库实例未释放            | LIB  | echarts/图表库 init 后无 dispose，类实例无 destroy                |
| SSR 跨请求状态泄漏            | SSR  | getServerSideProps 写入模块级全局变量，PM2 进程累积               |

## 执行流程

```
1. 解析参数 → 确定扫描范围
2. 派发 4 个并行 Agent（见 Agent 并行策略）
3. 收集 Agent 结果，去重（多个 Agent 可能报告同一文件）
4. 姊妹组件交叉检查：对每个确认的泄漏，检查同目录/同模式的兄弟组件是否有相同 bug
5. 对歧义项读源码验证（Agent 已提供上下文代码的可信赖，仅抽查 Agent 判断有歧义的项）
6. 排除误报（见「已知安全模式」）
7. 生成报告
```

---

## 类别 A：addEventListener 引用不匹配（EVT）

### A1：搜索策略

```bash
# 找出所有包含 addEventListener 的 .ts/.tsx 文件
rg -l "addEventListener" apps/ packages/ --glob '*.{ts,tsx}' --glob '!node_modules'
```

### A2：逐文件检查规则

对每个文件中的每个 addEventListener 调用：

1. **提取注册的函数引用**：addEventListener 的第二个参数
2. **查找对应的 removeEventListener**：同一个事件名
3. **比对函数引用**：

| 模式                                            | 判断                                    |
| ----------------------------------------------- | --------------------------------------- |
| add 和 remove 使用同一个命名变量                | 安全                                    |
| add 用匿名箭头函数，remove 用另一个变量         | **泄漏**                                |
| add 用匿名箭头函数，remove 用另一个匿名箭头函数 | **泄漏**（JS 中每个箭头函数都是新引用） |
| add 在 useEffect 中，无 return cleanup          | **泄漏**                                |
| add 在类构造函数中，无 destroy/dispose 方法     | 需检查是否单例                          |
| add 在普通函数中（非 useEffect），无对应 remove | **泄漏**                                |

### A3：useEffect 上下文特殊检查

```
如果 addEventListener 在 useEffect 中：
  1. 检查 useEffect 是否有 return 函数
  2. return 函数中是否有 removeEventListener
  3. removeEventListener 的第二个参数是否与 addEventListener 的相同
  4. 检查 useEffect 的 deps 数组 — deps 变化频率越高，泄漏累积越快
```

### A4：已知反模式（从实际审查中总结）

```typescript
// 反模式 1：匿名函数 vs 原始函数引用
window.addEventListener('ws1070', (e) => callback(e.detail));  // 函数 A
window.removeEventListener('ws1070', callback);  // 函数 B（不同引用！）

// 反模式 2：两个不同的匿名箭头函数
window.addEventListener('close', () => { reset(); });
window.removeEventListener('close', () => { cleanup(); });  // 不同引用！

// 反模式 3：多余的箭头函数包装
const handleResize = debounce(fn, 100);
window.addEventListener('resize', () => { handleResize(); });  // 匿名包装
window.removeEventListener('resize', handleResize);  // 不同引用！

// 反模式 4：函数内部嵌套 addEventListener
const syncTheme = () => {
  window.addEventListener('message', (e) => { ... });  // 每次调用累积
};
useEffect(() => { syncTheme(); }, [theme]);  // theme 变化 → 累积

// 反模式 5：cleanup 遗漏某个 listener
useEffect(() => {
  window.addEventListener('offline', handler);
  // ... 其他逻辑
  return () => {
    // 只清理了 timeout，漏掉了 offline listener
    clearTimeout(timer);
  };
}, [deps]);

// 反模式 6：条件分支导致 listener 残留
useEffect(() => {
  if (condition) {
    window.addEventListener('ws4001', handler);
  } else {
    window.removeEventListener('ws4001', handler);
  }
  // 没有 return cleanup → 组件卸载时如果 condition 为 true，listener 残留
}, [id]);

// 反模式 7：touchmove 条件移除
const touchMove = (e) => {
  if (distance > 75) {
    el.removeEventListener('touchmove', touchMove);  // 只在满足条件时移除
  }
  // 不满足条件 → listener 永远留着
};
el.addEventListener('touchmove', touchMove);

// 反模式 8：debounce/throttle 返回值作为 add 参数，remove 传原函数
const handleResize = () => { ... };
window.addEventListener('resize', debounce(handleResize, 300));  // debounce 返回新函数
window.removeEventListener('resize', handleResize);  // 原函数（不同引用！）
// 正确做法：const debouncedResize = debounce(handleResize, 300); add/remove 都用 debouncedResize

// 反模式 9：条件分支导致 cleanup 函数不对称
useEffect(() => {
  window.addEventListener('resize', resize);
  if (containerRef.current) {
    observer = new ResizeObserver(...);
    return () => { observer.disconnect(); };  // ← 只清 observer，漏了 resize
  }
  return () => { window.removeEventListener('resize', resize); };  // ← 这个分支才正确
}, [deps]);

// 反模式 10：模块级 let 变量存第三方库实例
let myChart: any;  // 模块级
useLayoutEffect(() => {
  myChart = echarts.init(element);  // 旧实例被覆盖，泄漏
  myChart.on('mousemove', ...);     // 旧实例的 handler 也泄漏
}, [data]);  // 无 cleanup → 无 dispose
```

### A5：已知安全模式（跳过）

- 单例模式（如 NetworkInfo）中的 listener，整个应用生命周期只创建 1-2 个，不累积
- `window.__xxxBound__` 标志位保护的一次性绑定
- 类的 destroy() 方法中有正确的 removeEventListener

---

## 类别 B：EventEmitter 订阅未取消（EMT）

### B1：搜索策略

```bash
# 找出所有 EventEmitter 实例定义
rg "new.*EventEmitter|extends.*EventEmitter|StreamBehaviorSubject" packages/ apps/ --glob '*.{ts,tsx}'

# 找出所有 .on( / .addListener( / .onStream( 调用
rg "\.(on|addListener|onStream)\s*\(" apps/ packages/ --glob '*.{ts,tsx}'
```

### B2：逐调用检查规则

对每个 `.on()` / `.addListener()` / `.onStream()` 调用：

1. **确认所在上下文**：useEffect / 类方法 / 模块顶层
2. **查找对应的 .off() / .removeListener()**
3. **比对回调引用**：

| 模式                                                             | 判断                          |
| ---------------------------------------------------------------- | ----------------------------- |
| .on(event, namedFn) + .off(event, namedFn)                       | 安全                          |
| .on(event, arrowFn) + .off(event, originalFn)                    | **泄漏**（同 EVT 反模式）     |
| .onStream() 返回值在 useEffect cleanup 中调用                    | 安全                          |
| .on() 在 useEffect 中，无对应 .off() 在 cleanup                  | **泄漏**                      |
| removeAllListeners 在 re-run 开头但 unmount 时 .off() 引用不匹配 | **泄漏**（仅 unmount 时泄漏） |

### B3：已知 Emitter 实例（bydfi-web 特有）

| Emitter                  | 定义位置                                        | 事件数 |
| ------------------------ | ----------------------------------------------- | ------ |
| kChartEmitter            | packages/apps-kit/core/events/src/k-chart.ts    | 60+    |
| FavorEmitter             | packages/apps-kit/core/events/src/favor.ts      | 1      |
| IDBEventEmitter          | packages/apps-kit/core/events/src/idb-event.ts  | 1      |
| SwapOrderEmitter         | packages/apps-kit/core/events/src/swap-order.ts | N      |
| OrderBookEmitter         | 搜索确认                                        | N      |
| HideHeaderSearchEmitter  | 搜索确认                                        | 1      |
| CleanNotificationEmitter | 搜索确认                                        | 1      |
| Legend.state.instance    | 第三方（mitt）                                  | N      |

---

## 类别 C：全局 Map/Set/Object 无上限（MAP）

### C1：搜索策略

```bash
# 模块顶层的 Map/Set（不在函数/类内部）
rg "^(export\s+)?(const|let|var)\s+\w+\s*=\s*new\s+(Map|Set)" apps/ packages/ --glob '*.{ts,tsx}'

# 类的 static 属性
rg "static\s+\w+.*=\s*new\s+(Map|Set)|static\s+\w+.*:\s*\{" apps/ packages/ --glob '*.{ts,tsx}'

# 模块顶层的对象/数组缓存
rg "^(export\s+)?(const|let|var)\s+\w*(cache|Cache|CACHE|pending|_pending|store|Store)\w*\s*[:=]" apps/ packages/ --glob '*.{ts,tsx}'
```

### C2：逐变量检查规则

对每个模块顶层的 Map/Set/Object：

1. **检查 .set() / .add() / .push() / 赋值操作**
2. **检查 .delete() / .clear() / .splice() 操作**
3. **检查大小限制**（LRU、max size、TTL）

| 模式                                            | 判断                       |
| ----------------------------------------------- | -------------------------- |
| WeakMap / WeakSet                               | 安全（自动 GC）            |
| 使用了 LRUCache                                 | 安全（有上限）             |
| 只有 1 个 key 且每次覆盖写入                    | 安全（不累积）             |
| .set() 存在但 .delete()/.clear() 被注释或不存在 | **泄漏**                   |
| 有 clear 但仅在特定条件触发（如断网重连）       | **泄漏**（正常流程无清理） |

### C3：排除条件

- WeakMap/WeakSet → 自动回收
- LRUCache / 带 max 参数的缓存 → 有上限
- 只存 1 个固定 key（如 `CACHE_TOKEN.set('MOONX_TOKEN', v)`）→ 覆盖不累积
- 布尔值标志位（如 `FilterStore.set('closed', true)`）→ 有限状态
- Worker 内部的变量 → 独立内存空间

---

## 类别 D：setInterval/setTimeout 无清理（TMR）

### D1：搜索策略

```bash
rg "setInterval|setTimeout" apps/ packages/ --glob '*.{ts,tsx}' -l
```

### D2：逐调用检查规则

```
对每个 setInterval/setTimeout：
  1. 是否在 useEffect 中？
     a. 是 → return cleanup 中是否有 clearInterval/clearTimeout？
     b. 是否保存了返回的 timer ID？
     c. 所有条件分支是否都能走到 clear？
  2. 是否在类方法中？
     a. 是 → 是否有对应的 destroy/stop 方法调用 clear？
  3. 是否有自清理逻辑？
     a. setInterval 内部的 if (done) clearInterval(timerId) → 正常结束时安全
     b. 但如果组件在 done 之前卸载 → 依然泄漏
```

---

## 类别 E：Observer 无 disconnect（OBS）

### E1：搜索策略

```bash
rg "new\s+(IntersectionObserver|ResizeObserver|MutationObserver)" apps/ packages/ --glob '*.{ts,tsx}' -l
```

### E2：检查规则

```
对每个 new Observer：
  1. 是否有 .disconnect() 调用？
  2. disconnect 是否在 useEffect cleanup 或 destroy 方法中？
  3. 是否存在条件分支导致某些路径下不 disconnect？
```

---

## 类别 G：第三方库实例未释放（LIB）

### G1：搜索策略

```bash
# echarts 实例
rg "echarts\.init|\.dispose\(\)" apps/ packages/ --glob '*.{ts,tsx}'

# 模块级 let/var 存库实例（典型泄漏信号）
rg "^(let|var)\s+\w*(chart|Chart|map|Map|editor|Editor)\w*\s*[:=]" apps/ packages/ --glob '*.{ts,tsx}'

# 自定义类的 destroy/dispose 方法
rg "class\s+\w+" apps/ packages/ --glob '*.{ts,tsx}' -l
```

### G2：检查规则

```
对每个第三方库实例（echarts、图表库、编辑器等）：
  1. 创建在哪里？（useEffect / useLayoutEffect / 类方法 / 模块顶层）
  2. 是否有对应的 dispose/destroy 调用？
  3. dispose 是否在 useEffect cleanup 或 unmount 中？
  4. 如果实例存在模块级变量中（let myChart），每次重新赋值时旧实例是否 dispose？

对每个自定义类（new XxxChart / new XxxWidget）：
  1. 类是否有 destroy/dispose/cleanup 方法？
  2. 该方法是否被调用（特别是在 useEffect cleanup 中）？
  3. 类内部是否有 addEventListener/setInterval 等需要清理的操作？
```

### G3：已知反模式

```typescript
// 反模式 1：模块级 let 存 echarts 实例
let myChart: any;
useLayoutEffect(() => {
  myChart = echarts.init(element); // 旧实例被覆盖泄漏
  myChart.on('mousemove', handler);
}, [data]); // 无 return cleanup → 无 dispose

// 反模式 2：类没有 destroy 方法
class MiniChart {
  init() {
    window.addEventListener('resize', () => this.autoSize());
  }
  // 没有 destroy/dispose/cleanup 方法 → listener 永远无法移除
}
```

---

## 类别 F：SSR 跨请求状态泄漏（SSR）

### F1：搜索策略

仅扫描 `apps/byd-ssr/` 和被 SSR 导入的 `packages/` 代码。

```bash
# 搜索所有 getServerSideProps
rg "getServerSideProps" apps/byd-ssr/ --glob '*.{ts,tsx}' -l

# 搜索 getServerSideProps 中对模块级变量的写入
rg "^(export\s+)?(const|let|var)\s+" apps/byd-ssr/src/ packages/ --glob '*.{ts,tsx}'
```

### F2：检查规则

```
对每个 getServerSideProps：
  1. 是否有写入模块级变量？（cache.lang = ..., CACHE.set(...) 等）
  2. 模块级变量是否在请求间共享？（SSR 进程中是）
  3. 是否有自动清理机制？（TTL、请求结束后 reset 等）

对每个模块级 class 的 static 属性：
  1. 是否有 resetInstance 方法？
  2. resetInstance 是否被自动调用？（还是只是存在但没人调）
```

---

## Agent 并行策略

派发 **4 个** Agent，按以下分工避免重叠：

| Agent   | 负责类别  | 搜索目标                                               | 说明                                                                         |
| ------- | --------- | ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Agent 1 | EVT + OBS | `addEventListener` + `new *Observer`                   | 合并：OBS 独立发现极少（37 个 Observer 仅 1 处独立泄漏），不值得单独开 Agent |
| Agent 2 | EMT + LIB | `.on()` / `.addListener()` + 第三方库实例              | EMT 搜索 emitter 订阅；LIB 搜索 echarts/图表库 init + 类的 destroy 方法      |
| Agent 3 | MAP + SSR | 全局 Map/Set/Object + SSR 跨请求状态                   | 保持不变                                                                     |
| Agent 4 | TMR       | `setInterval` / `setTimeout` / `requestAnimationFrame` | 保持不变                                                                     |

> **为什么从 5 缩到 4**：旧方案 EVT 和 EMT 的 Agent 在 `window.addEventListener` 上有 ~30% 重叠（同一个 useEffect 同时包含 DOM 事件和 emitter 订阅）。新方案通过搜索入口区分：Agent 1 只搜 `addEventListener`/`removeEventListener`/`new.*Observer`，Agent 2 只搜 `.on(`/`.off(`/`.addListener(`/`echarts.init`/`.dispose`/`.destroy`。

**Agent prompt 模板**：

```
在 {扫描范围} 中穷举搜索类别 {X} 的内存泄漏。

具体检查规则：
{类别 X 的检查规则}

输出要求：
1. 对每个发现给出 100% 确定的判断
2. 列出文件绝对路径、行号、具体代码片段（包含前后 5 行上下文）、判断理由
3. 对同一个 useEffect 中多种泄漏（如 EVT+OBS），全部报告
4. 发现泄漏后，检查同目录下是否有克隆/姊妹组件存在相同 bug
```

**验证策略优化**：Agent 已提供了上下文代码片段。主线程收到结果后：

- 判断明确的（如匿名箭头 vs 命名函数）→ 直接采信
- 判断有歧义的（如条件分支、单例判断）→ Read 源码验证
- 多个 Agent 报告同一文件 → 去重合并

---

## 验证原则

### 100% 确认原则

每个上报的泄漏必须满足：

1. **读了源码**：不是 Agent 说什么就信什么，关键文件必须 Read 验证
2. **引用比对明确**：对 EVT/EMT 类型，必须确认 add 和 remove 的函数引用确实不同
3. **排除了安全模式**：确认不是单例、不是 WeakMap、不是单 key 覆盖
4. **泄漏路径可达**：确认触发条件在正常使用中会发生（如 useEffect deps 变化、组件 mount/unmount）

### 误报排除清单

| 场景                                                  | 为什么不是泄漏                                |
| ----------------------------------------------------- | --------------------------------------------- |
| 应用生命周期单例的 listener                           | 只创建 1-2 个，不累积                         |
| WeakMap/WeakSet                                       | 引用被回收后自动清理                          |
| LRUCache（有 max）                                    | 有上限                                        |
| 只存 1 个固定 key 的 Map                              | 覆盖写入不累积                                |
| 布尔值/枚举 Map                                       | 有限状态不增长                                |
| Worker 内部变量                                       | 独立内存空间                                  |
| `__bound__` 标志位保护的一次性绑定                    | 最多绑定一次                                  |
| DOM 克隆方式移除 listener（cloneNode + replaceChild） | 虽不优雅但有效清理了匿名 listener             |
| Observer.unobserve(单个元素)                          | 只 observe 了 1 个元素时，功能等价 disconnect |
| 死代码中的 Map/Set（声明但从未使用）                  | 不会增长，建议删除但不是泄漏                  |

---

## 报告格式

### 文件头

```markdown
# bydfi-web 内存泄漏审查报告

| 项目       | 值                                                                          |
| ---------- | --------------------------------------------------------------------------- |
| 审查日期   | YYYY-MM-DD                                                                  |
| 分支       | {当前分支名}                                                                |
| 审查范围   | {参数决定}                                                                  |
| 确认泄漏数 | **N 处**（X 事件/订阅 + Y 缓存/定时器）                                     |
| 审查方法   | N 轮并行穷举扫描 + 逐文件源码验证                                           |
| 审查覆盖   | addEventListener / EventEmitter / 全局 Map·Set / setInterval·Observer / SSR |

> 本报告仅包含 **100% 确认** 的内存泄漏，不含疑似或需验证项。
```

### 总览表

```markdown
| #   | 文件 | 泄漏类型 | 类别 | 优先级 |
| --- | ---- | -------- | ---- | ------ |
```

优先级规则：

- **P0**：交易核心路径（行情、下单、持仓），每次操作都在泄漏
- **P1**：常用页面或全局组件，使用过程中累积
- **P2**：低频页面或小型缓存，影响有限

### 详细描述

每处泄漏包含：

- 文件路径 + 行号
- 影响范围
- 触发频率（deps 列表、操作频率）
- 问题代码片段（标注泄漏点）
- 对比正确写法（如果同项目中有参考）

### 修复建议

按优先级分组，每项给出具体修复方案。

### 审查覆盖率说明

列出每个审查维度的文件数和覆盖率。

### 排除的误报

列出被 Agent 报告但经验证排除的条目及排除理由。

## 报告文件输出

写入 `reports/YYYY-MM-DD/byd-web-report-memory-leak-YYYY-MM-DD.md`，同名已存在则覆盖。

---

## 已知陷阱（从实际审查中总结）

### 1. 箭头函数引用是最大泄漏源

JavaScript 中每次创建的箭头函数都是新的引用：

```typescript
() => {}  !== () => {}  // 永远不相等
```

所以 `addEventListener(e, () => fn())` 和 `removeEventListener(e, () => fn())` 永远不匹配。

### 2. removeAllListeners 不能替代正确的 .off()

`emitter.removeAllListeners(event)` 会移除该事件的所有 listener（包括其他组件注册的）。它在 re-run 时提供保护，但在 unmount 时 .off() 依然需要正确的引用。

### 3. 单 key Map 不是泄漏

如果一个 Map 只有 `CACHE.set('TOKEN', value)` 这一种 key，每次是覆盖写入不是累积。Agent 容易误报这类为泄漏。

### 4. SSR 模块级变量跨请求共享

SSR 进程中 `const cache = new Map()` 在所有请求间共享。客户端的 Map 随页面刷新释放，但 SSR 的 Map 跟随 PM2 进程生命周期。

### 5. frameRun/requestAnimationFrame 延迟执行

如果 `.on()` 被 `frameRun()` / `requestAnimationFrame` 包裹，cleanup 可能在 `.on()` 之前执行，导致先 off 后 on，listener 残留。这是竞态条件，不一定 100% 复现。

### 6. deps 数组是泄漏放大器

useEffect 的 deps 变化频率决定泄漏累积速度：

- `[]` → 只泄漏 1 次（mount 时）
- `[address]` → 每次切换地址泄漏
- `[globalOrderStatus, globalOrderId]` → 每次下单泄漏
- `[list]` → 列表数据变化就泄漏（高频！）

### 7. debounce/throttle 返回新引用

`debounce(fn, delay)` 和 `throttle(fn, delay)` 返回的是包装函数，与原函数 `fn` 是不同引用。直接 `addEventListener('resize', debounce(fn))` 后用 `removeEventListener('resize', fn)` 移除无效。必须先 `const debouncedFn = debounce(fn)` 保存引用。

### 8. 姊妹组件经常有相同 bug

项目中大量使用「克隆 → 改名」方式创建新组件（如 trade-ui vs trade-ui-swap-demo、place-order-notification vs rent-order-notification）。一个组件有泄漏，其克隆版本大概率也有。发现泄漏后必须检查同目录/同模式的兄弟文件。

### 9. 第三方库实例需要显式 dispose

echarts.init() 创建的实例不会被 GC 自动回收（因为它在 DOM 上挂载了事件和 canvas 资源）。必须调用 `.dispose()` 显式释放。同理适用于其他图表库、编辑器等"重实例"库。模块级 `let myChart` 存引用是高危模式 — 每次覆盖赋值都泄漏旧实例。

---

## 注意事项

- 只做研究和分析，不修改任何代码
- **每个结论必须有源码验证依据**，不能凭 Agent 报告判断
- 只输出 100% 确认的泄漏，不输出"可能""疑似""建议检查"
- 报告的封面/元数据中必须标注当前分支名（如果不在 main 上）
- 报告文件命名必须带完整 skill 名称：`bydfi-web-report-memory-leak-YYYY-MM-DD.md`
- 报告文件输出到 `reports/YYYY-MM-DD/` 日期子目录

## 相关 skill

- **关联**：`bydfi-web-code-review` — 含 Hooks 依赖规则

按问题域查询完整 skill 索引：见 `.claude/skills/SKILL_BEST_PRACTICES.md` 的"问题域 → SoT skill 索引"章节。

$ARGUMENTS
