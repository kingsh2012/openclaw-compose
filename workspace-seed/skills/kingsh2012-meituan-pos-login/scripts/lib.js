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
const POS_URL = 'https://pos.meituan.com';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function connectBrowser() {
  return chromium.connectOverCDP(CDP_URL);
}

// 连接浏览器，执行 fn，断开连接（不关闭 Chrome 进程）
async function withBrowser(fn) {
  const browser = await connectBrowser();
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

// 在已有 context 里新开 tab 并导航
async function newPage(browser, url) {
  const page = await browser.contexts()[0].newPage();
  if (url) await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  return page;
}

// 关闭所有 meituan.com 标签页
async function closeMeituanPages(browser) {
  const pages = browser.contexts().flatMap(c => c.pages());
  for (const p of pages) {
    if (p.url().includes('meituan.com')) await p.close().catch(() => {});
  }
}

// 找已有的 meituan.com 标签页
function findMeituanPage(browser) {
  return browser.contexts().flatMap(c => c.pages()).find(p => p.url().includes('meituan.com'));
}

// 等待包含 urlPattern 的 frame 出现
async function waitForFrame(page, urlPattern, timeout = 20000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const frame = page.frames().find(f => f.url().includes(urlPattern));
    if (frame) return frame;
    await sleep(300);
  }
  throw new Error(`Frame 未出现: ${urlPattern}`);
}

module.exports = { CDP_URL, POS_URL, sleep, connectBrowser, withBrowser, newPage, closeMeituanPages, findMeituanPage, waitForFrame };
