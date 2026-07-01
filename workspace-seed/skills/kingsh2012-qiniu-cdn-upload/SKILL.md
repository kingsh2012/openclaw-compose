---
name: kingsh2012-qiniu-cdn-upload
description: "Upload files to Qiniu bucket smarteamlab-dl under the openclaw/ prefix and return CDN URLs."
---

# Qiniu OpenClaw Upload

Use when uploading release artifacts or test files to Qiniu for OpenClaw downloads.

## Fixed target

- Bucket: `smarteamlab-dl`
- Key prefix: `openclaw/`
- CDN base: `http://cdn.smarteamlab.com`
- Region: `z1`
- Secrets live only in `/home/node/.openclaw/workspace/.secrets/kingsh2012-qiniu-cdn-upload.json`
  (file name matches the skill name), JSON format:
  - `access_key` (required)
  - `secret_key` (required)
  - `bucket` (optional, defaults to `smarteamlab-dl`)
  - `domain` (optional, defaults to `https://cdn.smarteamlab.com`)
  - `zone` (optional, defaults to `z1`)

Never print or store AK/SK in chat, docs, logs, or skill bodies.

## If the secret config is missing or incomplete

The script does **not** crash with a raw error in this case — it exits with a clear message
(`CONFIG_MISSING` / `CONFIG_INCOMPLETE`) listing exactly which fields are needed. When you see
that message:

1. Tell the user exactly which fields are missing (required: `access_key`, `secret_key`).
2. Ask the user to send the values via chat.
3. Create or update `.secrets/kingsh2012-qiniu-cdn-upload.json` yourself with the values the user
   gave you. Set directory permission `700` on `.secrets/` and file permission `600` on the JSON
   file.
4. Retry the upload. Do not echo the secret values back into the chat — only confirm the fields
   are now complete.

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
3. Make sure the `qiniu` npm package is installed under workspace deps (one-time setup per instance):

```bash
cd deps/node && npm install qiniu
```

   The script adds `deps/node/node_modules` to `NODE_PATH`, so it must be installed there, not
   in the skill's own directory. If `node ... upload.js` fails with `Cannot find module 'qiniu'`,
   this step was skipped.

4. Run the helper script from workspace root:

```bash
node skills/kingsh2012-qiniu-cdn-upload/scripts/upload.js <localFile> [openclaw/path/in-bucket]
```

5. If the script exits with `CONFIG_MISSING`/`CONFIG_INCOMPLETE`, follow "If the secret config is
   missing or incomplete" above, then retry.
6. Return the printed CDN URL.
7. If upload fails with region error, update `.secrets/kingsh2012-qiniu-cdn-upload.json` field
   `zone` only after reading the error and retrying once.

## Notes

- Directory uploads are not supported by this helper; upload files individually or package first.
- For public download links, use `http://cdn.smarteamlab.com/<key>`.
