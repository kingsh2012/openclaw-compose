#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const workspace = path.resolve(__dirname, '../../..');
process.env.NODE_PATH = [
  path.join(workspace, 'deps/node/node_modules'),
  process.env.NODE_PATH || '',
].filter(Boolean).join(path.delimiter);
require('module').Module._initPaths();

const qiniu = require('qiniu');
const secretsDir = path.join(workspace, '.secrets');
const SECRET_FILE = 'kingsh2012-qiniu-cdn-upload.json';

const REQUIRED_FIELDS = ['access_key', 'secret_key'];
const OPTIONAL_FIELDS_WITH_DEFAULTS = {
  bucket: 'smarteamlab-dl',
  domain: 'https://cdn.smarteamlab.com',
  zone: 'z1',
};

function configMissingMessage(p) {
  const example = JSON.stringify(
    { access_key: '<access_key>', secret_key: '<secret_key>', ...OPTIONAL_FIELDS_WITH_DEFAULTS },
    null,
    2
  );
  return [
    `CONFIG_MISSING: ${p} 不存在。`,
    `请把缺失的配置内容告知用户，让用户通过聊天提供以下字段，由你（agent）创建/补全该文件：`,
    `必填：${REQUIRED_FIELDS.join(', ')}`,
    `可选（有默认值，用户没给就用默认值）：${Object.keys(OPTIONAL_FIELDS_WITH_DEFAULTS).join(', ')}`,
    `示例内容：`,
    example,
    `创建后注意：目录 .secrets/ 权限 700，文件权限 600，不要把内容打印回聊天里确认（只确认字段是否齐全即可）。`,
  ].join('\n');
}

function readQiniuConfig() {
  const p = path.join(secretsDir, SECRET_FILE);
  if (!fs.existsSync(p)) {
    console.error(configMissingMessage(p));
    process.exit(3);
  }
  const config = JSON.parse(fs.readFileSync(p, 'utf8'));
  const missing = REQUIRED_FIELDS.filter((field) => !config[field]);
  if (missing.length > 0) {
    console.error(`CONFIG_INCOMPLETE: ${p} 缺少字段: ${missing.join(', ')}`);
    console.error(`请把缺失字段告知用户，让用户通过聊天提供，由你（agent）补全该文件后重试。`);
    process.exit(3);
  }
  return config;
}

function usage() {
  console.error('Usage: node skills/kingsh2012-qiniu-cdn-upload/scripts/upload.js <localFile> [openclaw/path/in-bucket]');
  process.exit(2);
}

const [localFileArg, keyArg] = process.argv.slice(2);
if (!localFileArg) usage();
const localFile = path.resolve(process.cwd(), localFileArg);
if (!fs.existsSync(localFile) || !fs.statSync(localFile).isFile()) {
  console.error(`local file not found or not a file: ${localFileArg}`);
  process.exit(2);
}

let key = keyArg || `openclaw/${path.basename(localFile)}`;
key = key.replace(/^\/+/, '');
if (!key.startsWith('openclaw/')) key = `openclaw/${key}`;

const qiniuConfig = readQiniuConfig();
const accessKey = qiniuConfig.access_key;
const secretKey = qiniuConfig.secret_key;
const bucket = qiniuConfig.bucket || 'smarteamlab-dl';
const zoneName = qiniuConfig.zone || 'z1';
const domain = (qiniuConfig.domain || 'https://cdn.smarteamlab.com').replace(/\/$/, '');

const zones = {
  z0: qiniu.zone.Zone_z0,
  z1: qiniu.zone.Zone_z1,
  z2: qiniu.zone.Zone_z2,
  na0: qiniu.zone.Zone_na0,
  as0: qiniu.zone.Zone_as0,
};
if (!zones[zoneName]) throw new Error(`unsupported qiniu zone: ${zoneName}`);

const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
const putPolicy = new qiniu.rs.PutPolicy({ scope: `${bucket}:${key}` });
const uploadToken = putPolicy.uploadToken(mac);
const config = new qiniu.conf.Config();
config.zone = zones[zoneName];
const formUploader = new qiniu.form_up.FormUploader(config);
const putExtra = new qiniu.form_up.PutExtra();

formUploader.putFile(uploadToken, key, localFile, putExtra, (err, body, info) => {
  if (err) {
    console.error(err.message || err);
    process.exit(1);
  }
  if (info.statusCode !== 200) {
    console.error(`upload failed: HTTP ${info.statusCode}`);
    console.error(typeof body === 'string' ? body : JSON.stringify(body));
    process.exit(1);
  }
  console.log(`UPLOAD_OK bucket=${bucket} key=${key}`);
  console.log(`${domain}/${encodeURI(key).replace(/%2F/g, '/')}`);
});
