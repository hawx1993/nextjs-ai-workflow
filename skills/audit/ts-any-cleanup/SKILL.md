---
name: bydfi-audit-report-any-cleanup
description: 扫描项目所有显式 any 用法，按 7 类机械模式（catch/useState/useRef/Promise/Record/as any/any[]）分类计数并输出可消除清单与改造顺序，固定 scope 和判定规则避免跨次漂移 支持 $ARGUMENTS scope: ssg/ssr/core/components。
disable-model-invocation: true
allowed-tools: Bash, Read, Write
---

按 `$ARGUMENTS` scope 扫描 下所有 `.ts`/`.tsx` 源文件，按 7 个固定 grep 模式分类统计显式 any 使用，输出按可消除把握度排序的清单与改造顺序建议。**已脚本化**（同 git state 下两次执行 byte-byte 一致；7 类 system grep cross-check 全过）。

## 调用方式

```bash
mkdir -p reports/$(date +%Y-%m-%d)
node .claude/skills/audit/ts-any-cleanup/scripts/audit.mjs \
  > reports/$(date +%Y-%m-%d)/byd-audit-report-any-cleanup-$(date +%Y-%m-%d).md
```

## 输出位置

`reports/YYYY-MM-DD/byd-audit-report-any-cleanup-YYYY-MM-DD.md`（reports/ 已 gitignore）

## Cross-check 锚点

脚本内置 7 个 sanity check（每类的 JS regex 计数 vs `system grep -E` 计数）。当前实测 7/7 一致。

下方"判定规则 / 执行步骤 / 报告格式"为脚本逻辑的详细说明（脚本内 `PATTERNS` 数组实现的就是这 7 类规则）。

## 设计目标

**口径稳定**：不依赖经验判断。所有归类基于「正则模式 + 路径排除」的机械规则。同一仓库快照多次运行结果必须一致。

**只输出可消除清单**：不输出"模糊判断"的条目；某一类的"100%可消除"必须满足两条——(1) grep 模式无误命中，(2) 改造方式有明确替代（unknown / 推断 / 具体类型）。

**不修改源码**：仅扫描 + 输出报告。改造由后续任务承接。

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

## 扫描范围

### 包含

`*.ts`、`*.tsx`，限定在以下目录：

```
apps/byd-ssg
apps/byd-ssr
packages/apps-kit
packages/apps-ui
packages/apps-icons
packages/apps-base-kline
packages/nex-theme
```

### 强制排除（grep 后过滤，不进入任何统计）

```
node_modules/   .next/      out/        out-rtl/    dist/    build/
public/static/charting_library/    *.d.ts
```

> 排除 `*.d.ts` 是因为第三方库声明（如 charting_library 的 11444 行 `Record<string, any>`）改不动，统计上没意义。

## 7 类判定规则（grep 模式精确）

每类独立计数；**类间允许重叠**（如 `: any[]` 同时也是 `: any`），不要把各类相加当总数。

| 类别  | 说明                  | grep 模式（PCRE）                 | 把握度     | 改造方向                                                                                                 |
| ----- | --------------------- | --------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| **A** | `catch (xxx: any)`    | `catch\s*\(\s*\w+\s*:\s*any\s*\)` | 100% 多余  | TS 4.4+ catch 默认 `unknown`；删 `: any`，块内补 type guard                                              |
| **B** | `useState<any>`       | `useState<any>`                   | 高（95%+） | 看初始值：字面量直接推断；`undefined` 改 `useState<T>()`                                                 |
| **C** | `useRef<any>`         | `useRef<any>`                     | 高（95%+） | DOM ref 改 `useRef<HTMLXxxElement>(null)`；非 DOM 写明可变值类型                                         |
| **D** | `Promise<any>`        | `Promise<any>`                    | 中高       | 看返回路径：业务函数改具体；网络层可改 `Promise<unknown>` 调用点 narrow                                  |
| **E** | `Record<string, any>` | `Record<string,\s*any>`           | 中         | 已知键 → interface；未知键值类型已知 → `Record<string, T>`；都未知 → `Record<string, unknown>`           |
| **F** | `as any` 类型断言     | `as any\b`                        | 中         | 优先：定义/导入正确类型；次之：`as unknown as T` 双断言；保留时加 `// eslint-disable-next-line` 注释原因 |
| **G** | `: any[]`             | `:\s*any\[\]`                     | 中         | 已知 → `T[]`；异构 → union/tuple；完全动态 → `unknown[]`                                                 |

