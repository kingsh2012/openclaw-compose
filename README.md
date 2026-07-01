# OpenClaw 部署文档

## 目录结构

```
openclaw/                    # 单个实例目录（复制此目录部署新实例）
├── templates/               # 配置模板（由 init.sh 读取，勿直接修改）
│   ├── docker-compose.yml   # Compose 模板（生成根目录的 docker-compose.yml）
│   └── openclaw.json        # 配置模板（生成 data/openclaw.json）
├── services/                # 共享服务层：每台机起一次，全实例共用
│   ├── chrome/              # Chrome 独立服务（靠 CDP 端口 9223 共享）
│   │   ├── docker-compose.yml
│   │   ├── .env.example     # CHROME_USER / CHROME_PASSWORD
│   │   └── chrome-init.d/
│   │       └── 99-cdp-relay.sh  # CDP 端口中继（0.0.0.0:9223 → 127.0.0.1:9222）
│   └── ollama-embedding/    # memorySearch embedding 服务（靠 11434 端口共享）
│       ├── docker-compose.yml
│       └── README.md
├── scheduler/               # 实例层 sidecar：每个实例一个，随网关 build（见 templates/docker-compose.yml）
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── run-job.sh
│   ├── USAGE.md
│   └── README.md
├── workspace-seed/          # Agent 出厂大脑：规则/人设/技能/目录规范，init.sh 种入 data/workspace/
│   ├── README.md            # seed 机制说明
│   ├── AGENTS.md SOUL.md …  # 共享规则与人设（每轮生效）
│   ├── WORKSPACE_DESIGN.md  # workspace 迁移/整理操作指南（规则内联在 AGENTS.md）
│   ├── BOOTSTRAP.md         # 静态通用首启引导（不预设身份，靠对话定后自删）
│   └── skills/<skill-name>/ # 自定义 skill 源码（同步到各实例）
├── .env.example             # 环境变量模板（复制为 .env 后填写真实值）
├── init.sh                  # 初始化脚本（首次部署用，含防重复 lock）
├── update.sh                # 模板有更新时，同步已初始化实例的 docker-compose.yml 及 workspace-seed/
├── test_model.sh            # 测试 API 连通性
└── README.md
```

生成文件（不入库）：
```
openclaw/
├── docker-compose.yml       # 由 init.sh 从 templates/ 生成
└── data/
    └── openclaw.json        # 由 init.sh 从 templates/ 生成
```

---

## 部署步骤

### 第一步：填写环境变量

```bash
cp .env.example .env
# 编辑 .env，填写 INSTANCE_NAME、INSTANCE_PORT、API Key、飞书凭据等
```

`INSTANCE_NAME` 用于区分实例（同一台服务器上唯一），`INSTANCE_PORT` 为对外暴露端口。

### 第二步：初始化

```bash
bash init.sh
```

脚本会自动：从模板生成 `docker-compose.yml` 和配置文件、启动容器、安装飞书插件。一次性完成，重复执行会被 lock 拦截。

---

## 多实例部署

同一台服务器部署多个 OpenClaw 实例（对应不同飞书机器人）：

```bash
# 复制目录
cp -r openclaw instance-a
cp -r openclaw instance-b

# 分别填写 .env，设置不同的 INSTANCE_NAME 和 INSTANCE_PORT
# instance-a/.env：INSTANCE_NAME=a, INSTANCE_PORT=18789
# instance-b/.env：INSTANCE_NAME=b, INSTANCE_PORT=18790

# 分别初始化
cd instance-a && bash init.sh
cd ../instance-b && bash init.sh
```

各实例拥有独立容器名、网络、数据目录，互不干扰。

---

## Chrome 可视化界面

Chrome 作为独立服务部署，可被所有 OpenClaw 实例共用（CDP 不支持并发，同一时间只能一个实例使用）。

### 启动 Chrome

```bash
cd chrome
cp .env.example .env
# 编辑 .env，修改 CHROME_USER 和 CHROME_PASSWORD
docker compose up -d
```

**访问地址：** `https://服务器IP:3001`

- 首次访问浏览器会提示证书不受信任（自签名），点击「继续访问」即可

### 配置 openclaw 连接 Chrome

在实例的 `.env` 中填写 Chrome 所在宿主机 IP：

```
CHROME_CDP_URL=http://服务器IP:9223
```

然后重新初始化，或直接修改 `data/openclaw.json` 中的 `browser.cdpUrl` 并重启容器。

### 登录流程

1. 打开 `https://服务器IP:3001`，进入 Chrome 界面
2. 访问目标网站（如大众点评），完成扫码登录
3. 关闭界面即可，session 已自动保存
4. 之后 OpenClaw 发起浏览器请求时会复用该登录态

> 登录态在容器重启后依然保留，无需重复登录。

---

## 定时任务（Scheduler）

高频/确定性的定时任务跑在独立的 `openclaw-${INSTANCE_NAME}-scheduler` 容器里（`supercronic`），不经过 agent，不消耗 LLM token。镜像随 `init.sh`/`update.sh` 一并构建启动，与主容器共享同一份 `./data` workspace。

