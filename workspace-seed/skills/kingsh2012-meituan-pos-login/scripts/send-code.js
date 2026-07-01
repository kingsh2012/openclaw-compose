#!/usr/bin/env node
// 第一步：在登录页填手机号、勾选协议、点击发送验证码。
// 用法: node send-code.js <手机号>
// 成功后等待用户在聊天里提供验证码，再跑 submit-code.js <验证码>
const fs = require('fs');
const { withBrowser, newPage, closeMeituanPages, waitForFrame, POS_URL, sleep } = require('./lib');

const phone = process.argv[2];
if (!phone) {
  console.error('Usage: node send-code.js <phone>');
  process.exit(2);
}

withBrowser(async (browser) => {
  await closeMeituanPages(browser);
  const page = await newPage(browser, POS_URL);

  // 等登录 iframe（eepassport.meituan.com）
  const frame = await waitForFrame(page, 'eepassport.meituan.com', 20000)
    .catch(() => { throw new Error('未找到登录 iframe，可能已处于登录态，建议先跑 check-session.js'); });

  await frame.waitForSelector('input', { timeout: 10000 });
  await sleep(300);

  // 手机号输入框（第 2 个 input）
  await frame.click('input:nth-of-type(2)');
  await frame.evaluate(() => document.querySelector('input:nth-of-type(2)')?.select());
  // page.keyboard 产生 isTrusted: true 的键盘事件
  await page.keyboard.type(phone, { delay: 60 });
  await sleep(400);

  // 勾选协议
  await frame.evaluate(() => {
    const cb = document.querySelector('input.selectChecked');
    if (cb && !cb.checked) document.querySelector('label[for="checkbox"]')?.click();
  });
  await sleep(400);

  // 点"获取验证码"
  const sent = await frame.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(
      e => e.children.length === 0 && e.textContent?.replace(/\s/g, '') === '获取验证码'
    );
    if (!el) return false;
    el.click();
    return true;
  });
  if (!sent) throw new Error('未找到发送验证码按钮');

  await sleep(1200);
  const shotPath = process.argv[3] || '/tmp/meituan-send-code.png';
  await page.screenshot({ path: shotPath });
  // 手机号不写入日志
  console.log(JSON.stringify({ ok: true, screenshot: shotPath }));
  // 不关 page，submit-code.js 还要用
}).catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