> A、B、C 三类合计风险最低、收益最直接，建议优先处理。

## 执行步骤

### 阶段 1：环境校验

```bash
# 必须在仓库根（含 apps/ 和 packages/）执行
[[ -d apps && -d packages ]] || { echo '不在 bydfi-web 仓库根'; exit 1; }
```

### 阶段 2：建立日期目录与附件目录

```bash
DATE=$(date +%Y-%m-%d)
OUT_DIR="reports/$DATE/byd-audit-report-any-cleanup"
mkdir -p "$OUT_DIR"
```

### 阶段 3：7 类各自 grep 输出 file:line 清单

```bash
NOT_GEN() { grep -v "/public/static/" | grep -v "/charting_library/" | grep -v "\.d\.ts:" | grep -v "/out-rtl/" | grep -v "/out/"; }

grep -rEn "catch\s*\(\s*\w+\s*:\s*any\s*\)" --include="*.ts" --include="*.tsx" apps/ packages/ 2>/dev/null | NOT_GEN > "$OUT_DIR/A-catch-any.txt"
grep -rEn "useState<any>"                    --include="*.ts" --include="*.tsx" apps/ packages/ 2>/dev/null | NOT_GEN > "$OUT_DIR/B-useState-any.txt"
grep -rEn "useRef<any>"                      --include="*.ts" --include="*.tsx" apps/ packages/ 2>/dev/null | NOT_GEN > "$OUT_DIR/C-useRef-any.txt"
grep -rEn "Promise<any>"                     --include="*.ts" --include="*.tsx" apps/ packages/ 2>/dev/null | NOT_GEN > "$OUT_DIR/D-Promise-any.txt"
grep -rEn "Record<string,\s*any>"            --include="*.ts" --include="*.tsx" apps/ packages/ 2>/dev/null | NOT_GEN > "$OUT_DIR/E-Record-any.txt"
grep -rEn "as any\b"                         --include="*.ts" --include="*.tsx" apps/ packages/ 2>/dev/null | NOT_GEN > "$OUT_DIR/F-as-any.txt"
grep -rEn ":\s*any\[\]"                      --include="*.ts" --include="*.tsx" apps/ packages/ 2>/dev/null | NOT_GEN > "$OUT_DIR/G-any-array.txt"
```

### 阶段 4：F、G 类按文件聚合（量大，主报告里只列 Top 文件）

```bash
cut -d: -f1 "$OUT_DIR/F-as-any.txt"     | sort | uniq -c | sort -rn > "$OUT_DIR/F-as-any-by-file.txt"
cut -d: -f1 "$OUT_DIR/G-any-array.txt"  | sort | uniq -c | sort -rn > "$OUT_DIR/G-any-array-by-file.txt"
```

### 阶段 5：抽样验证（必做）

随机抽 5 行 A 类 catch 块，确认块内 `e` 的实际用法（直接传函数 / 访问属性 / 仅 log）。如果 100% 都是 optional chaining 或直接传参，说明改 `unknown` 改造成本低；如果多数访问 `e.message`，则需要在报告里明确标注"改造时必须补 type guard"。

```bash
for line in $(head -5 "$OUT_DIR/A-catch-any.txt" | cut -d: -f1,2); do
  file=$(echo "$line" | cut -d: -f1); ln=$(echo "$line" | cut -d: -f2)
  echo "--- $line ---"; sed -n "${ln},$((ln+8))p" "$file"; echo
done
```

