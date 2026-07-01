#!/usr/bin/env node
// 把 Chrome 容器内 /config/Downloads/ 下导出的文件拷到 workspace 的 outputs 目录。
// 用法:
//   node fetch-download.js                 列出 /config/Downloads/ 下的所有文件
//   node fetch-download.js <文件名>         把指定文件拷到 outputs/，输出本地路径
//   node fetch-download.js --latest         拷最新修改的文件

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 不依赖 lib.js，避免被它的 puppeteer-core require 拖累（这个脚本只用 docker cp，不连浏览器）
const CHROME_CONTAINER = process.env.MEITUAN_CHROME_CONTAINER || 'openclaw-chrome';

const workspace = path.resolve(__dirname, '../../..');
const outputsDir = path.join(workspace, 'outputs');

function dockerExec(args) {
  return execFileSync('docker', ['exec', CHROME_CONTAINER, ...args], { encoding: 'utf8' });
}

function listDownloads() {
  const out = dockerExec(['sh', '-c', 'ls -t /config/Downloads/']);
  return out.split('\n').filter(Boolean);
}

const arg = process.argv[2];

try {
  const files = listDownloads();
  if (!arg) {
    console.log(JSON.stringify({ files }));
    process.exit(0);
  }

  const filename = arg === '--latest' ? files[0] : arg;
  if (!filename || !files.includes(filename)) {
    console.error('ERROR: 文件不存在于 /config/Downloads/，现有文件:', JSON.stringify(files));
    process.exit(3);
  }

  fs.mkdirSync(outputsDir, { recursive: true });
  const localPath = path.join(outputsDir, filename);
  execFileSync('docker', ['cp', `${CHROME_CONTAINER}:/config/Downloads/${filename}`, localPath]);
  console.log(JSON.stringify({ ok: true, localPath }));
} catch (e) {
  console.error('ERROR:', e.message);
  process.exit(1);
}
