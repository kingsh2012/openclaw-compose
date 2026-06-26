请处理内置 image_generate 工具的行为坑，按以下步骤执行：

---

## 一、检查当前模型是否为 GPT，以及配置是否满足内置生图条件

1. 读取 `data/openclaw.json`，找到 `agents.defaults.model.primary` 字段，判断当前主模型是否为
   GPT（即 provider 为 `openai` 或 `custom-gpt`，model id 含 `gpt`）。

2. 如果是 GPT 模型，继续检查 `models.providers.openai` 是否同时存在 `baseUrl` 和 `apiKey`：

   - **两者都有**：配置满足，内置 `image_generate` 工具可正常使用，无需修改。

   - **缺少 `baseUrl` 或 `apiKey`（或整个 `openai` 节点不存在）**：
     - 尝试从已有 provider 配置中补全：
       - 如果 `custom-gpt` 或其他 openai-compatible provider 已配置了 `baseUrl`/`apiKey`，
         将其复制到 `models.providers.openai` 下。
       - 如果找不到可参考的值，**停下来询问用户**，请其提供 `baseUrl` 和 `apiKey`，
         不要自己猜测或填写占位符。
     - 补全后修改 `data/openclaw.json`，然后执行：
       ```bash
       chmod 666 ./data/openclaw.json
       ```
     - **告知用户**：配置已更新，需要重启 openclaw 容器后生效：
       ```bash
       docker compose restart
       ```

3. 如果主模型不是 GPT，内置 `image_generate` 工具仍依赖 `openai` provider 出图，
   同样按上面第 2 步检查 `models.providers.openai` 配置，逻辑相同。

---

## 二、检查 AGENTS.md 里是否已有"调用 image_generate 前先回复提示语"的规则

- 规则内容：调用 `image_generate` 工具的同一轮，必须先输出一句文字提示（例如"图片生成中，
  请稍候…"），再调用工具。
- 原因：`image_generate` 是异步工具，调用后立刻返回"任务已启动"，图片生成好后才会作为附件
  自动发到聊天里。如果那一轮只调用了工具、没有输出任何文字，飞书会自动追加一句兜底消息
  「This reply completed without visible content...」（openclaw 框架硬编码，没有配置项可以
  关掉），先输出提示语可以避免触发这条兜底消息。
- 如果 AGENTS.md 里没有这条规则，补一条进去；如果已经有类似规则，不用重复加，确认表述清楚
  即可。

---

## 三、在 memory/ 里记一条踩坑记录，内容包括

- 发现时间：2026-06-24
- 现象：用内置 image_generate 生图时，模型如果不先说话直接调工具，飞书会跳出兜底消息
  「This reply completed without visible content...」
- 原因：image_generate 异步执行，框架硬编码逻辑
- 应对：已在 AGENTS.md 里加了规则，要求调用前先输出提示语（见第二步）

---

## 四、完成后回复确认

说明以下各项当前状态（新建 / 已存在 / 已更新 / 已跳过）：
- `models.providers.openai` 配置
- AGENTS.md 规则
- memory/ 记录
