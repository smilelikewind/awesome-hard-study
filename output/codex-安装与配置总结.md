# Codex CLI 安装与 DeepSeek 模型配置总结

## 一、环境信息

| 项目 | 内容 |
|------|------|
| 操作系统 | macOS 12.7.6 (Darwin) |
| Shell | /bin/zsh |
| 工作目录 | `/Users/xiaoq/ai-workspace` |
| Codex 版本 | v0.142.3 |
| 后端模型 | DeepSeek V4 Pro (V4 Flash 备选) |

---

## 二、安装 Codex CLI

```bash
npm install -g @openai/codex
# 或使用国内镜像加速
npm install -g @openai/codex --registry=https://registry.npmmirror.com
```

验证安装：

```bash
codex --version
# 输出: codex-cli 0.142.3
```

---

## 三、关于协议兼容性的关键发现

**核心问题**：Codex CLI v0.130+ **强制使用 OpenAI Responses API**（`/v1/responses`），而 DeepSeek 官方仅提供 **Chat Completions API**（`/v1/chat/completions`），两者无法通过修改 `base_url` 直连。

| 维度 | Codex 新版 | DeepSeek |
|------|-----------|----------|
| API 路径 | `/v1/responses` | `/v1/chat/completions` |
| wire_api 参数 | 必须为 `"responses"` | 不支持 |
| 消息结构 | `input` + `items` 事件流 | `messages` 数组 |
| 原生兼容 | — | ❌ 无法直连 |

**解决方案**：在本机部署轻量协议桥接代理，将 Codex 的 Responses API 请求翻译为 DeepSeek 能理解的 Chat Completions 格式。

---

## 四、配置文件

### 4.1 `~/.codex/config.toml`

```toml
model = "moonbridge"
model_provider = "moonbridge"
model_reasoning_effort = "high"
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.moonbridge]
name = "Moon Bridge"
base_url = "http://127.0.0.1:38440/v1"
wire_api = "responses"
```

### 4.2 `~/.codex/models_catalog.json`

```json
{
  "moonbridge": {
    "model": "moonbridge",
    "provider": "moonbridge",
    "context_window": 1000000,
    "max_output_tokens": 65536,
    "supports_reasoning": true,
    "reasoning_effort": {"default": "high", "supported": ["high"]},
    "supports_tools": true,
    "supports_file_upload": false
  }
}
```

### 4.3 `~/.codex/auth.json`

```json
{"OPENAI_API_KEY": "sk-5f23c8842a3f4564a8a62db70bcc803c"}
```

---

## 五、本地桥接代理

文件路径：`/Users/xiaoq/ai-workspace/codex-bridge-proxy.js`

这是一个纯 Node.js（零依赖）实现的协议转换代理，主要职责：

1. 接收 Codex 发来的 Responses API 请求
2. 提取消息并转换为 Chat Completions 格式
3. 转发给 DeepSeek API (`https://api.deepseek.com`)
4. 将 DeepSeek 的响应转换回 Responses API 格式（含 SSE 流式事件）
5. 返回给 Codex

支持的 SSE 事件序列：

```
response.created → response.in_progress
→ response.output_item.added → response.content_part.added
→ response.output_text.delta → response.output_text.done
→ response.content_part.done → response.output_item.done
→ response.completed → [DONE]
```

---

## 六、日常使用方法

每次使用需要开两个终端：

**终端 1** — 启动桥接代理：

```bash
node /Users/xiaoq/ai-workspace/codex-bridge-proxy.js
```

**终端 2** — 启动 Codex：

```bash
cd 你的项目目录
codex
```

---

## 七、模型切换

当前默认使用 **deepseek-v4-pro**。如需切换到 **deepseek-v4-flash**，修改代理文件中的模型映射：

```javascript
// codex-bridge-proxy.js 第 112 行附近
const model = (codexReq.model === 'moonbridge') ? 'deepseek-v4-pro' : codexReq.model;
// 改为：
const model = (codexReq.model === 'moonbridge') ? 'deepseek-v4-flash' : codexReq.model;
```

| 模型 | 适用场景 | 成本 |
|------|---------|------|
| `deepseek-v4-pro` | 复杂推理、代码审查、架构分析 | 较高 |
| `deepseek-v4-flash` | 日常开发、简单问答、快速反馈 | 较低 |

> **注意**：旧版 `deepseek-chat` 和 `deepseek-reasoner` 将于 2026/07/24 弃用，请使用 V4 系列模型名。

---

## 八、验证方法

```bash
# 非交互模式测试
codex exec --skip-git-repo-check "你好"

# 或通过 curl 直接测试代理
curl http://127.0.0.1:38440/v1/responses \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4-pro","input":"你好","max_output_tokens":1024}'
```

---

## 九、排错记录

| 问题 | 原因 | 解决 |
|------|------|------|
| `unknown variant 'chat_completions'` | Codex v0.142.3 只认 `wire_api = "responses"` | 使用 `"responses"` |
| `404 Not Found: /v1/responses` | DeepSeek 不支持 Responses API | 部署桥接代理 |
| `unknown variant 'input_text'` | Codex 发 `{type:"input_text"}`，DeepSeek 要字符串 | 代理中提取 `part.text` |
| `unknown variant 'developer'` | Codex 用 `role:"developer"`，DeepSeek 只认 `system` | 代理中做角色映射 |
| `stream closed before response.completed` | SSE 事件格式不完整 | 按 Responses API 规范补全 9 个事件 |
| `missing field 'input_tokens'` | DeepSeek 返回 `prompt_tokens` 而非 `input_tokens` | 代理中做字段名转换 |
