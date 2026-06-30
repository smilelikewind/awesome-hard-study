---
name: yiru-commit-and-push
description: 提交本地所有更改并推送到远端同名分支。当用户说「提交并推送」「commit and push」「push 一下」「推上去」时使用。
---

# yiru-commit-and-push

快速将本地更改提交并推送到远端同名分支。

## 触发词

- 「提交并推送」「commit and push」「push 一下」「推上去」
- 「commit 并 push 到远端」

## 工作流

### 步骤 1：检查状态

在工作区根目录执行：

```bash
cd <workspace> && git status
```

确认有需要提交的更改。如果没有更改（working tree clean），直接告知用户无需操作。

### 步骤 2：获取当前分支名

```bash
cd <workspace> && git branch --show-current
```

记录当前分支名，用于后续 push。

### 步骤 3：添加并提交

```bash
cd <workspace> && git add -A && git commit -m "<简短有意义的提交信息>"
```

- 使用 `git add -A` 添加所有更改（包括新增和删除）
- 提交信息需用中文简要描述本次改动内容
- **如果用户未提供提交信息**，根据 `git status` 的变更内容自动生成一条描述性信息

### 步骤 4：推送到远端

```bash
cd <workspace> && git push origin <当前分支名>
```

直接推送到远端同名分支，不使用 `--force`，避免覆盖远端历史。

## 安全检查

- **绝不使用 `--force`** 推送，除非用户明确要求
- 如果远端有新的提交，先告知用户需要 `git pull` 后再推送
- 如果 GitHub Push Protection 拦截（密钥扫描），按 [GitHub Push Protection 密钥扫描拦截] 经验处理

## 示例

用户说：「提交并推送」

→ 执行 `git add -A && git commit -m "更新研究报告" && git push origin main`
