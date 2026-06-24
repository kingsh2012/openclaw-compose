---
name: linkfog-qiniu-openclaw-upload
description: "Upload files to Qiniu bucket smarteamlab-dl under the openclaw/ prefix and return CDN URLs."
---

# Qiniu OpenClaw Upload

Use when uploading release artifacts or test files to Qiniu for OpenClaw downloads.

## Fixed target

- Bucket: `smarteamlab-dl`
- Key prefix: `openclaw/`
- CDN base: `http://cdn.smarteamlab.com`
- Region: `z1`
- Secrets live only in `/home/node/.openclaw/workspace/.secrets/qiniu.json`:
  - `access_key`
  - `secret_key`
  - `bucket`
  - `domain`
  - `zone`

Never print or store AK/SK in chat, docs, logs, or skill bodies.

## Trigger policy

Do not upload every image/file by default. Upload only when the user clearly asks, for example:

- “上传到七牛”
- “传到 openclaw”
- “生成下载链接”
- “把这张图上传”
- “发 CDN 链接”

If the user only sends a file/image for review, analysis, or naming, do not upload it.

## Naming

Use readable, stable object keys under `openclaw/`.

- Screenshots: `openclaw/screenshots/<source>-<page-or-feature>-<main-subject>-<YYYYMMDD-HHMM>.<ext>`
- Releases: `openclaw/releases/openclaw-<version>-<platform>-<arch>.<ext>`
- Ad-hoc files: `openclaw/<category>/<descriptive-name>-<YYYYMMDD-HHMM>.<ext>`

Prefer lowercase words separated by hyphens. Avoid random names unless the user requests them.

## Workflow

1. Confirm the local file exists.
2. Choose object key under `openclaw/`; preserve filename unless user specifies another path.
3. Run the helper script from workspace root:

```bash
node skills/linkfog-qiniu-openclaw-upload/scripts/upload.js <localFile> [openclaw/path/in-bucket]
```

4. Return the printed CDN URL.
5. If upload fails with region error, update `.secrets/qiniu.json` field `zone` only after reading the error and retrying once.

## Notes

- Directory uploads are not supported by this helper; upload files individually or package first.
- For public download links, use `http://cdn.smarteamlab.com/<key>`.
