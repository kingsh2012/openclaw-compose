---
name: kingsh2012-meituan-pos-report-export
description: "Export reports from pos.meituan.com (美团管家) via the openclaw-chrome CDP browser, e.g. the stored-value balance summary report, and fetch the downloaded file out of the container."
---

# 美团管家报表导出

固定脚本，跟 [[kingsh2012-meituan-pos-login]] 配套：登录态由那个 skill 负责，这个 skill 只管
"打开报表页 → 设筛选条件 → 点导出 → 把文件从容器里取出来"。

## 何时用

用户要导出/下载美团管家后台的某个数据报表。

**前提**：先确认登录态有效（跑 `kingsh2012-meituan-pos-login` 的 `check-session.js`），没登录先
走那个 skill 的登录流程，不要在这个 skill 里重复处理验证码登录。

## 依赖（一次性）

跟 `kingsh2012-meituan-pos-login` 共用同一个 `deps/node/node_modules`，如果那个 skill 已经装过
`puppeteer-core` 就不用重复装：

```bash
cd deps/node && npm install puppeteer-core
```

## 已支持的报表

### 储值余额期初期末汇总表

- URL: `https://pos.meituan.com/web/marketing/crm/report/dpaas-stored-balance`
- 页面结构：外层是 `rms-account` 壳子页，报表内容在**第二层嵌套 iframe**
  （`web/crm-smart/report/dpaas-stored-balance`）里，按钮/输入框都要在这层 frame 里找。
- 导出脚本：

  ```bash
  node skills/kingsh2012-meituan-pos-report-export/scripts/export-stored-balance-report.js [开始日期] [结束日期]
  ```

  日期格式 `YYYY-MM-DD`，可选；不传就用页面默认筛选范围直接导出。

- 导出后文件落在 Chrome 容器内 `/config/Downloads/`，**不是**直接进 workspace，需要再跑：

  ```bash
  node skills/kingsh2012-meituan-pos-report-export/scripts/fetch-download.js --latest
  ```

  或者先 `node fetch-download.js` 不带参数看文件列表，再指定确切文件名。输出的 `localPath`
  在 workspace 的 `outputs/` 目录下，可以直接发给用户。

## 新增报表的套路

新报表大概率也是"壳子页 + 嵌套 iframe"结构、筛选区（统计维度/日期/门店/卡类型）样式类似。新增
一个报表时：

1. 先用 `check-session.js` 确认已登录，再 `page.goto(报表URL)`。
2. 打印 `page.frames().map(f => f.url())` 确认报表内容实际在哪一层 frame。
3. 在该 frame 里用 `document.querySelectorAll('*')` 配合文本/class 过滤找到筛选输入框和"导出"
   按钮的选择器（按钮文字常见会被渲染成"导 出"这种带空格的形式，用
   `textContent.replace(/\s/g, '')` 比较，不要用精确字符串）。
4. 复制 `export-stored-balance-report.js` 改报表 URL 和筛选项选择器，复用 `lib.js` 里的
   `clickTextInAnyFrame`/`evalInAnyFrame` 工具函数。
5. 把新摸出来的页面结构记进这份 SKILL.md，避免下次重新摸索。

## 注意

- 操作前先关掉浏览器里其它 `meituan.com` 标签页，避免越积越多、占用资源导致 Chrome 容器不稳定
  （观察到过一次清理标签页方式不当导致 Chrome 进程整体退出，靠 `docker compose restart chrome`
  恢复，登录态因为挂载了持久化 profile 没丢）。
- 如果 CDP 端口 `9223` 连不上，先 `curl http://127.0.0.1:9223/json/version` 确认，连不上时检查
  `openclaw-chrome` 容器内 Chrome 进程是否还活着（`docker exec openclaw-chrome ps aux | grep chrom`），
  必要时在 `/data/openclaw/chrome` 目录下 `docker compose restart chrome`——这是项目自带的标准
  恢复方式，登录态会保留。
