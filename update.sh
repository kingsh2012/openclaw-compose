#!/bin/bash
# 从 templates/docker-compose.yml 重新生成 docker-compose.yml 并应用。
# 用于模板有更新时（例如新增 scheduler 服务），同步现有实例的 compose 配置。
# 不会重新生成 token，也不会重新安装飞书插件——这些只在 init.sh 首次初始化时做。

set -e

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$DEPLOY_DIR/data"
COMPOSE_TPL="$DEPLOY_DIR/templates/docker-compose.yml"
COMPOSE_OUT="$DEPLOY_DIR/docker-compose.yml"
ENV_FILE="$DEPLOY_DIR/.env"
LOCK_FILE="$DEPLOY_DIR/.init.lock"

if [ ! -f "$LOCK_FILE" ]; then
  echo "错误：未找到 $LOCK_FILE，请先执行 init.sh 完成首次初始化"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "错误：$ENV_FILE 不存在"
  exit 1
fi

# 加载环境变量
set -a
source "$ENV_FILE"
set +a

# 检查必填变量
if [ -z "$INSTANCE_NAME" ] || [ -z "$INSTANCE_PORT" ]; then
  echo "错误：.env 中必须设置 INSTANCE_NAME 和 INSTANCE_PORT"
  exit 1
fi

# 从模板重新生成 docker-compose.yml
envsubst < "$COMPOSE_TPL" > "$COMPOSE_OUT"
echo "docker-compose.yml 已更新（实例: $INSTANCE_NAME, 端口: $INSTANCE_PORT）"

# 同步自定义 skills（仓库 custom-skills/ → data/workspace/skills/）
CUSTOM_SKILLS_DIR="$DEPLOY_DIR/custom-skills"
WORKSPACE_SKILLS_DIR="$DATA_DIR/workspace/skills"
if [ -d "$CUSTOM_SKILLS_DIR" ] && [ -n "$(ls -A "$CUSTOM_SKILLS_DIR" 2>/dev/null)" ]; then
  mkdir -p "$WORKSPACE_SKILLS_DIR"
  for skill_dir in "$CUSTOM_SKILLS_DIR"/*/; do
    name="$(basename "$skill_dir")"
    rm -rf "$WORKSPACE_SKILLS_DIR/$name"
    cp -r "$skill_dir" "$WORKSPACE_SKILLS_DIR/$name"
  done
  chown -R 1000:1000 "$WORKSPACE_SKILLS_DIR"
  echo "自定义 skills 已同步：$(ls "$CUSTOM_SKILLS_DIR")"
fi

# 应用变更（新增/修改的服务会被构建并启动）
echo ""
docker compose -f "$COMPOSE_OUT" up -d --build
echo ""
echo "更新完成。"
