请按下面内容，在你自己的 workspace 里建立/更新一条工具行为备忘，规则见你 workspace 根目录的
`WORKSPACE_DESIGN.md` 第 8 项（`tool-notes/`）。

一、在 `tool-notes/image_generate.md` 写入（如果文件已存在，合并更新，不要整篇覆盖）：

```markdown
# image_generate 工具行为备忘

- 工具类型：框架内置工具，模型对话中直接调用，**异步执行**——调用后立刻返回"任务已启动"，
  图片生成好后会作为附件自动发到聊天里。
- 已知坑：因为是异步工具，如果模型那一轮只调用了这个工具、没有输出任何文字，飞书会自动追加
  一句兜底消息「This reply completed without visible content...」（openclaw 框架硬编码，
  没有配置项可以关掉）。
- 必须遵守的规则：调用 image_generate 工具的同一轮，必须先输出一句文字提示（例如"图片生成中，
  请稍候…"），再调用工具，避免触发上面那条兜底消息。
- 记录时间：2026-06-23。
```

二、检查 `AGENTS.md` 里是否已经有"调用 image_generate 前先回复提示语"这条规则：
- 如果没有，补一条进去（这条规则必须放 AGENTS.md，因为 AGENTS.md 才是每轮都会读取生效的地方，
  `tool-notes/` 只是档案库，不会自动生效）。
- 如果已经有类似规则，不用重复加，确认表述清楚即可。

三、改完之后回复一句确认：`tool-notes/image_generate.md` 和 `AGENTS.md` 各自的当前状态
（新建/已存在/已更新），方便核对。
