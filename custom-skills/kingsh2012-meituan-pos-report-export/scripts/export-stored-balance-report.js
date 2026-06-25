#!/usr/bin/env node
// 导出"储值余额期初期末汇总表"。要求登录态已经有效(用 kingsh2012-meituan-pos-login 的
// check-session.js 先确认)。
//
// 用法: node export-stored-balance-report.js [开始日期 YYYY-MM-DD] [结束日期 YYYY-MM-DD]
// 日期参数可选；不传则使用页面默认的筛选范围。
//
// 输出 JSON: { ok: true, screenshot: "..." }，导出的 xlsx 落在 Chrome 容器内
// /config/Downloads/，需要再跑 fetch-download.js 把文件取出来。

const { withBrowser, sleep, clickTextInAnyFrame, evalInAnyFrame } = require('./lib');

const REPORT_URL = 'https://pos.meituan.com/web/marketing/crm/report/dpaas-stored-balance';

const [, , dateStart, dateEnd] = process.argv;

async function setDateRange(page, start, end) {
  if (!start || !end) return; // 不传日期就跳过，用页面默认值
  const ok = await evalInAnyFrame(
    page,
    (s, e) => {
      const inputs = Array.from(document.querySelectorAll('input.saas-picker-input, input[placeholder*="开始"], input[placeholder*="结束"]'));
      if (inputs.length < 2) return false;
      const [startInput, endInput] = inputs;
      for (const [input, value] of [[startInput, s], [endInput, e]]) {
        input.focus();
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return true;
    },
    start,
    end
  );
  if (!ok) throw new Error('未找到日期筛选输入框，页面结构可能变了');
}

withBrowser(async (browser) => {
  const pages = await browser.pages();
  for (const p of pages) {
    if (p.url().includes('meituan.com')) await p.close().catch(() => {});
  }

  const page = await browser.newPage();
  await page.goto(REPORT_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);

  if (page.url().includes('/login') || page.url().includes('rms-account')) {
    throw new Error('未登录，先用 kingsh2012-meituan-pos-login 的 send-code.js/submit-code.js 登录');
  }

  await setDateRange(page, dateStart, dateEnd);
  await sleep(300);

  const queried = await clickTextInAnyFrame(page, '查询');
  if (queried) await sleep(1500);

  const exported = await clickTextInAnyFrame(page, '导出');
  if (!exported) throw new Error('未找到导出按钮');

  await sleep(2000);
  const shotPath = process.argv[4] || '/tmp/meituan-export-stored-balance.png';
  await page.screenshot({ path: shotPath });
  console.log(JSON.stringify({ ok: true, screenshot: shotPath }));
}).catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
