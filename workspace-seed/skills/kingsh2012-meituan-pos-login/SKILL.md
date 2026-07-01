---
name: kingsh2012-meituan-pos-login
description: "Log in to pos.meituan.com (美团管家) via SMS code through the openclaw-chrome CDP browser, and check whether the saved session is still valid."
---

# 美团管家登录

固定脚本，不走 agent 一步步摸索 browser 工具；通过 CDP 直连 `openclaw-chrome` 容器(默认
`http://127.0.0.1:9223`，可用环境变量 `MEITUAN_CDP_URL` 覆盖)操作真实 Chrome。

## 何时用

- 用户要看/导出美团管家的报表或数据，但当前不确定有没有登录态。
- 用户明确说"重新登录美团"或验证码登录失败需要重试。

**先检查再登录**：登录态落在 Chrome 容器的持久化 profile 里(`chrome-profile` 目录挂载),
容器不重置就不会丢，多数情况下不需要重新走验证码流程。

## 依赖（一次性）

```bash
cd deps/node && npm install puppeteer-core
```

若报 `Cannot find module 'puppeteer-core'`，说明这步没做。

## 工作流程

1. 先查登录态：

   ```bash
   node skills/kingsh2012-meituan-pos-login/scripts/check-session.js
   ```

   输出 `{"loggedIn": true, "url": "..."}` 就说明免登录可以直接用，不需要往下走。

2. 如果 `loggedIn: false`，发送验证码（手机号必须是用户在聊天里明确提供的，不要猜/不要复用别的账号）：

   ```bash
   node skills/kingsh2012-meituan-pos-login/scripts/send-code.js <手机号>
   ```

   成功后告诉用户"验证码已发送，请提供收到的验证码"，**停下来等用户回复**，不要自己编验证码。

3. 用户给出验证码后：

   ```bash
   node skills/kingsh2012-meituan-pos-login/scripts/submit-code.js <验证码>
   ```

   脚本会自动处理登录后的"选择集团/门店"页（只有一个机构时自动选择；多个机构时需要追加逻辑或
   交给 agent 用 browser 工具手动选）。

4. 用 `check-session.js` 或脚本输出的 `url` 确认是否落到了 `pos.meituan.com/web/operation/main`，
   即登录成功。

## 注意

- 验证码、手机号都不要写进 skill 文件、日志或截图文件名里长期保留；脚本截图写到 `/tmp`，用完
  可以清理。
- 如果 `send-code.js` 报"未找到登录 iframe"，很可能已经处于登录态，先跑 `check-session.js`。
- 如果 `submit-code.js` 报"未找到登录按钮"或验证码输入失败，大概率是验证码已过期（一般 60
  秒倒计时），需要重新跑 `send-code.js`。
- 这个脚本操作的是 `openclaw-chrome` 容器里的浏览器，是真实图形 Chrome（非 `--headless`），
  指纹风险低，但仍建议各步骤间保留脚本里已有的等待时间，不要去掉延时改成无延迟连续操作。
