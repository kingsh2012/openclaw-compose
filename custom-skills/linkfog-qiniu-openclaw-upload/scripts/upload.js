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

function readQiniuConfig() {
  const p = path.join(secretsDir, 'qiniu.json');
  if (!fs.existsSync(p)) throw new Error(`missing secret config: ${p}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function usage() {
  console.error('Usage: node skills/linkfog-qiniu-openclaw-upload/scripts/upload.js <localFile> [openclaw/path/in-bucket]');
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
