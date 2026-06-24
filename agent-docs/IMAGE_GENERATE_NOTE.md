请处理一个内置工具的行为坑，分两部分：一部分写进 AGENTS.md（让规则真正生效），一部分记进
memory/（留下踩坑的来龙去脉）。

一、检查 `AGENTS.md` 里是否已经有"调用 image_generate 前先回复提示语"这条规则：

- 规则内容：调用 `image_generate` 工具的同一轮，必须先输出一句文字提示（例如"图片生成中，
  请稍候…"），再调用工具。
- 原因：`image_generate` 是异步工具，调用后立刻返回"任务已启动"，图片生成好后才会作为附件
  自动发到聊天里。如果那一轮只调用了工具、没有输出任何文字，飞书会自动追加一句兜底消息
  「This reply completed without visible content...」（openclaw 框架硬编码，没有配置项可以
  关掉），先输出提示语可以避免触发这条兜底消息。
- 如果 AGENTS.md 里没有这条规则，补一条进去；如果已经有类似规则，不用重复加，确认表述清楚
  即可。

二、在 memory/ 里记一条踩坑记录（按你自己 memory/ 的记录方式，比如当天的日志文件），内容包括：

- 发现时间：2026-06-24
- 现象：用内置 image_generate 生图时，模型如果不先说话直接调工具，飞书会跳出兜底消息
  「This reply completed without visible content...」
- 原因：image_generate 异步执行，框架硬编码逻辑
- 应对：已在 AGENTS.md 里加了规则，要求调用前先输出提示语（见上面第一步）

三、改完之后回复一句确认：AGENTS.md 和 memory/ 各自的当前状态（新建/已存在/已更新）。
