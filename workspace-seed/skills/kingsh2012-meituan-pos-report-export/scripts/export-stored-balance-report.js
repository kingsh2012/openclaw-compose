#!/usr/bin/env node
// 导出"储值余额期初期末汇总表"。要求登录态已经有效(用 kingsh2012-meituan-pos-login 的
// check-session.js 先确认)。
//
// 用法: node export-stored-balance-report.js [开始日期 YYYY-MM-DD] [结束日期 YYYY-MM-DD]
// 日期参数可选；不传则使用页面默认的筛选范围。
//
// 输出 JSON: { ok: true, screenshot: "..." }，导出的 xlsx 落在 Chrome 容器内
// /config/Downloads/，需要再跑 fetch-download.js 把文件取出来。
const { withBrowser, newPage, closeMeituanPages, waitForFrame, setDateRange, sleep } = require('./lib');

const REPORT_URL = 'https://pos.meituan.com/web/marketing/crm/report/dpaas-stored-balance';
const [, , dateStart, dateEnd] = process.argv;

withBrowser(async (browser) => {
  await closeMeituanPages(browser);
  const page = await newPage(browser, REPORT_URL);

  if (page.url().includes('/login') || page.url().includes('rms-account')) {
    throw new Error('未登录，先用 kingsh2012-meituan-pos-login 的登录流程');
  }

  // 报表内容在 web/crm-smart/ 子 iframe 里
  const frame = await waitForFrame(page, 'crm-smart', 20000);
  await frame.waitForSelector('input[placeholder="开始日期"]', { timeout: 20000 });
  await sleep(1000);

  // 设置日期范围（可选）
  if (dateStart && dateEnd) {
    await setDateRange(frame, page, dateStart, dateEnd);
    await sleep(500);
  }

  // 点查询
  const queried = await frame.locator('button, span, div').filter({ hasText: /^查询$/ }).first().isVisible()
    .then(v => v ? frame.locator('button, span, div').filter({ hasText: /^查询$/ }).first().click().then(() => true) : false)
    .catch(() => false);
  if (queried) await sleep(2000);

  // 点导出
  const exportBtn = frame.locator('button, span, div').filter({ hasText: /^导出$/ }).first();
  await exportBtn.waitFor({ timeout: 5000 });
  await exportBtn.click();

  await sleep(2500);
  const shotPath = process.argv[4] || '/tmp/meituan-export-stored-balance.png';
  await page.screenshot({ path: shotPath });
  console.log(JSON.stringify({ ok: true, screenshot: shotPath }));
  await page.close();
}).catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
