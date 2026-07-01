#!/usr/bin/env node
// 检查美团管家(pos.meituan.com)在 openclaw-chrome 容器里的登录态是否仍然有效。
// 用法: node check-session.js
// 输出 JSON: { loggedIn: boolean, url: string }
const { withBrowser, newPage, POS_URL, sleep } = require('./lib');

withBrowser(async (browser) => {
  const page = await newPage(browser, POS_URL);
  await sleep(2000);
  const url = page.url();
  const loggedIn = !url.includes('/login') && !url.includes('eepassport') &&
                   !url.includes('/selectorg') && !url.includes('rms-account');
  console.log(JSON.stringify({ loggedIn, url }));
  await page.close();
}).catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
