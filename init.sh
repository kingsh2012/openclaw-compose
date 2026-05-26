#!/bin/bash
# 初始化 OpenClaw 数据目录、复制配置、生成 token、安装插件

set -e

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="/data/openclaw/data"
CONFIG_SRC="$DEPLOY_DIR/openclaw.json.example"
CONFIG_DST="$DATA_DIR/openclaw.json"
ENV_FILE="$DEPLOY_DIR/.env"
LOCK_FILE="$DEPLOY_DIR/.init.lock"

# 防止重复执行
if [ -f "$LOCK_FILE" ]; then
  echo "已初始化过（$LOCK_FILE 存在），跳过。"
  echo "如需重新初始化，请先删除 $LOCK_FILE"
  exit 0
fi

# 检查 .env 文件
if [ ! -f "$ENV_FILE" ]; then
  echo "错误：$ENV_FILE 不存在，请先复制 .env.example 并填写："
  echo "  cp .env.example .env"
  exit 1
fi

# 加载环境变量
set -a
source "$ENV_FILE"
set +a

# 检查并安装 setfacl
if ! command -v setfacl &>/dev/null; then
  echo "安装 acl..."
  apt-get install -y acl
fi

# 创建数据目录并设置权限
mkdir -p "$DATA_DIR"
setfacl -R -m u:1000:rwx "$DATA_DIR"
setfacl -d -m u:1000:rwx "$DATA_DIR"
echo "数据目录已创建：$DATA_DIR"

# 替换变量并写入配置
envsubst < "$CONFIG_SRC" > "$CONFIG_DST"
chmod 666 "$CONFIG_DST"
echo "配置文件已生成：$CONFIG_DST"

# 生成随机 token
TOKEN=$(openssl rand -hex 32)
sed -i "s/\"token\": \"[^\"]*\"/\"token\": \"$TOKEN\"/g" "$CONFIG_DST"
echo "Gateway token 已生成并写入配置"

# 启动容器
echo ""
docker compose -f "$DEPLOY_DIR/docker-compose.yml" up -d
echo "容器已启动，等待就绪..."
sleep 15

# 安装飞书插件
echo "安装飞书插件..."
docker compose -f "$DEPLOY_DIR/docker-compose.yml" exec openclaw-gateway node dist/index.js plugins install @openclaw/feishu
echo "飞书插件安装完成"

# 重启使插件生效
docker compose -f "$DEPLOY_DIR/docker-compose.yml" restart
echo "容器已重启，插件生效"

# 写入 lock
touch "$LOCK_FILE"

echo ""
echo "初始化完成！"
