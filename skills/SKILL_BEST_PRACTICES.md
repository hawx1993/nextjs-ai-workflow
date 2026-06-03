# Skill 实践指南

本文件是 `.claude/skills/` 下所有自定义 skill 的统一规范，基于 [Anthropic 官方 skill 最佳实践](https://code.claude.com/docs/en/skills.md)。新建 skill 前必读；改造现有 skill 以本文件为准。

---

## 何时脚本化

| 判定项                                  | 适合脚本化 | 适合纯 markdown |
| --------------------------------------- | :--------: | :-------------: |
| 任务是否纯机械（grep / parse / 计数）？ |     是     |       否        |
| 跨次结果是否应完全一致？                |     是     |     不要求      |
| 是否需要语义判断 / 创意 / 审美？        |     否     |       是        |
| 输入是否有限可枚举？                    |     是     |    输入开放     |

**决策规则**：判定项全部"适合脚本化"方向 → 必须脚本化；任意一项落在"适合纯 markdown" → 纯 markdown 即可。

**脚本化收益**：同 git state 下两次执行输出 byte-byte 一致（deterministic），消除 LLM 注意力漂移。纯 markdown skill 每次靠 Claude 即时执行，机械型任务漂移严重（项目 memory 记录 2.5/5）。

**脚本语言惯例**：Node.js + 标准库（`fs` / `child_process` / `RegExp`），不引入 Python / 第三方依赖。

---

## 命名约定

- 全部用 `bydfi-web-` 前缀（项目隔离，避免与其他 plugin namespace 冲突）
- **`bydfi-web-report-*`**：扫描审计型，**输出到 `reports/YYYY-MM-DD/`**（必须）
- **`bydfi-web-git-*`**：git 操作类（commit / pr / branch 操作）
- **`bydfi-web-code-*`**：代码相关动作（generate / review）
- 其它独立功能用动词后缀，但若产出 reports/ 文件应改为 `report-` 前缀
- skill 目录名 = `name` 字段值（保持完全一致）

---

## frontmatter 标准

| 字段                       |        必填        | 项目惯例               | 说明                                                               | 示例值                    |
| -------------------------- | :----------------: | ---------------------- | ------------------------------------------------------------------ | ------------------------- |
| `name`                     | 否（目录名一致时） | 显式写                 | 工具读取友好，不写则回退目录名                                     | `bydfi-web-report-branch` |
| `description`              |         是         | < 500 字，含触发关键词 | 上限 1536 字符（含 `when_to_use`）；关键词影响 Claude 自动选 skill | `扫描所有分支...分析时效` |
| `disable-model-invocation` |         否         | **`true`**             | 避免 Claude 误触发；仅用户手动 `/skill-name` 调用                  | `true`                    |
| `allowed-tools`            |         否         | 按需填                 | 激活时免审批工具清单，只列最小必要集合                             | `Bash, Read, Write`       |
| `argument-hint`            |         否         | 接参数时填             | 参数提示，显示在 `/` 补全界面                                      | `[days=30]`               |

---

## 章节标准

### 脚本化型推荐顺序

1. 简短引言段（1-3 句：这个 skill 做什么 + 输出到哪）
2. `## 调用方式` — 完整命令示例，含 `mkdir -p reports/$(date +%Y-%m-%d)`
3. `## 输出位置` — `reports/YYYY-MM-DD/<filename>.md`（reports/ 已 gitignore）
4. `## 判定规则（已固化，勿动）` — 固化规则列表，直接对应脚本逻辑
5. `## 扫描覆盖` — 表格列：扫描根 / 跳过目录 / 扫描扩展名
6. `## 已知陷阱` — 历史踩坑，含背景和修复方案
7. `## Cross-check 锚点` — **脚本化型必填**；列出脚本内置的 sanity check 项
8. `## 触发场景` — 什么情况下该跑这个 skill
9. `## 注意事项` — 末尾必含"脚本是唯一信息源，禁止手工调整数字"

### 不脚本化型推荐顺序

1. 简短引言段
2. `## 参数` 或 `## 执行流程`
3. `## 输出格式` 或 `## 报告格式`
4. `## 已知陷阱` 或 `## 局限说明`
5. `## 失败降级`
6. `## 注意事项`

### 长度上限

**< 500 行**（Anthropic 官方推荐）。超过则拆 `reference.md` 或 `examples/` 子目录，SKILL.md 只保留主流程。

---

## 辅助文件结构

```
my-skill/
├── SKILL.md           主指令（必填，< 500 行）
├── reference.md       按需加载详细规则（超出 500 行时拆到这里）
├── examples/          用例集合（长示例不放 SKILL.md）
└── scripts/
    └── audit.mjs      Node 脚本（脚本化型必填，放 scripts/ 子目录）
```

- `reference.md`：SKILL.md 里用 `Read` 工具按需加载，不自动全量注入 context
- `scripts/`：Anthropic 官方推荐子目录；脚本放顶层（历史遗留）应迁移
- `examples/`：长示例、边界用例；Claude 执行时可引用

新建 skill 直接 `cp -r .claude/skills/_TEMPLATE/ .claude/skills/<new-skill>/`。

---

## 现有 19 个 skill 归类

### 已脚本化（1）

- `bydfi-web-report-apps-kit-shared`：扫描 apps-kit shared 组件引用，已有 `scripts/audit.mjs`

### 强烈建议脚本化（8，机械度高）

- `bydfi-web-report-any-cleanup`：扫描待清理代码
- `bydfi-web-report-ts-candidates`：扫描 JS → TS 迁移候选文件
- `bydfi-web-report-theme`：扫描主题变量使用
- `bydfi-web-report-version-inconsistency`：扫描依赖版本不一致（样板 1，本次脚本化）
- `bydfi-web-report-dead-deps`：扫描未使用依赖
- `bydfi-web-report-deps-vuln`：扫描依赖漏洞
- `bydfi-web-report-branch`：扫描所有分支时效
- `bydfi-web-tree-shaking-check`：扫描 tree-shaking 问题（662 行，同时待拆 reference.md）

### 半脚本化（5，机械索引 + LLM 语义判断，后续 PR 处理）

- `bydfi-web-report-dead-code`：扫描死代码（666 行，待拆 reference.md）
- `bydfi-web-report-i18n`：扫描 i18n 覆盖缺口
- `bydfi-web-report-memory-leak`：扫描内存泄漏风险（559 行，待拆 reference.md）
- `bydfi-web-report-security`：扫描安全风险
- `bydfi-web-report-seo`：扫描 SEO 问题

### 不应脚本化（5，创意 / 审查 / 总结型）

- `bydfi-web-code-generate`：代码生成，需 LLM 理解需求
- `bydfi-web-code-review`：代码审查，需 LLM 语义理解
- `bydfi-web-git-commit`：创建 git commit，需 LLM 撰写 commit message（样板 3）
- `bydfi-web-git-pr`：创建 PR，需 LLM 撰写 PR description
- `bydfi-web-report-pre-release`：发版前检查，需 LLM 解读 diff 分级（样板 2，已完成命名修正）

### 待拆 reference.md（3，行数 > 500）

- `bydfi-web-report-dead-code`：666 行
- `bydfi-web-tree-shaking-check`：662 行
- `bydfi-web-report-memory-leak`：559 行

---

## 问题域 → SoT skill 索引

每类问题指向唯一的 Single Source of Truth (SoT) skill，避免重复造轮子和命名歧义。

| 问题域                                   | SoT skill                                                                         |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| 内存泄漏                                 | `bydfi-web-report-memory-leak`                                                    |
| i18n 翻译完整性                          | `bydfi-web-report-i18n`                                                           |
| 依赖版本一致性                           | `bydfi-web-report-version-inconsistency`                                          |
| 死依赖                                   | `bydfi-web-report-dead-deps`                                                      |
| 依赖漏洞                                 | `bydfi-web-report-deps-vuln`                                                      |
| 死代码（文件 / 函数 / 类型 / enum 成员） | `bydfi-web-report-dead-code`                                                      |
| `.js` → TS 化候选                        | `bydfi-web-report-ts-candidates`                                                  |
| `any` 类型清理                           | `bydfi-web-report-any-cleanup`                                                    |
| 主题合规（硬编码颜色 / 深浅模式 / RTL）  | `bydfi-web-report-theme`                                                          |
| SEO 配置                                 | `bydfi-web-report-seo`                                                            |
| Tree-shaking 违规                        | `bydfi-web-tree-shaking-check`                                                    |
| 远程分支盘点                             | `bydfi-web-report-branch`                                                         |
| 安全审查（13 维度）                      | `bydfi-web-report-security`                                                       |
| apps-kit 模块共享性                      | `bydfi-web-report-apps-kit-shared`                                                |
| 代码规范违规（项目编码规范）             | `bydfi-web-code-review`                                                           |
| 发版前综合质检                           | `bydfi-web-report-pre-release` ⚠️ **应聚合上述 SoT skill 的最近报告，不重做判定** |

**冲突时优先级**：

- 发版前应先跑各 SoT skill 生成原始报告（输出到 `reports/YYYY-MM-DD/`），再跑 `pre-release` 聚合
- `pre-release` 当前实现仍在独立 LLM 解读 diff，跨次结果可能与 SoT skill 漂移；改聚合模式见 follow-up plan Batch C.1
- 团队遇到命名相近 skill 时（如 `dead-code` vs `dead-deps`），按上表问题域定位 SoT，避免误用

---

## Next.js + React + TSX 日常工作流

本仓库新增 3 个日常 workflow skill，作为 Next.js + React + TSX 代码实现的默认入口：

| 问题域                     | SoT skill             | 推荐命令                                                    |
| -------------------------- | --------------------- | ----------------------------------------------------------- |
| 需求规划 / 实现 / 构建修复 | `bydfi-nextjs-dev`    | `/byd:dev-plan`、`/byd:dev-implement`、`/byd:dev-fix-build` |
| React/TSX 代码审查         | `bydfi-nextjs-review` | `/byd:dev-review`                                           |
| 交付前验证                 | `bydfi-nextjs-verify` | `/byd:dev-verify`                                           |

这些 skill 只覆盖 Next.js + React + TSX 开发，不替代既有审计类 skill。专项质量检查仍使用 `audit/*`。

---

## 新建 Skill 检查清单

改动或新建 skill 时逐项对照：

- [ ] `name` 字段与目录名一致，或已说明 slash command 暴露名称与目录名的差异
- [ ] `description` 含触发关键词，< 500 字
- [ ] `disable-model-invocation: true`
- [ ] `allowed-tools` 只列最小必要集合
- [ ] 章节顺序符合本文件"脚本化型"或"不脚本化型"推荐顺序
- [ ] SKILL.md < 500 行（超出则拆 reference.md）
- [ ] 脚本放 `scripts/` 子目录，不放顶层
- [ ] 脚本型：包含 cross-check 锚点 + deterministic 两次跑 diff 验证
- [ ] report-\* skill：输出路径为 `reports/YYYY-MM-DD/`
- [ ] 此 skill 出现在本文件 SoT 索引或 `.claude/skills/README.md`
