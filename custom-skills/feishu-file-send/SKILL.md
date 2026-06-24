---
name: "feishu-file-send"
description: "Feishu 文件附件发送规范"
---

# Feishu File Send

Use when the user asks to send, resend, attach, or deliver a local file/Excel/CSV/ZIP/PDF through Feishu, either in a direct chat or a group chat.

## Why

For Feishu, final-answer `MEDIA:/path/to/file` may be stripped or fail as a no-visible-reply fallback. Prefer the first-class `message` tool with an explicit `media` path.

## Prerequisite

The agent must have the messaging tool available. If not, enable it in OpenClaw config and restart Gateway:

```json
{
  "tools": {
    "profile": "coding",
    "alsoAllow": ["browser", "group:messaging"]
  }
}
```

Then restart:

```bash
openclaw gateway restart
```

## Workflow

1. Verify the file exists and is non-empty.
   - For `.xlsx`, also verify it is a valid zip package when practical.
2. Use the `message` tool, not `MEDIA:` in the final reply.
3. Choose the correct Feishu target:
   - Direct/user: `target: "user:<open_id>"`
   - Group/chat: `target: "chat:<chat_id>"`
   - If already in the intended current conversation, omitting `target` may auto-reply there, but for important files prefer an explicit `target`.
4. Use the `message` tool with:
   - `accountId: "default"`
   - `action: "send"`
   - `message`: short visible caption.
   - `media`: absolute local file path.
   - `filename`: desired displayed filename.
   - `mimeType`: correct MIME type.
   - `forceDocument: true` for files such as xlsx/csv/zip/pdf.
5. Check the tool result:
   - `ok: true`
   - receipt part `kind: "media"`
   - record returned `messageId`.
6. In the chat reply, state that the attachment send succeeded and include the returned message id if useful. Do not add a `MEDIA:` line after using the message tool, to avoid duplicate or broken sends.

## Common MIME Types

- xlsx: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- csv: `text/csv`
- zip: `application/zip`
- pdf: `application/pdf`

## Examples

### Send to a user

```json
{
  "accountId": "default",
  "action": "send",
  "target": "user:<open_id>",
  "message": "📦 这是 Excel 附件，请下载使用",
  "media": "/home/node/.openclaw/workspace/report.xlsx",
  "filename": "report.xlsx",
  "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "forceDocument": true
}
```

### Send to a group

```json
{
  "accountId": "default",
  "action": "send",
  "target": "chat:<chat_id>",
  "message": "📦 这是 Excel 附件，请下载使用",
  "media": "/home/node/.openclaw/workspace/report.xlsx",
  "filename": "report.xlsx",
  "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "forceDocument": true
}
```

## Failure Handling

If the send fails:

- Do not claim the file was sent.
- Report the exact error from the tool result.
- Keep the generated file path available.
- If the file exists but Feishu rejects it, try ZIP packaging or a simpler filename, then resend with the same `message` tool path.
