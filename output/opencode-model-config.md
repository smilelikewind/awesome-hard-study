# OpenCode 模型配置说明

## 概述

本文档说明了如何配置 OpenCode 的模型设置，包括默认模型、Provider 配置以及 Agent/Category 模型分配。

## 配置文件位置

OpenCode 的模型配置主要涉及两个文件：

| 文件路径 | 用途 |
|----------|------|
| `~/.config/opencode/opencode.json` | 主配置文件，定义默认模型和 Provider |
| `~/.config/opencode/oh-my-openagent.json` | Agent 和 Category 的模型配置 |

## 配置文件结构

### opencode.json

主配置文件包含以下关键字段：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "provider-name/model-name",
  "provider": {
    "provider-name": {
      "npm": "npm-package-name",
      "name": "display-name",
      "options": {
        "baseURL": "api-endpoint",
        "apiKey": "your-api-key"
      },
      "models": {
        "model-name": {
          "name": "model-display-name",
          "limit": {
            "context": context-window-size,
            "output": max-output-tokens
          }
        }
      }
    }
  },
  "plugin": [
    "plugin-name@version"
  ]
}
```

### oh-my-openagent.json

Agent 和 Category 配置文件结构：

```json
{
  "$schema": "schema-url",
  "agents": {
    "agent-name": {
      "model": "provider-name/model-name"
    }
  },
  "categories": {
    "category-name": {
      "model": "provider-name/model-name"
    }
  }
}
```

## 本次修改内容

### 1. 新增 DeepSeek Provider

在 `opencode.json` 中新增了 DeepSeek provider 配置：

```json
"deep-seek": {
  "npm": "@ai-sdk/openai-compatible",
  "name": "deep-seek",
  "options": {
    "baseURL": "https://api.deepseek.com",
    "apiKey": "sk-d5f8a2fc447d49258686b5d4253fff50"
  },
  "models": {
    "deepseek-v4-flash": {
      "name": "deepseek-v4-flash",
      "limit": {
        "context": 1000000,
        "output": 384000
      }
    },
    "deepseek-v4-pro": {
      "name": "deepseek-v4-pro",
      "limit": {
        "context": 1000000,
        "output": 384000
      }
    }
  }
}
```

### 2. 设置默认模型

将默认模型从 `byte-dance/ark-code-latest` 更改为 `deep-seek/deepseek-v4-pro`：

```json
"model": "deep-seek/deepseek-v4-pro"
```

### 3. 更新 Agent 和 Category 模型

将 `oh-my-openagent.json` 中所有 agents 和 categories 的模型更新为 `deep-seek/deepseek-v4-pro`：

- **10 个 Agents**: hephaestus, oracle, librarian, explore, multimodal-looker, prometheus, metis, momus, atlas, sisyphus-junior
- **8 个 Categories**: visual-engineering, ultrabrain, deep, artistry, quick, unspecified-low, unspecified-high, writing

## 模型详情

### DeepSeek V4 模型

| 模型 | 上下文窗口 | 最大输出 | 适用场景 |
|------|------------|----------|----------|
| `deepseek-v4-pro` | 1,000,000 tokens | 384,000 tokens | 高级推理、复杂编码任务 |
| `deepseek-v4-flash` | 1,000,000 tokens | 384,000 tokens | 快速响应、成本敏感场景 |

**特性：**
- 支持思考模式（Thinking Mode）
- 支持工具调用（Tool Calls）
- MIT 开源许可证

### ByteDance Ark 模型

| 模型 | 上下文窗口 | 最大输出 | 适用场景 |
|------|------------|----------|----------|
| `ark-code-latest` | 256,000 tokens | 256,000 tokens | 代码生成、通用任务 |

## 使用示例

### 选择模型

在 OpenCode 中使用模型时，格式为 `provider-name/model-name`：

```
deep-seek/deepseek-v4-pro
deep-seek/deepseek-v4-flash
byte-dance/ark-code-latest
```

### 配置 Agent 模型

为特定 agent 配置模型：

```json
{
  "agents": {
    "oracle": {
      "model": "deep-seek/deepseek-v4-pro"
    }
  }
}
```

### 配置 Category 模型

为任务类别配置模型：

```json
{
  "categories": {
    "deep": {
      "model": "deep-seek/deepseek-v4-pro"
    }
  }
}
```

## 注意事项

1. **API Key 安全**: 请妥善保管 API Key，不要提交到版本控制系统
2. **模型兼容性**: 确保 Provider 的 npm 包已正确安装
3. **上下文限制**: 注意模型的上下文窗口限制，避免超出
4. **成本控制**: `deepseek-v4-pro` 成本较高，建议在复杂任务中使用
5. **备份配置**: 修改前建议备份原始配置文件

## 验证配置

验证 JSON 格式是否正确：

```bash
python3 -c "import json; json.load(open('~/.config/opencode/opencode.json')); print('Valid JSON')"
```

## 相关资源

- [OpenCode 官方文档](https://opencode.ai)
- [DeepSeek API 文档](https://api-docs.deepseek.com)
- [oh-my-openagent 项目](https://github.com/code-yeongyu/oh-my-openagent)