增删任务、查日志等规则见容器启动后生成的 `data/workspace/tools/scheduler/README.md`（避免在这里重复维护）。

---

## Embedding 服务（memorySearch）

CPU 版 Ollama embedding 服务（`bge-m3`），给多个 OpenClaw 实例的 `memorySearch` 共用，按需手动启动：

```bash
cd services/ollama-embedding
docker compose up -d
```

详细配置和验证方法见 `services/ollama-embedding/README.md`。

---

## 飞书群聊授权

默认 `groupPolicy: allowlist`，机器人只响应白名单内的群，其他群消息会被忽略（日志显示 `not in groupAllowFrom`）。

**添加允许的群：**

1. 将机器人拉入目标群
2. 在群里 @机器人 发任意消息，日志会打印群 ID：
   ```
   [feishu] feishu[default]: group oc_xxxxxxxxxxxxxxxx not in groupAllowFrom
   ```
3. 将该群 ID 写入 `data/openclaw.json` 的 `channels.feishu.groupAllowFrom`：
   ```json
   "groupAllowFrom": ["oc_xxxxxxxxxxxxxxxx"]
   ```
4. 保存后执行：
   ```bash
   chmod 666 ./data/openclaw.json
   docker compose restart
   ```

多个群逗号分隔：`["oc_aaa", "oc_bbb"]`

**是否需要 @ 机器人：**

默认 `requireMention: true`，群里必须 @机器人 才会响应。改为 `false` 后机器人会回复群内所有消息：

```json
"requireMention": false
```

修改后同样需要 `chmod 666 ./data/openclaw.json` 并重启容器。

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
   docker compose exec openclaw-${INSTANCE_NAME} node dist/index.js pairing approve feishu XXXXXXXX
   ```

3. 用户再次发消息即可正常使用，一次授权永久生效。

**查看待审批列表：**
```bash
docker compose exec openclaw-${INSTANCE_NAME} node dist/index.js pairing list --channel feishu
```

---

## 飞书开放平台权限配置

在 [https://open.feishu.cn/](https://open.feishu.cn/) 开发者后台，进入应用 → 权限管理，添加以下权限：

**事件与回调配置：**

1. 订阅方式 → 选择「使用长连接接收事件/回调」
2. 添加事件 → 搜索并添加「接收消息」(`im.message.receive_v1`)

**租户权限（tenant scopes）：**

<details>
<summary>展开查看完整权限列表</summary>

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:read",
      "cardkit:card:write",
      "contact:contact.base:readonly",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "docs:document.comment:create",
      "docs:document.comment:delete",
      "docs:document.comment:read",
      "docs:document.comment:update",
      "docs:document.comment:write_only",
      "docs:document.content:read",
      "docx:document.block:convert",
      "docx:document:create",
      "docx:document:readonly",
      "docx:document:write_only",
      "drive:drive.metadata:readonly",
      "event:ip_list",
      "im:app_feed_card:write",
      "im:biz_entity_tag_relation:read",
      "im:biz_entity_tag_relation:write",
      "im:chat",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.announcement:read",
      "im:chat.announcement:write_only",
      "im:chat.chat_pins:read",
      "im:chat.chat_pins:write_only",
      "im:chat.collab_plugins:read",
      "im:chat.collab_plugins:write_only",
      "im:chat.managers:write_only",
      "im:chat.members:bot_access",
      "im:chat.members:read",
      "im:chat.members:write_only",
      "im:chat.menu_tree:read",
      "im:chat.menu_tree:write_only",
      "im:chat.moderation:read",
      "im:chat.tabs:read",
      "im:chat.tabs:write_only",
      "im:chat.top_notice:write_only",
      "im:chat.widgets:read",
      "im:chat.widgets:write_only",
      "im:chat:create",
      "im:chat:delete",
      "im:chat:moderation:write_only",
      "im:chat:operate_as_owner",
      "im:chat:read",
      "im:chat:readonly",
      "im:chat:update",
      "im:datasync.feed_card.time_sensitive:write",
      "im:message",
      "im:message.group_at_msg.include_bot:readonly",
      "im:message.group_at_msg:readonly",
      "im:message.group_msg",
      "im:message.p2p_msg:readonly",
      "im:message.pins:read",
      "im:message.pins:write_only",
      "im:message.reactions:read",
      "im:message.reactions:write_only",
      "im:message.urgent",
      "im:message.urgent.status:write",
      "im:message.urgent:phone",
      "im:message.urgent:sms",
      "im:message:readonly",
      "im:message:recall",
      "im:message:send_as_bot",
      "im:message:send_multi_depts",
      "im:message:send_multi_users",
      "im:message:send_sys_msg",
      "im:message:update",
      "im:resource",
      "im:tag:read",
      "im:tag:write",
      "im:url_preview.update",
      "im:user_agent:read"
    ],
    "user": [
      "contact:user.basic_profile:readonly",
      "offline_access"
    ]
  }
}
```