### 阶段 6：生成主报告

写入 `reports/$DATE/byd-audit-report-any-cleanup-$DATE.md`，已存在则覆盖。

## 报告格式（固定 schema，不要自由发挥）

```markdown
# `any` 类型可消除清单

- 生成日期：YYYY-MM-DD
- 仓库分支：<git branch --show-current>
- 扫描范围：apps/byd-{ssg,ssr} + packages/{apps-kit,apps-ui,apps-icons,apps-base-kline,nex-theme}
- 文件类型：_.ts、_.tsx
- 已排除：node_modules/、out/、out-rtl/、public/static/charting_library/、\*.d.ts

---

## 一、总览

| 项                                                 | 数量         |
| -------------------------------------------------- | ------------ |
| `: any` 显式标注（含下表所有子类，去重生成文件后） | <wc -l>      |
| `as any` 类型断言                                  | <F 类 wc -l> |
| `any[]` / `Array<any>`                             | <G 类 wc -l> |

按可消除把握度分类：

| 类别                    | 数量 | 把握度    | 判定依据                           |
| ----------------------- | ---- | --------- | ---------------------------------- |
| A `catch (xxx: any)`    | N    | 100% 多余 | TS 4.4+ catch 默认 unknown         |
| B `useState<any>(...)`  | N    | 高        | 字面量初始值可推断                 |
| C `useRef<any>()`       | N    | 高        | DOM ref 应为具体类型               |
| D `Promise<any>`        | N    | 中高      | 多数函数有明确返回路径             |
| E `Record<string, any>` | N    | 中        | 多数能定义具体 interface           |
| F `as any`              | N    | 中        | 多为 hack，可改 unknown 或定义类型 |
| G `: any[]`             | N    | 中        | 多数初始化时可推断                 |

> A、B、C 三类合计 X 处风险最低、收益最直接，建议优先处理。

---

## 二、A 类：`catch (xxx: any)` — N 处

[改造建议 + 抽样验证表（5 个真实块的 e 用法）+ 热点文件 Top（≥3 处）]

完整清单：[`bydfi-audit-report-any-cleanup/A-catch-any.txt`](./byd-audit-report-any-cleanup/A-catch-any.txt)

## 三、B 类：`useState<any>(...)` — N 处

[改造建议 + 1 个具体改造样例（before/after）+ 热点文件 Top（≥2 处）]

完整清单：[`./byd-audit-report-any-cleanup/B-useState-any.txt`](./byd-audit-report-any-cleanup/B-useState-any.txt)

## 四、C 类：`useRef<any>()` — N 处

[改造建议表（DOM ref/第三方组件 ref/可变值）+ 1 个样例 + 热点文件 Top]

## 五、D 类：`Promise<any>` — N 处

## 六、E 类：`Record<string, any>` — N 处

## 七、F 类：`as any` — N 处（含 Top 20 文件按计数排序）

## 八、G 类：`: any[]` — N 处（含 Top 20 文件按计数排序）

---

## 九、推荐改造顺序

| 阶段 | 范围 | 数量 | 风险 | 价值                   |
| ---- | ---- | ---- | ---- | ---------------------- |
| 1    | A 类 | N    | 低   | 对齐 TS 4.4+ 默认      |
| 2    | C 类 | N    | 低   | DOM ref 类型可批量推断 |
| 3    | B 类 | N    | 低   | 字面量初始值直接推断   |
| 4    | E 类 | N    | 中   | 网络层先收敛           |
| 5    | D 类 | N    | 中   | 与网络层 E 类联动      |
| 6    | G 类 | N    | 中   | 按 store/types 分批    |
| 7    | F 类 | N    | 高   | 最难，逐个判断         |

最终建议：所有改造完成后将 `@typescript-eslint/no-explicit-any` 加入 `.eslintrc.json` 锁住增量。

---

## 十、附件清单
```

