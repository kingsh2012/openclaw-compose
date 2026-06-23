# OpenClaw memorySearch embedding service

CPU 版 Ollama embedding 服务，给多个 OpenClaw 的 `memorySearch` 共用。

## 启动

```bash
cd /data/openclaw/ollama-embedding
docker compose up -d
```

第一次会拉取 `bge-m3` 模型，耗时取决于网络。

## 验证

```bash
curl http://127.0.0.1:11434/api/embed \
  -H 'Content-Type: application/json' \
  -d '{"model":"bge-m3","input":"周报格式"}'
```

如果需要验证 OpenAI-compatible endpoint：

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H 'Content-Type: application/json' \
  -d '{"model":"bge-m3","input":"周报格式"}'
```

## OpenClaw 配置方案 A：直接用 ollama provider

适合同机 OpenClaw：

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "ollama",
        "model": "bge-m3"
      }
    }
  }
}
```

如果不是默认本机地址，增加自定义 provider：

```json
{
  "models": {
    "providers": {
      "ollama-embed": {
        "api": "ollama",
        "baseUrl": "http://EMBEDDING_HOST:11434",
        "apiKey": "ollama-local",
        "models": [{ "id": "bge-m3" }]
      }
    }
  },
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "ollama-embed",
        "model": "bge-m3"
      }
    }
  }
}
```

## OpenClaw 配置方案 B：OpenAI-compatible

如果 `/v1/embeddings` 验证通过，也可以这样配置：

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "openai-compatible",
        "model": "bge-m3",
        "remote": {
          "baseUrl": "http://EMBEDDING_HOST:11434/v1",
          "apiKey": "ollama-local"
        }
      }
    }
  }
}
```

## 重建索引

每台 OpenClaw 配好后执行：

```bash
openclaw memory index --force --agent main --verbose
openclaw memory search "周报格式" --agent main --max-results 5
```

## 安全注意

- 默认 compose 监听所有接口（`"11434:11434"`），局域网/同网络下的其他机器都能访问。
- 如果只给本机 OpenClaw 用，把端口改成 `127.0.0.1:11434:11434` 更安全。
- 如果要给另一台独立 OpenClaw 访问，保持默认配置即可，但必须用防火墙只允许那台机器的 IP 访问 11434 端口。
- 不建议裸露公网；需要公网访问时，放到 Nginx/HTTPS/API key 或内网隧道后面。
