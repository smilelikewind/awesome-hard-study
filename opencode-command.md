# OpenCode 命令系统完整指南

## 📋 概述

OpenCode 提供了完整的命令系统，与 Claude Code 高度兼容，同时支持更灵活的自定义方式。

---

## 🔹 一、TUI Slash 命令（交互模式）

在 `opencode` 交互界面中使用 `/` 前缀：

| 命令 | 快捷键 | 功能 |
|------|--------|------|
| `/help` | `Ctrl+X H` | 显示帮助 |
| `/new` `/clear` | `Ctrl+X N` | 新建会话 |
| `/undo` | `Ctrl+X U` | 撤销上条消息 |
| `/redo` | `Ctrl+X R` | 重做撤销的消息 |
| `/model` | `Ctrl+X M` | 切换模型 |
| `/agent` | - | 切换代理 |
| `/sessions` | `Ctrl+X L` | 列出/切换会话 |
| `/compact` | `Ctrl+X C` | 压缩/总结会话 |
| `/share` | `Ctrl+X S` | 生成分享链接 |
| `/export` | `Ctrl+X X` | 导出为 Markdown |
| `/init` | `Ctrl+X I` | 创建 AGENTS.md |
| `/details` | `Ctrl+X D` | 切换工具执行详情 |
| `/cost` | - | 显示 token 费用 |
| `/config` | - | 编辑配置 |
| `/thinking` | - | 切换思考过程显示 |
| `/exit` `/quit` | `Ctrl+X Q` | 退出 |

---

## 🔹 二、CLI 命令（终端模式）

| 命令 | 功能 | 示例 |
|------|------|------|
| `opencode [dir]` | 启动 TUI 会话 | `opencode my-project` |
| `opencode run` | 非交互模式运行 | `opencode run "修复 bug"` |
| `opencode models` | 列出可用模型 | `opencode models anthropic` |
| `opencode serve` | 启动无头 API 服务器 | `opencode serve --port 4096` |
| `opencode session list` | 管理会话 | `opencode session list` |
| `opencode mcp add` | 管理 MCP 服务器 | `opencode mcp add` |
| `opencode auth` | 管理凭证 | `opencode auth login` |
| `opencode stats` | Token 使用统计 | `opencode stats --days 7` |
| `opencode upgrade` | 更新 OpenCode | `opencode upgrade v0.1.48` |

---

## 🔹 三、自定义命令（两种方式）

### 方式 1：Markdown 文件方式 ✨

**命令目录位置**：
- 全局：`~/.config/opencode/commands/*.md`
- 项目：`.opencode/commands/*.md`

**示例：`test.md`**
```markdown
---
description: 运行测试套件
model: anthropic/claude-3-5-sonnet
agent: build
variables:
  - name: target
    description: 测试目标
    default: .
---

运行 ${target} 目录的测试：
!npm test -- --coverage

分析测试结果并提供修复建议。
```

**使用**：`/test target=src/auth`

---

### 方式 2：配置文件方式

在 `.opencode/config.json` 中定义：
```json
{
  "command": {
    "fix-lint": {
      "template": "运行 eslint 自动修复所有 lint 错误",
      "description": "自动修复 ESLint",
      "agent": "quick"
    }
  }
}
```

---

## 🔹 四、特殊语法速查

| 语法 | 说明 | 示例 |
|------|------|------|
| `$ARGUMENTS` | 接收所有参数 | `/create Button` → `$ARGUMENTS` = "Button" |
| `$1, $2, $3` | 位置参数 | `/deploy prod` → `$1` = "prod" |
| `` !`cmd` `` | 注入 bash 输出 | `` !`git diff --name-only` `` |
| `@path` | 引用文件内容 | `@src/auth.js` |

---

## 🔹 五、Claude Code 兼容性 ✅

OpenCode **原生支持** Claude Code 配置：
- 自动读取 `.claude/skills/` 目录下的技能文件
- 自动读取 `CLAUDE.md` 系统提示
- 语法 100% 兼容

**禁用兼容**（可选）：
```bash
OPENCODE_DISABLE_CLAUDE_CODE=1
OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1
```

---

## 🔹 六、功能对比

| 特性 | OpenCode | Claude Code |
|------|----------|-------------|
| 内置命令 | 17+ 个 | 70+ 个 |
| 自定义命令 | Markdown + JSON | Markdown 仅 |
| 多模型支持 | ✅ 75+ 供应商 | ⚠️ 仅 Claude |
| 本地模型 | ✅ Ollama 等 | ❌ 不支持 |
| 服务器模式 | ✅ | ❌ |
| GitHub 集成 | ✅ | ✅ |
| MCP 支持 | ✅ | ✅ |
| Claude Skills 兼容 | ✅ | ✅ |

---

## 🔹 七、最佳实践

1. **常用命令全局化** - 通用命令放在 `~/.config/opencode/commands/`
2. **项目命令本地化** - 特定项目命令放在 `.opencode/commands/`
3. **善用变量** - 添加 `variables` 提高复用性
4. **注入上下文** - 使用 `` !`cmd` `` 自动获取 Git/文件等上下文
5. **复用配置** - 直接复用 Claude Code 的 `.claude/skills/` 无需迁移

---

## 📚 参考文档

- 官方文档：https://opencode.ai/docs/commands/
- GitHub：https://github.com/anomalyco/opencode
