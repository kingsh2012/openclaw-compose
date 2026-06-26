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

## 二、检查 AGENTS.md 里是否已有以下图片生成规则

**规则 1（泛化）：收到生图需求时先回复进度提示**
- 触发条件：用户提出"生成图片 / 做 logo / 出图 / 画一张图"等任何生图需求。
- 规则内容：在开始调用任何生图工具、脚本或外部 API 前，必须先在同一轮输出一句可见进度提示，
  例如"图片生成中，请稍候…"。
- 覆盖范围：内置 `image_generate`、脚本/API 调用 `gpt-image-2`、其他生图接口——全部适用。
- 原因：部分生图流程异步或长耗时，若这一轮无可见文字，飞书会追加兜底消息
  「This reply completed without visible content...」（框架硬编码，无配置项可关）。

**规则 2：使用内置 `image_generate` 时指定 `model: "gpt-image-2"`**
- 规则内容：调用内置 `image_generate` 时，始终传入 `model: "gpt-image-2"`（用户明确要求其他模型除外）。
- 原因：不指定 model 时可能使用旧版或不支持生图的默认模型。

- 如果 AGENTS.md 里没有这两条规则，补进去；如果已有类似规则，确认表述清楚即可，不重复加。

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
- `models.providers.openai` 配置（`baseUrl` + `apiKey`）
- AGENTS.md 规则：调用前先回复提示语
- AGENTS.md 规则：调用时指定 `model: "gpt-image-2"`
- memory/ 记录
