# workspace-seed —— Agent 的"出厂大脑"

这个目录是**一个全新 openclaw 实例启动时该拥有的一切**（规则、人设、技能、目录规范）。
`init.sh` 会在首次初始化时，把本目录整体种入实例的 `data/workspace/`。

> 设计目的：把"装配 agent 初始大脑"从**手动粘贴规则到对话**（非确定、会漂移）改成
> **版本化文件一次性种入**（确定、可复现、三实例一致）。

## 目录内容

| 文件 | 作用 | 加载时机 |
|---|---|---|
| `AGENTS.md` | 运行铁律 + 工作区目录规范摘要 | openclaw **每轮**注入上下文 |
| `SOUL.md` | 性格底子 | 每轮注入 |
| `IDENTITY.md` / `USER.md` | 身份 / 服务对象模板（首启由 agent 按业务填） | 每轮注入 |
| `TOOLS.md` | 环境相关的本地备注模板 | 按需 |
| `HEARTBEAT.md` | 心跳清单（默认空） | 心跳时 |
| `WORKSPACE_DESIGN.md` | 完整目录规范（AGENTS.md 里是摘要，这里是全文） | agent 按需读 |
| `IMAGE_GENERATE_NOTE.md` | 生图工具的坑与规则说明 | agent 按需读 |
| `skills/` | 自定义技能（每个 `<prefix>-<name>/SKILL.md`） | agent 按需调用 |
| `BOOTSTRAP.md.tpl` | **每实例差异**模板，由 `.env` 生成 `BOOTSTRAP.md` | 首启读一次后自删 |

## 共享 vs 每实例

- **共享**（所有实例相同，改一次全同步）：`AGENTS.md`、`SOUL.md`、`TOOLS.md`、
  `HEARTBEAT.md`、`WORKSPACE_DESIGN.md`、`IMAGE_GENERATE_NOTE.md`、`skills/`。
- **每实例不同**：只有 `BOOTSTRAP.md`（从 `.env` 的 `INSTANCE_NAME` / `INSTANCE_ROLE` 生成），
  首启时引导 agent 填 `IDENTITY.md` / `USER.md`。

## 同步规则（见 init.sh / update.sh）

- **init.sh（首次）**：把 seed 整体种入空 workspace；从模板生成 `BOOTSTRAP.md`。
- **update.sh（更新）**：只同步"共享且非 agent 自维护"的部分——`skills/` 与参考文档
  （`WORKSPACE_DESIGN.md`、`IMAGE_GENERATE_NOTE.md`），**不覆盖** agent 运行中自己维护的
  `AGENTS.md` / `IDENTITY.md` / `USER.md` / `MEMORY.md` / `memory/`，避免抹掉它长出来的记忆。

## 改东西的正确姿势

改共享规则或技能 → 改**本目录**源文件 → 提交 git → 各实例 `git pull` 后按需 `bash update.sh`。
不要直接改实例 `data/workspace/skills/` 下由此同步来的内容，会被下次同步覆盖。

⚠️ 不要把 API Key / token 等敏感信息写进本目录任何文件（会进 git）。凭据走 `.secrets/`。