reports/YYYY-MM-DD/byd-audit-report-any-cleanup/
├── A-catch-any.txt # 全量 file:line:code
├── B-useState-any.txt
├── C-useRef-any.txt
├── D-Promise-any.txt
├── E-Record-any.txt
├── F-as-any.txt
├── F-as-any-by-file.txt # 按文件聚合 Top
├── G-any-array.txt
└── G-any-array-by-file.txt

```

```

## 报告输出路径

- 主报告：`reports/YYYY-MM-DD/byd-audit-report-any-cleanup-YYYY-MM-DD.md`
- 附件目录：`reports/YYYY-MM-DD/byd-audit-report-any-cleanup/*.txt`

已存在则覆盖。

## 已知陷阱

### 1. `*.d.ts` 必须排除

第三方库声明（charting_library、tradingview）含大量 `Record<string, any>`，混入会让 E 类数量虚高且无意义（声明文件改不动）。

### 2. `out/`、`out-rtl/` 必须排除

SSG 构建产物会拷贝 `public/static/` 进去，路径形如 `apps/byd-ssg/out-rtl/static/...`，扫描时如果不排会重复计数。

### 3. `useUnknownInCatchVariables` 依赖 TS 4.4+

`tsconfig.json` 的 `strict: true` 在 TS 4.4+ 默认开启 `useUnknownInCatchVariables`。本仓库 TS 4.9.5（满足）。如果未来降级 TS 版本，A 类的"100% 多余"结论需要重审。

### 4. `as any` 含部分难以消除的合法用法

并非所有 `as any` 都能消除，例如：

- `((window as any).gtag)` —— 在没装 `@types/gtag` 时是合理 hack
- 跨同名类型的窄化 —— 有时类型系统表达力不够

报告把 F 类标为「中」把握度而非「高」，是因为这部分需要逐个判断。

### 5. 类间重叠不要相加

`Record<string, any>` 也包含 `any`，但已经在 E 类被计了一次。把 A+B+C+D+E+F+G 相加 ≠ 总 any 数。报告总览用「`: any` 显式标注总数」+「七类各自计数」并列展示，避免误读。

### 6. `useState<any>` 抽样可能被注释掉的代码污染

抽样里出现过 `// const [list, setList] = useState<any>([]);`。改造时不要去动注释掉的代码——它们已经废弃，删除整行即可，不要"清理 any"。

## 注意事项

- **不修改源代码**：仅扫描 + 报告
- **类间允许重叠**：`: any[]` 同时也是 `: any`，不能把 7 类相加当总数；总数用「`: any` 显式标注（去除生成文件后）」单独 grep 一次得到
- **改造样例只给方向，不给具体类型**：具体类型由改造任务决定，skill 不替它判断
- **热点文件阈值**：A 类 ≥3 处，B/C 类 ≥2 处。低于阈值的不进主报告（在附件 txt 里）
- **不输出"建议"或"可能"的条目**：每条进入主报告的判定必须命中一个明确的 grep 模式
- **抽样验证不可省**：A 类必须看 5 个真实 catch 块；如果发现 grep 模式有误命中，先修 grep 再出报告

## 相关 skill

- **关联**：`bydfi-web-report-ts-candidates` — 先把 .js → .ts 才能消 any
- **互补**：`bydfi-web-report-dead-code` — 找未使用 export

按问题域查询完整 skill 索引：见 `.claude/skills/SKILL_BEST_PRACTICES.md` 的"问题域 → SoT skill 索引"章节。

## 运行后审查（单轮，不循环）

报告生成后：

1. **抽样验证**：随机抽 5 行 A 类、3 行 B 类、3 行 C 类，确认 grep 命中行真的是该类用法（不是字符串、注释、文档）
2. **总数对账**：「`: any` 显式标注总数」≥ 七类去重后并集；如果小于，说明 grep 模式有遗漏
3. **修正报告**：发现误判直接修改报告，不生成新版本
4. **陷阱沉淀**：发现新的误命中模式，补充到 SKILL.md「已知陷阱」节，下次运行生效

$ARGUMENTS
