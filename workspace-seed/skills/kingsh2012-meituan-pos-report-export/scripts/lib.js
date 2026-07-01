const path = require('path');
const fs = require('fs');
const os = require('os');

const workspace = path.resolve(__dirname, '../../..');
process.env.NODE_PATH = [
  path.join(workspace, 'deps/node/node_modules'),
  process.env.NODE_PATH || '',
].filter(Boolean).join(path.delimiter);
require('module').Module._initPaths();

const { chromium } = require('playwright');

function readCdpUrl() {
  const configPath =
    process.env.MEITUAN_OPENCLAW_CONFIG ||
    process.env.OPENCLAW_CONFIG ||
    path.join(os.homedir(), '.openclaw', 'openclaw.json');
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const b = config.browser || {};
    const p = b.defaultProfile || 'remote';
    return b.profiles?.[p]?.cdpUrl || b.profiles?.remote?.cdpUrl;
  } catch (_) { return undefined; }
}

const CDP_URL = process.env.MEITUAN_CDP_URL || readCdpUrl() || 'http://127.0.0.1:9223';
const CHROME_CONTAINER = process.env.MEITUAN_CHROME_CONTAINER || 'openclaw-chrome';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function connectBrowser() {
  return chromium.connectOverCDP(CDP_URL);
}

async function withBrowser(fn) {
  const browser = await connectBrowser();
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

async function newPage(browser, url) {
  const page = await browser.contexts()[0].newPage();
  if (url) await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  return page;
}

async function closeMeituanPages(browser) {
  const pages = browser.contexts().flatMap(c => c.pages());
  for (const p of pages) {
    if (p.url().includes('meituan.com')) await p.close().catch(() => {});
  }
}

async function waitForFrame(page, urlPattern, timeout = 20000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const frame = page.frames().find(f => f.url().includes(urlPattern));
    if (frame) return frame;
    await sleep(300);
  }
  throw new Error(`Frame 未出现: ${urlPattern}`);
}

// ── 日期选择器 ──────────────────────────────────────────────

async function navToYearMonth(frame, targetYear, targetMonth) {
  while (true) {
    const year = parseInt(await frame.$eval('.saas-picker-dropdown .saas-picker-year-btn', el => el.textContent));
    const month = parseInt(await frame.$eval('.saas-picker-dropdown .saas-picker-month-btn', el => el.textContent));
    if (year === targetYear && month === targetMonth) break;
    if (year > targetYear || (year === targetYear && month > targetMonth)) {
      await frame.click('.saas-picker-dropdown .saas-picker-header-prev-btn');
    } else {
      await frame.click('.saas-picker-dropdown .saas-picker-header-next-btn');
    }
    await sleep(150);
  }
}

async function setTimeCol(frame, colIndex, value) {
  const padded = String(value).padStart(2, '0');
  await frame.evaluate(({ idx, val }) => {
    const col = document.querySelectorAll('.saas-picker-dropdown .saas-picker-time-panel-column')[idx];
    const li = Array.from(col?.querySelectorAll('li') || []).find(el => el.textContent.trim() === val);
    li?.click();
  }, { idx: colIndex, val: padded });
  await sleep(100);
}

// 通过日历面板交互设置日期范围，startStr / endStr 格式 YYYY-MM-DD
async function setDateRange(frame, page, startStr, endStr) {
  const [sy, sm] = startStr.split('-').map(Number);
  const [ey, em] = endStr.split('-').map(Number);

  // 打开面板
  await frame.click('.saas-picker');
  await frame.waitForSelector('.saas-picker-dropdown', { timeout: 5000 });

  // 选开始日期
  await navToYearMonth(frame, sy, sm);
  // 安全传参：dateStr 经 JSON.stringify 后嵌入 CSS 属性选择器，避免注入
  await frame.locator(`td[title=${JSON.stringify(startStr)}] .saas-picker-cell-inner`).click();
  await sleep(400);

  // 设开始时间 00:00:00 并确认
  await setTimeCol(frame, 0, 0);
  await setTimeCol(frame, 1, 0);
  await setTimeCol(frame, 2, 0);
  await sleep(200);
  await frame.click('.saas-picker-dropdown .saas-picker-ok button');
  await sleep(500);

  // 面板应保持打开，等待选结束日期
  await frame.waitForSelector('.saas-picker-dropdown', { timeout: 3000 });

  // 选结束日期
  await navToYearMonth(frame, ey, em);
  await frame.locator(`td[title=${JSON.stringify(endStr)}] .saas-picker-cell-inner`).click();
  await sleep(400);

  // 设结束时间 23:59:59 并确认
  await setTimeCol(frame, 0, 23);
  await setTimeCol(frame, 1, 59);
  await setTimeCol(frame, 2, 59);
  await sleep(200);
  await frame.click('.saas-picker-dropdown .saas-picker-ok button');
  await sleep(800);
}

module.exports = {
  CDP_URL, CHROME_CONTAINER,
  sleep, connectBrowser, withBrowser, newPage,
  closeMeituanPages, waitForFrame, setDateRange,
};
