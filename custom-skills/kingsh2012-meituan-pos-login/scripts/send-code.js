#!/usr/bin/env node
// 第一步：在登录页填手机号、勾选协议、点击发送验证码。
// 用法: node send-code.js <手机号>
// 成功后等待用户在聊天里提供验证码，再跑 submit-code.js <验证码>
const { withBrowser, findPosPage, findLoginFrame, POS_URL, sleep } = require('./lib');

const phone = process.argv[2];
if (!phone) {
  console.error('Usage: node send-code.js <phone>');
  process.exit(2);
}

withBrowser(async (browser) => {
  // 清掉旧的美团相关标签页，避免越开越多
  const pages = await browser.pages();
  for (const p of pages) {
    if (p.url().includes('meituan.com') || p.url() === 'about:blank') {
      await p.close().catch(() => {});
    }
  }

  const page = await browser.newPage();
  await page.goto(POS_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  const frame = await findLoginFrame(page);
  if (!frame) throw new Error('未找到登录 iframe，可能已经处于登录态，建议先跑 check-session.js');

  await frame.waitForSelector('input', { timeout: 10000 });
  await sleep(500);

  const inputs = await frame.$$('input');
  const phoneHandle = inputs[1];
  await phoneHandle.click({ clickCount: 3 });
  await phoneHandle.press('Backspace');
  await phoneHandle.type(phone, { delay: 80 });
  await sleep(400);

  await frame.evaluate(() => {
    const cb = document.querySelector('input.selectChecked');
    if (cb && !cb.checked) {
      const label = document.querySelector('label[for="checkbox"]');
      if (label) label.click();
    }
  });
  await sleep(400);

  await frame.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(
      (e) => e.children.length === 0 && e.textContent && e.textContent.replace(/\s/g, '') === '获取验证码'
    );
    if (el) el.click();
    else throw new Error('未找到发送验证码按钮');
  });

  await sleep(1200);
  const shotPath = process.argv[3] || '/tmp/meituan-send-code.png';
  await page.screenshot({ path: shotPath });
  console.log(JSON.stringify({ ok: true, phone, screenshot: shotPath }));
}).catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