</details>

---

## Skills / 图片生成

OpenClaw 里能生成图片有两条路，**用途不同，配置也不同**：

### 1. 内置 `image_generate` 工具（推荐，飞书默认走这条）

- **是什么**：openclaw 自带的工具，模型对话中直接调用，**异步执行**——调用后立刻返回"任务已启动"，图片生成好后会作为附件自动发到聊天里。
- **安装**：无需安装，内置自带，只要 `models.providers.openai` 里配置了可用的 API 即可。
- **配置**：在 `data/openclaw.json`（对应 `templates/openclaw.json`）中配置：
  ```json
  "models": {
    "mode": "merge",
    "providers": {
      "openai": {
        "baseUrl": "https://你的代理地址/v1",
        "apiKey": "sk-xxxxxxxx"
      }
    }
  }
  ```
  > ⚠️ **必须显式配置 `baseUrl`**。该插件会读取 `OPENAI_API_KEY` 环境变量，但**不会**读取 `OPENAI_BASE_URL` 环境变量——不配 `baseUrl` 会默认打到官方 `api.openai.com`，导致代理 key 被判定为 401 无效。
- **"生成中，请稍候…"提示词**：✅ **需要**。因为是异步工具，模型那一轮如果只调用工具、不输出任何文字，飞书会自动追加一句兜底消息 `This reply completed without visible content...`（openclaw 框架硬编码，无配置可关）。已在 `data/workspace/AGENTS.md` 里加了说明，要求模型调用该工具的同一轮先回复"图片生成中，请稍候…"。

### 2. `openai-image-gen` skill（可选，批量出图用）

- **是什么**：一个 Python 脚本（`scripts/gen.py`），一次性批量生成多张图（默认 8 张随机 prompt），输出到本地目录 + `index.html` 画廊，**同步执行**，不会自动发到聊天。
- **安装**：
  ```bash
  openclaw skills install openai-image-gen
  ```
- **配置**：仅需环境变量（在 `templates/docker-compose.yml` 的 `environment` 中）：
  ```yaml
  environment:
    OPENAI_API_KEY: ${IMAGE_API_KEY}
    OPENAI_BASE_URL: ${IMAGE_API_URL}
  ```
  脚本通过 `os.environ` 直接读取，`OPENAI_BASE_URL` 在这里**有效**。默认模型见 `gen.py` 的 `--model`（当前为 `gpt-image-2`，超时 280s）。
- **"生成中，请稍候…"提示词**：❌ **不需要**。脚本同步执行、有明确返回值，不走异步事件流，不会触发该兜底消息；但模型若想把生成的图发到聊天，需要自己再读取文件并附加发送。

### 一句话总结

- 飞书聊天里"帮我生成一张图" → 走内置 `image_generate`，关键是 `models.providers.openai.baseUrl` 必须显式配置。
- 想批量出图本地看画廊 → 装 `openai-image-gen` skill，靠环境变量即可，不装也不影响内置工具。

### 3. 自定义 skill（多实例复用）

`openclaw skills install` 装的 skill 落在每个实例的 `data/workspace/skills/`，而 `data/` 整体
不入库——单个实例装的自定义 skill 没法直接被其他实例复用。

如果一个自定义 skill 要在多个实例间共享，把源码放进仓库的 `workspace-seed/skills/<skill-name>/`
（结构同 `data/workspace/skills/` 下的 skill，含 `SKILL.md` 等），`init.sh`（新实例）和
`update.sh`（已有实例同步）会自动把它复制到对应实例的 `data/workspace/skills/<skill-name>/`。
改 skill 只需要改 `workspace-seed/skills/` 里的源文件，再对各实例跑一遍 `update.sh`。

> `workspace-seed/` 不止管 skill——它是 agent 的整套"出厂大脑"（规则 `AGENTS.md`、人设
> `SOUL.md`、目录规范 `WORKSPACE_DESIGN.md`、首启引导 `BOOTSTRAP.md` 等），
> 由 `init.sh` 一次性种入新实例，取代了过去"手动把规则粘贴给 agent"的做法。
> **只种规则和技能，不预设身份**——名字/性格/业务定位靠首次对话定。详见
> `workspace-seed/README.md`。

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
- `docker-compose.yml` 由 init.sh 生成，不入库，不要手动修改（修改模板 `templates/docker-compose.yml`）
- 编辑 `data/openclaw.json` 后需执行 `chmod 666 ./data/openclaw.json`，再重启容器
- 重新初始化时先删除 `.init.lock` 和 `data/`，再运行 `bash init.sh`
- openclaw 配置以 `openclaw.json` 为主，但部分插件（如 `openai` provider 的 `apiKey`）会读取环境变量；`baseUrl` 等则只认 `openclaw.json`，详见上方「Skills / 图片生成」一节
- 升级版本时 gateway 镜像和飞书插件必须保持同一版本号
