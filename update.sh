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

# 同步 seed 中"共享且非 agent 自维护"的部分：skills/ 和参考文档。
# 刻意不覆盖 AGENTS.md / SOUL.md / IDENTITY.md / USER.md / TOOLS.md / HEARTBEAT.md /
# MEMORY.md / memory/ —— 这些首启后由 agent 自己维护，覆盖会抹掉它长出来的记忆和定制。
SEED_DIR="$DEPLOY_DIR/workspace-seed"
WORKSPACE_DIR="$DATA_DIR/workspace"

# 技能：整体覆盖同步
if [ -d "$SEED_DIR/skills" ]; then
  mkdir -p "$WORKSPACE_DIR/skills"
  for skill_dir in "$SEED_DIR"/skills/*/; do
    name="$(basename "$skill_dir")"
    rm -rf "$WORKSPACE_DIR/skills/$name"
    cp -r "$skill_dir" "$WORKSPACE_DIR/skills/$name"
  done
  echo "自定义 skills 已同步：$(ls "$SEED_DIR/skills")"
fi

# 参考文档：可安全覆盖（纯参考，不含 agent 自维护状态）
for f in WORKSPACE_DESIGN.md IMAGE_GENERATE_NOTE.md; do
  if [ -f "$SEED_DIR/$f" ]; then
    cp "$SEED_DIR/$f" "$WORKSPACE_DIR/$f"
  fi
done

chown -R 1000:1000 "$WORKSPACE_DIR"
echo "workspace 参考文档与技能已同步（未触碰 agent 自维护文件）"

# 应用变更（新增/修改的服务会被构建并启动）
echo ""
docker compose -f "$COMPOSE_OUT" up -d --build
echo ""
echo "更新完成。"
