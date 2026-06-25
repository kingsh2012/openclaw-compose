#!/usr/bin/env node
// 检查美团管家(pos.meituan.com)在 openclaw-chrome 容器里的登录态是否仍然有效。
// 用法: node check-session.js
// 输出 JSON: { loggedIn: boolean, url: string }
const { withBrowser, POS_URL, sleep } = require('./lib');

withBrowser(async (browser) => {
  const page = await browser.newPage();
  try {
    await page.goto(POS_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    const url = page.url();
    const loggedIn = !url.includes('/login') && !url.includes('/selectorg') && !url.includes('rms-account');
    console.log(JSON.stringify({ loggedIn, url }));
  } finally {
    await page.close();
  }
}).catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
