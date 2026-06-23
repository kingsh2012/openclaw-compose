# agent-docs

这里存放**要粘贴给飞书里的 OpenClaw（agent 本身）执行**的规则文档，不是给人看的部署说明
（部署说明在仓库根目录 `README.md`）。

## 使用方式

1. 在这里写/改一份规则文档（中文，直接对 agent 下指令的语气）。
2. 把整份文档内容粘贴到飞书对话里发给对应的 OpenClaw 实例。
3. agent 收到后会按文档里的规则，自己在它自己的 workspace（`data/workspace/` 下）创建目录、
   整理文件——不需要人工去 `data/workspace/` 里手动建目录。
4. 之后规则有变化，改这里的源文件，再重新粘贴一遍给 agent 即可。

## 已有文档

- `WORKSPACE_DESIGN.md` — agent workspace 根目录整理规范（tools/、skills/、memory/ 等分类目录）
- `IMAGE_GENERATE_NOTE.md` — 内置 `image_generate` 工具的异步兜底消息坑，及对应的 AGENTS.md 规则

## 命名 / 写法约定

- 每份文档对应一个独立主题，文件名全大写 + 下划线，例如 `WORKSPACE_DESIGN.md`。
- 正文直接用第二人称对 agent 说话（"请按下面规则…"），不要写成给人看的说明文档。
- 涉及"必须每次都生效"的规则（比如调用某个工具前必须先说一句提示语），要在文档里特别注明
  "这条规则需要同步写进 AGENTS.md"——因为像 `tool-notes/`、`skills/` 这类目录只是归档/参考，
  agent 不会每轮自动读取，只有 `AGENTS.md` 是每轮都会生效的地方。
