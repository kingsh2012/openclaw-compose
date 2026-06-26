#!/usr/bin/env node
// 单独设置报表日期范围（不导出），用于验证日期选择是否正确。
// 用法: node set-date-range.js <开始日期 YYYY-MM-DD> <结束日期 YYYY-MM-DD>
const { withBrowser, newPage, closeMeituanPages, waitForFrame, setDateRange, sleep } = require('./lib');

const REPORT_URL = 'https://pos.meituan.com/web/marketing/crm/report/dpaas-stored-balance';
const [, , startDate, endDate] = process.argv;

if (!startDate || !endDate) {
  console.error('Usage: node set-date-range.js <YYYY-MM-DD> <YYYY-MM-DD>');
  process.exit(2);
}

withBrowser(async (browser) => {
  await closeMeituanPages(browser);
  const page = await newPage(browser, REPORT_URL);

  const frame = await waitForFrame(page, 'crm-smart', 20000);
  await frame.waitForSelector('input[placeholder="开始日期"]', { timeout: 20000 });
  await sleep(1000);

  await setDateRange(frame, page, startDate, endDate);

  const vals = await frame.evaluate(() =>
    Array.from(document.querySelectorAll('input[placeholder="开始日期"],input[placeholder="结束日期"]'))
      .map(i => i.value)
  );
  console.log(JSON.stringify({ ok: true, start: startDate, end: endDate, inputValues: vals }));
  await page.close();
}).catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
