#!/usr/bin/env node
// 第二步：填验证码并点击登录；如果出现"选择集团/门店"页且只有一个机构，自动选择。
// 用法: node submit-code.js <验证码>
const { withBrowser, findPosPage, findLoginFrame, sleep } = require('./lib');

const code = process.argv[2];
if (!code) {
  console.error('Usage: node submit-code.js <code>');
  process.exit(2);
}

withBrowser(async (browser) => {
  const page = await findPosPage(browser);
  const frame = await findLoginFrame(page);
  if (!frame) throw new Error('未找到登录 iframe，可能验证码已过期需要重新 send-code.js');

  const inputs = await frame.$$('input');
  const codeHandle = inputs[2];
  await codeHandle.click({ clickCount: 3 });
  await codeHandle.type(code, { delay: 80 });
  await sleep(400);

  await frame.evaluate(() => {
    const cb = document.querySelector('input.selectChecked');
    if (cb && !cb.checked) {
      const label = document.querySelector('label[for="checkbox"]');
      if (label) label.click();
    }
  });
  await sleep(300);

  await frame.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button, div, span')).find(
      (e) => e.children.length === 0 && e.textContent && e.textContent.trim() === '登录'
    );
    if (btn) btn.click();
    else throw new Error('未找到登录按钮');
  });

  await sleep(2500);

  // 登录后可能进入"选择集团/门店"页：如果只有一个机构，自动点选择
  if (page.url().includes('selectorg')) {
    const orgFrame = page.frames().find((f) => f.url().includes('selectorg')) || page.mainFrame();
    const orgCount = await orgFrame.evaluate(() =>
      document.querySelectorAll('.content-list .ant-collapse, [class*="org-item"]').length
    );
    await orgFrame.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      const btn = all.find(
        (e) => e.children.length === 0 && e.textContent && e.textContent.replace(/\s/g, '') === '选择'
      );
      if (btn) btn.click();
    });
    await sleep(2500);
  }

  const shotPath = process.argv[3] || '/tmp/meituan-login-result.png';
  await page.screenshot({ path: shotPath });
  console.log(JSON.stringify({ ok: true, url: page.url(), screenshot: shotPath }));
}).catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
