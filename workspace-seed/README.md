# workspace-seed —— Agent 的"出厂大脑"

这个目录是**一个全新 openclaw 实例启动时该拥有的一切**（规则、人设、技能、目录规范）。
`init.sh` 会在首次初始化时，把本目录整体种入实例的 `data/workspace/`。

> 设计目的：把"装配 agent 初始大脑"从**手动粘贴规则到对话**（非确定、会漂移）改成
> **版本化文件一次性种入**（确定、可复现、三实例一致）。

## 目录内容

| 文件 | 作用 | 加载时机 |
|---|---|---|
| `AGENTS.md` | 运行铁律 + 完整工作区规范（内联，每轮生效） | openclaw **每轮**注入上下文 |
| `SOUL.md` | 性格底子 | 每轮注入 |
| `IDENTITY.md` / `USER.md` | 身份 / 服务对象**空模板**（不预设，靠首次对话填） | 每轮注入 |
| `TOOLS.md` | 环境相关的本地备注模板 | 按需 |
| `HEARTBEAT.md` | 心跳清单（默认空） | 心跳时 |
| `WORKSPACE_DESIGN.md` | workspace 迁移/整理**操作指南**（规则在 AGENTS.md，这里是动手步骤） | agent 按需读 |
| `IMAGE_GENERATE_NOTE.md` | 生图工具的坑与规则说明 | agent 按需读 |
| `skills/` | 自定义技能（每个 `<prefix>-<name>/SKILL.md`） | agent 按需调用 |
| `BOOTSTRAP.md` | 静态通用首启引导（不预设身份，引导 agent 用对话定身份后自删） | 首启读一次后自删 |

## 我们设定什么、不设定什么

- **设定（种进 seed，全实例共享）**：规则（`AGENTS.md`）、目录规范
  （`WORKSPACE_DESIGN.md`）、人设底子（`SOUL.md`）、技能（`skills/`）、参考文档。
- **不预设（靠对话定，每实例独有）**：名字、性格、业务定位、服务对象。
  `IDENTITY.md` / `USER.md` 只种空模板，`BOOTSTRAP.md` 引导 agent 在首次对话里
  问清楚、写进这两个文件，然后删除自己。**没有 `INSTANCE_ROLE` 之类的预设项。**

## 同步规则（见 init.sh / update.sh）

- **init.sh（首次）**：把 seed 整体种入空 workspace；从模板生成 `BOOTSTRAP.md`。
- **update.sh（更新）**：只同步"共享且非 agent 自维护"的部分——`skills/` 与参考文档
  （`WORKSPACE_DESIGN.md`、`IMAGE_GENERATE_NOTE.md`），**不覆盖** agent 运行中自己维护的
  `AGENTS.md` / `IDENTITY.md` / `USER.md` / `MEMORY.md` / `memory/`，避免抹掉它长出来的记忆。

## 改东西的正确姿势

改共享规则或技能 → 改**本目录**源文件 → 提交 git → 各实例 `git pull` 后按需 `bash update.sh`。
不要直接改实例 `data/workspace/skills/` 下由此同步来的内容，会被下次同步覆盖。

⚠️ 不要把 API Key / token 等敏感信息写进本目录任何文件（会进 git）。凭据走 `.secrets/`。
