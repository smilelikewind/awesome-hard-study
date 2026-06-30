---
name: yiru-skill-install
description: 通过符号链接安装技能到 Qoder skills 目录。当用户说"安装这个技能"、"安装skill"、"把这个目录安装为技能"、"软连接到skills"时使用此技能。
---

# Yiru Skill Install

将用户指定的技能文件夹通过符号链接安装到 `/Users/xiaoq/.qoder-cn/skills/` 目录，
使 Qoder 能自动发现和加载该技能。

## 触发条件

- 用户提供了一个技能文件夹的路径
- 用户说"安装这个技能"、"安装到skills"、"软连接到skills目录"等

## 工作流程

### 1. 确认来源目录

从用户获取技能文件夹的绝对路径。如果用户提供的是相对路径，用当前工作目录补全。

### 2. 验证有效性

检查来源目录是否合法：
- 目录必须存在
- 目录内必须包含 `SKILL.md` 文件
- 如不满足，停止安装并告知用户原因

### 3. 获取技能名称

读取 `SKILL.md` 的 frontmatter，提取 `name` 字段作为技能名。
如果 frontmatter 中没有 `name`，则使用目录名作为技能名。

### 4. 创建符号链接

```bash
ln -sfn <来源目录绝对路径> /Users/xiaoq/.qoder-cn/skills/<技能名>
```

- 使用 `-n` 参数：如果目标已是目录的符号链接，替换它而不是进入它
- 使用绝对路径作为源，确保链接不因 skills 目录移动而断开
- 如果目标已存在同名链接，会被覆盖（`-f`）

### 5. 验证安装

```bash
ls -la /Users/xiaoq/.qoder-cn/skills/<技能名>
```

确认链接指向正确的来源目录，且 SKILL.md 可读取。

### 6. 报告结果

向用户报告：
- ✓ 技能名称
- 来源路径 → 链接路径
- 提示技能已可被 Qoder 自动发现

## 批量安装

如果用户一次提供多个技能目录，对每个目录重复步骤 2-6。

参考案例：之前将 `/Users/xiaoq/github/ai-berkshire/codex-skills/` 下 19 个技能
一次性全部安装到 `/Users/xiaoq/.qoder-cn/skills/`。

## 注意事项

- 安装的是符号链接，源目录更新时目标自动同步
- 如果目标已存在同名目录（非链接），先用 `ls -la` 确认情况再决定是否覆盖
- `npx skills add` 安装的技能通常在 `~/.codewhale/skills/`，需要手动链接到 qoder-cn
