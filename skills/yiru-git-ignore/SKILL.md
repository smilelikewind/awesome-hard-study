---
name: yiru-git-ignore
description: 将文件或文件夹从 Git 跟踪中移除，并加入 .gitignore 使其后续不再被跟踪。当用户说「忽略这个文件」「加入gitignore」「停止跟踪」「不要跟踪这个」时使用。
---

# yiru-git-ignore

将指定文件或文件夹从 Git 版本控制中移除，并添加到 `.gitignore` 中，确保后续不再被跟踪。

## 触发词

- 「忽略这个文件」「加入 gitignore」「停止跟踪」「不要跟踪这个」
- 「把这个从 git 里面去掉」「gitignore 里加一下」

## 工作流

### 步骤 1：确认目标路径

从用户输入中提取需要忽略的文件或文件夹路径。支持：
- 单个文件，如 `.python-version`、`config.local.json`
- 单个文件夹，如 `oh-my-openagent/`、`node_modules/`
- 多个文件/文件夹（逐个处理）

如果路径是相对路径，以工作区根目录为基准补全。

### 步骤 2：从 Git 跟踪中移除

```bash
cd <workspace> && git rm --cached <path>
```

- 使用 `--cached` 参数：仅从索引中移除，保留本地文件
- 如果是文件夹，Git 会自动处理其内部所有文件
- 如果文件从未被 add 过（untracked），此步骤可跳过

### 步骤 3：添加到 .gitignore

读取工作区根目录的 `.gitignore` 文件，在合适位置添加忽略规则。

规则格式：
- 文件直接写文件名：`文件名`
- 文件夹写目录名加斜杠：`文件夹名/`

找到合理的分组位置插入，不要破坏现有分组结构。如果没有合适分组，在文件末尾追加。

### 步骤 4：验证

```bash
cd <workspace> && git status
```

确认：
- 目标文件已从已跟踪列表中移除
- 目标文件出现在 `.gitignore` 的忽略规则中
- 如果文件已被 `.gitignore` 忽略，`git status` 中不应再出现该文件

## 注意事项

- **绝不**使用 `git rm`（不带 `--cached`），这会删除本地文件
- 如果目标路径不存在于仓库中，先告知用户
- 如果路径已经在 `.gitignore` 中，只需从 git 跟踪中移除即可
- 处理完成后提示用户，如需提交更改可使用「提交并推送」

## 示例

用户：「把 .python-version 加入 gitignore」

→ `git rm --cached .python-version` → 在 `.gitignore` 中添加 `.python-version` → 验证 `git status`
