---
allowed-tools: Skill
argument-hint: <figma-url> <file-path>
description: 根据 Figma 设计稿生成 BYDFi SSG UI 组件
author: Nilu
---

# 根据 Figma 设计稿生成 BYDFi SSG UI 组件

用法：

```bash
/byd-next:codegen-figma-ui [figma-url] [file-path]
```

示例：

```bash
/byd-next:codegen-figma-ui "https://www.figma.com/design/xxx/Design?node-id=1-2" apps/byd-ssg/src/components/example-card/index.tsx
```

## 参数

- `[figma-url]`：Figma 设计节点 URL，必须包含具体 `node-id`。
- `[file-path]`：要生成或更新的 UI 组件文件路径。

如果参数不足 2 个，先询问用户补充缺失参数：

1. Figma 设计节点 URL。
2. 要生成的组件文件路径。

如果 Figma URL 不包含 `node-id`，不要猜测节点 ID，必须要求用户提供带具体节点的 Figma URL。

## 必须使用的能力

执行时必须：

1. 使用 Figma MCP 读取设计稿：
   - 从 URL 中提取 `fileKey` 和 `nodeId`。
   - 调用 `get_design_context` 获取设计上下文、截图和资源信息。
   - `clientFrameworks` 使用 `react`。
   - `clientLanguages` 使用 `typescript,tsx,scss,css`。
   - 不要禁用 Code Connect，除非用户明确要求。
2. UI 风格必须使用 Skill 工具调用并遵守：`byd:codegen-design-system`

3. 结合当前项目已有组件、样式和导入习惯生成代码，不要机械复制 Figma 输出代码。

4. 若目标为 SSR 项目（如 `apps/byd-ssr`、`bydfi-ssr` 或 SSR 页面/组件），必须先读取并遵守 `.claude/skills/codegen/ssr-generate/SKILL.md`。
5. 若目标为 SSG 项目（如 `apps/byd-ssg`、`bydfi-ssg` 或 SSG 页面/组件），必须先读取并遵守 `.claude/skills/codegen/ssg-generate/SKILL.md`。

## 生成规则

### 1. 文件路径规则

- `[file-path]` 必须作为最终生成或更新的目标文件。
- 如果目标文件已存在，必须先读取现有文件，判断是覆盖、合并还是局部更新。
- 如果目标文件内容与用户描述不一致，先向用户说明，不要直接覆盖。
- 如果需要额外创建 `styles.tsx`、`index.ts`、子组件或资源文件，先说明原因；简单组件优先单文件完成。

### 2. BYDFi 设计系统规范

必须遵守 `byd:codegen-design-system`：

- 样式使用 styled-jsx / `<style jsx>`。
- 所有颜色必须使用项目 CSS 变量，例如 `--spec-*`、`--skin-*`、`--nex-*` 或已定义设计 token。
- 禁止硬编码颜色值，例如 `#fff`、`rgb(...)`、`rgba(...)`。
- 禁止引入 Tailwind、Bootstrap、CSS Modules、Emotion 等外部样式方案。
- 字体、字号、字重、间距要优先遵守现有 BYDFi 规范和设计系统约束。
- 需要考虑深色 / 浅色、黄色 / 蓝色 skin、RTL 和三端响应式。
- 覆盖组件的样式时，需使用`:global(.className){}` 才能生效.

### 4. Figma 到代码适配规则

- Figma MCP 返回的代码只作为参考，必须适配 BYDFi 项目结构。
- 不要直接照搬 Figma 的硬编码颜色、绝对定位、像素堆叠和无语义 className。
- 优先生成语义化结构和可维护 className。
- 对 Figma 中的图片、图标、背景图：
  - 如果是已有项目资源，优先复用已有资源。
  - 如果是 Figma 专属资源，根据 MCP 返回的资源 URL 下载到合理目录前先说明路径规划。
  - `alt` 文案必须使用 `LANG` 或明确为空装饰图。
- 对 Figma 中的文字：
  - 必须提取为 `LANG('文案')`。
  - 如果文案包含变量，使用 `LANG('xxx{value}xxx', { value })`。
- 对 Figma 中的布局：
  - 转为响应式 flex/grid，不要依赖固定大画布绝对定位。
  - 移动端、平板、桌面都要有合理断点。

## 执行流程

1. 解析 `[figma-url]` 和 `[file-path]`。
2. 校验 Figma URL 是否包含 `node-id`。
3. 调用 Figma MCP `get_design_context` 获取设计上下文。
4. 调用并遵守 `byd:codegen-design-system`。
5. 调用并遵守 `byd:codegen-ssg`。
6. 阅读目标文件（如果存在）和同目录/相邻组件写法。
7. 生成或更新 `[file-path]`。
8. 自检：
   - 是否存在硬编码颜色。
   - 是否存在硬编码用户可见文案。
   - 是否在函数外调用 `LANG`。
   - 是否使用浮点处理金融数据。
   - 是否擅自新增依赖。
   - 是否符合 SSG alias 和组件封装约定。
9. 如修改代码，按项目要求运行必要校验；至少说明建议执行：
   - `pnpm tsc:all`
   - 相关页面深/浅、黄/蓝、RTL、三端响应式检查。

## 输出要求

完成后输出：

- 生成/修改的文件列表。
- Figma 节点来源。
- 关键实现说明。
- 是否下载或新增资源。
- 已执行的校验命令和结果；如果未执行，说明原因。
- 仍需人工确认的视觉差异或交互点。
