const path = require('path');

const workspace = path.resolve(__dirname, '../../..');
process.env.NODE_PATH = [
  path.join(workspace, 'deps/node/node_modules'),
  process.env.NODE_PATH || '',
].filter(Boolean).join(path.delimiter);
require('module').Module._initPaths();

const puppeteer = require('puppeteer-core');

const CDP_URL = process.env.MEITUAN_CDP_URL || 'http://127.0.0.1:9223';
const CHROME_CONTAINER = process.env.MEITUAN_CHROME_CONTAINER || 'openclaw-chrome';

async function withBrowser(fn) {
  const browser = await puppeteer.connect({ browserURL: CDP_URL, defaultViewport: null });
  try {
    return await fn(browser);
  } finally {
    await browser.disconnect();
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// 按精确文本(忽略内部空格)在所有 frame(包括嵌套 iframe)里点击，返回 true/false
async function clickTextInAnyFrame(page, text) {
  for (const frame of page.frames()) {
    const ok = await frame
      .evaluate((t) => {
        const el = Array.from(document.querySelectorAll('*')).find(
          (e) => e.children.length === 0 && e.textContent && e.textContent.replace(/\s/g, '') === t
        );
        if (el) {
          el.click();
          return true;
        }
        return false;
      }, text)
      .catch(() => false);
    if (ok) return true;
  }
  return false;
}

// 在所有 frame 里找输入框/控件，传入一个在 frame.evaluate 里跑的函数
async function evalInAnyFrame(page, fn, ...args) {
  for (const frame of page.frames()) {
    const result = await frame.evaluate(fn, ...args).catch(() => undefined);
    if (result) return result;
  }
  return undefined;
}

module.exports = { withBrowser, sleep, clickTextInAnyFrame, evalInAnyFrame, CDP_URL, CHROME_CONTAINER };
