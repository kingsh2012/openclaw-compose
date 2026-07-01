#!/usr/bin/env node
// 第二步：填验证码并点击登录；如果出现"选择集团/门店"页且只有一个机构，自动选择。
// 用法: node submit-code.js <验证码>
const fs = require('fs');
const { withBrowser, newPage, findMeituanPage, waitForFrame, POS_URL, sleep } = require('./lib');

const code = process.argv[2];
if (!code) {
  console.error('Usage: node submit-code.js <code>');
  process.exit(2);
}

withBrowser(async (browser) => {
  // 优先复用 send-code.js 留下的标签页，找不到就重新导航
  let page = findMeituanPage(browser);
  if (!page) {
    page = await newPage(browser, POS_URL);
  }

  // 等登录 iframe
  const frame = await waitForFrame(page, 'eepassport.meituan.com', 15000)
    .catch(() => { throw new Error('未找到登录 iframe，可能验证码已过期，请重新跑 send-code.js'); });

  await frame.waitForSelector('input:nth-of-type(3)', { timeout: 10000 });
  await sleep(200);

  // 填验证码（第 3 个 input）
  await frame.click('input:nth-of-type(3)');
  await frame.evaluate(() => document.querySelector('input:nth-of-type(3)')?.select());
  await page.keyboard.type(code, { delay: 60 });
  await sleep(400);

  // 确保协议已勾选
  await frame.evaluate(() => {
    const cb = document.querySelector('input.selectChecked');
    if (cb && !cb.checked) document.querySelector('label[for="checkbox"]')?.click();
  });
  await sleep(300);

  // 点"登录"
  const clicked = await frame.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button,div,span')).find(
      e => e.children.length === 0 && e.textContent?.trim() === '登录'
    );
    if (!btn) return false;
    btn.click();
    return true;
  });
  if (!clicked) throw new Error('未找到登录按钮');

  await sleep(2500);

  // 若进入"选择集团/门店"页，自动点唯一的"选择"按钮
  if (page.url().includes('selectorg')) {
    for (const f of page.frames()) {
      const ok = await f.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('*')).find(
          e => e.children.length === 0 && e.textContent?.replace(/\s/g, '') === '选择'
        );
        if (!btn) return false;
        btn.click();
        return true;
      }).catch(() => false);
      if (ok) break;
    }
    await sleep(2500);
  }

  const shotPath = process.argv[3] || '/tmp/meituan-login-result.png';
  await page.screenshot({ path: shotPath });
  console.log(JSON.stringify({ ok: true, url: page.url(), screenshot: shotPath }));
}).catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
