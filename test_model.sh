#!/bin/bash

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$DEPLOY_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "错误：$ENV_FILE 不存在，请先复制 .env.example 并填写"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

curl "${GPT_API_URL}/models" -H "Authorization: Bearer ${GPT_API_KEY}" | jq
