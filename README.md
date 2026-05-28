# OpenClaw 部署文档

## 目录结构

```
openclaw/                    # 部署目录，整个 copy 到服务器
├── docker-compose.yml       # 启动配置
├── openclaw.json.example    # 配置模板（变量由 .env 注入，勿直接修改）
├── .env.example             # 环境变量模板（复制为 .env 后填写真实值）
├── chrome-init.d/           # Chrome 容器自定义初始化脚本
│   └── 99-cdp-relay.sh      # CDP 端口中继（0.0.0.0:9223 → 127.0.0.1:9222）
├── init.sh                  # 初始化脚本（首次部署用，含防重复 lock）
├── test_model.sh            # 测试 API 连通性
└── README.md
```

数据目录（自动创建）：
```
openclaw/
└── data/
    ├── openclaw.json        # 运行时配置（由 init.sh 生成）
    └── chrome-profile/      # Chrome 用户数据，登录态持久化于此
```

---

## 部署步骤

### 第一步：填写环境变量

```bash
cp .env.example .env
# 编辑 .env，填写 API Key、飞书凭据、Chrome 账号密码等
```

### 第二步：初始化

```bash
bash init.sh
```

脚本会自动加载 `.env`、生成配置、启动容器并安装飞书插件。一次性完成，重复执行会被 lock 拦截。

---

## Chrome 可视化界面

系统内置一个带图形界面的 Chrome 浏览器，用于手动扫码登录（大众点评、美团等需要登录的网站）。

**访问地址：** `https://服务器IP:3001`

- 用户名：`.env` 中的 `CHROME_USER`（默认 `admin`）
- 密码：`.env` 中的 `CHROME_PASSWORD`
- 首次访问浏览器会提示证书不受信任（自签名），点击「继续访问」即可

**登录流程：**

1. 打开 `https://服务器IP:3001`，进入 Chrome 界面
2. 访问目标网站（如大众点评），完成扫码登录
3. 关闭界面即可，session 已自动保存到 `./data/chrome-profile`
4. 之后 OpenClaw 发起浏览器请求时会复用该登录态

> 登录态在容器重启后依然保留，无需重复登录。

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
   docker compose restart openclaw-gateway
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
   docker compose exec openclaw-gateway node dist/index.js pairing approve feishu XXXXXXXX
   ```

3. 用户再次发消息即可正常使用，一次授权永久生效。

**查看待审批列表：**
```bash
docker compose exec openclaw-gateway node dist/index.js pairing list --channel feishu
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
- 编辑 `data/openclaw.json` 后需执行 `chmod 666 ./data/openclaw.json`，再重启容器
- 重新初始化时先删除 `.init.lock`，再运行 `bash init.sh`
- openclaw 只读取 `openclaw.json`，不使用环境变量
