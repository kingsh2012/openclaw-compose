const path = require('path');

// 依赖装在 workspace 共享的 deps/node/node_modules 下，跟 qiniu-cdn-upload skill 用同一套规则
const workspace = path.resolve(__dirname, '../../..');
process.env.NODE_PATH = [
  path.join(workspace, 'deps/node/node_modules'),
  process.env.NODE_PATH || '',
].filter(Boolean).join(path.delimiter);
require('module').Module._initPaths();

const puppeteer = require('puppeteer-core');

const CDP_URL = process.env.MEITUAN_CDP_URL || 'http://127.0.0.1:9223';
const POS_URL = 'https://pos.meituan.com';

async function withBrowser(fn) {
  const browser = await puppeteer.connect({ browserURL: CDP_URL, defaultViewport: null });
  try {
    return await fn(browser);
  } finally {
    await browser.disconnect();
  }
}

async function findPosPage(browser) {
  const pages = await browser.pages();
  return pages.find((p) => p.url().includes('meituan.com')) || (await browser.newPage());
}

async function findLoginFrame(page) {
  return page.frames().find((f) => f.url().includes('eepassport.meituan.com'));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = { withBrowser, findPosPage, findLoginFrame, sleep, CDP_URL, POS_URL };
