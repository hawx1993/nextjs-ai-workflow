---
name: branch
description: 分支规则
author: steve
---

# 分支命名规则（bydfi-web）

## 1. 目标与适用范围

1. 本规则用于统一 `bydfi-web` 仓库分支命名、来源基线与合流方向。
2. 本规则仅定义命名与流程约束，不包含自动化校验实现。
3. 适用对象：`main`、`release/*`、版本发布分支、个人功能分支。

## 2. 分支类型与命名格式

### 2.1 主分支

- 格式：`main`
- 用途：生产基线分支。
- 合流约束：`main` 必须仅接受 `release/*` 分支的合并。

### 2.2 主分支临时修改分支

- 格式：`main/{owner}/{topic}`
- 示例：`main/steve/fix-header-style`
- 用途：主分支相关的临时修复或配置调整。
- 来源基线：从 `main` 拉取。
- 目标合流：合并回 `main`。
- 禁止：跨项目功能开发长期滞留在 `main/*`。

### 2.3 项目同步分支

- 格式：`release/{project}`
- `project` 允许值：`ssg`、`ssr`、`web3`
- 示例：`release/ssg`、`release/ssr`、`release/web3`
- 用途：各项目线上运行版本同步与迭代。
- 合流约束：未经测试代码禁止合入 `release/*`。

### 2.4 版本发布分支

- 格式：`{project}/{version}`
- `project` 允许值：`ssg`、`ssr`、`web3`
- 示例：`ssg/01.30`、`ssr/2.1.0`
- 用途：特定版本需求的开发合流。
- 来源基线：从对应 `release/{project}` 拉取。
- 目标合流：测试通过后合并至对应 `release/{project}`。

### 2.5 个人功能分支

- 格式：`{project}/{owner}/{topic}`
- `project` 允许值：`ssg`、`ssr`、`web3`
- 示例：`ssg/steve/swap-spsl`
- 用途：开发者日常需求开发分支。
- 来源基线：从对应 `release/{project}` 或对应 `{project}/{version}` 拉取。
- 目标合流：按需求合并到对应 `{project}/{version}` 或 `release/{project}`。

## 3. 合流关系

1. 标准主链路：`{project}/{owner}/{topic}` → `{project}/{version}` → `release/{project}` → `main`。
2. 无版本需求时允许：`{project}/{owner}/{topic}` → `release/{project}` → `main`。
3. `main/*` 仅用于主分支相关临时改动，完成后必须尽快回合到 `main`。

## 4. 命名约束

1. 分隔符必须使用 `/`，禁止使用空格。
2. `project` 必须为 `ssg|ssr|web3`。
3. `owner` 必须使用可识别人员标识，允许字符：字母、数字、`-`、`_`。
4. `topic` 必须表达需求语义，允许字符：字母、数字、`-`、`_`，禁止为空。
5. `version` 必须为版本标识（如 `01.30`、`2.1.0`）。

## 5. 正反示例

### 5.1 合法示例

- `main`
- `main/steve/fix-zendesk-lockfile`
- `release/ssg`
- `ssr/2.1.0`
- `web3/chad/fix-transfer-api`

### 5.2 非法示例

- `release/ui`
  - 非法原因：`project` 不在允许值 `ssg|ssr|web3` 内。
- `ssg//fix-login`
  - 非法原因：`owner` 为空。
- `main/steve`
  - 非法原因：缺少 `topic` 段。
- `web3/steve/`
  - 非法原因：`topic` 为空。

## 6. 常见误用与纠正

1. 误用：在 `main` 直接开发功能需求。
   - 纠正：功能需求必须使用 `{project}/{owner}/{topic}`。
2. 误用：将未经测试代码合入 `release/*`。
   - 纠正：必须先通过测试再合入。
3. 误用：将版本需求直接合入 `main`。
   - 纠正：必须经 `release/{project}` 再合入 `main`。
4. 误用：`release/*` 与 `{project}/{version}` 职责混用。
   - 纠正：`release/*` 表示项目线上同步分支，`{project}/{version}` 表示特定版本开发合流分支。
