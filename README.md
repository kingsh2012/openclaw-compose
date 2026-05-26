# OpenClaw 部署文档

## 目录结构

```
openclaw/                    # 部署目录，整个 copy 到服务器
├── docker-compose.yml       # 启动配置
├── openclaw.json.example    # 配置模板（变量由 .env 注入，勿直接修改）
├── .env.example             # 环境变量模板（复制为 .env 后填写真实值）
├── init.sh                  # 初始化脚本（首次部署用，含防重复 lock）
├── test_model.sh            # 测试 API 连通性
└── README.md
```

数据目录（与部署目录同级，自动创建）：
```
openclaw/
└── data/                    # 主配置目录
```

---

## 部署步骤

### 第一步：填写环境变量

```bash
cp .env.example .env
# 编辑 .env，填写 API Key、飞书凭据、服务器 IP 等
```

### 第二步：初始化

```bash
bash init.sh
```

脚本会自动加载 `.env`、生成配置、启动容器并安装飞书插件。一次性完成，重复执行会被 lock 拦截。

---

## 飞书用户授权（Pairing 模式）

当前使用 `dmPolicy: pairing` 模式，新用户首次私聊机器人时需要管理员授权。

**流程：**

1. 用户私聊机器人，收到回复：
   ```
   OpenClaw: access not configured.
   Pairing code: XXXXXXXX
   Ask the bot owner to approve with:
   openclaw pairing approve feishu XXXXXXXX
   ```

2. 管理员在服务器执行授权：
   ```bash
   docker compose exec openclaw-gateway node dist/index.js pairing approve feishu XXXXXXXX
   ```

3. 用户再次发消息即可正常使用，一次授权永久生效。

**查看待审批列表：**
```bash
docker compose exec openclaw-gateway node dist/index.js pairing list --channel feishu
```

---

## 常用命令

```bash
# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启
docker compose restart

# 停止
docker compose down

# 测试 API 连通性
bash test_model.sh

# 备份配置
cp ./data/openclaw.json ./openclaw.json.bak
```

---

## 注意事项

- `.env` 和 `data/openclaw.json` 含 API Key 等敏感信息，不要提交 git
- 直接编辑 `data/openclaw.json` 后重启容器即可生效，无需重新设置权限
- 重新初始化时先删除 `.init.lock`，再运行 `bash init.sh`
- openclaw 只读取 `openclaw.json`，不使用环境变量
