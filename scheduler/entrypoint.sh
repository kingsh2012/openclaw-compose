#!/bin/sh
# Runs supercronic against tools/scheduler/crontab and restarts it whenever
# the crontab file changes, so ops-scheduler-agent can add/remove jobs by
# just editing that file (no container restart needed).
set -eu

CRONTAB="/home/node/.openclaw/workspace/tools/scheduler/crontab"
PID=""
LAST=""

mkdir -p "$(dirname "$CRONTAB")"
touch "$CRONTAB"

# Seed the usage doc next to crontab on first run only — once it exists,
# OpenClaw/agents may edit it, so don't overwrite on later restarts
[ -f "$(dirname "$CRONTAB")/USAGE.md" ] || cp /usage.md "$(dirname "$CRONTAB")/USAGE.md"

term() {
  [ -n "$PID" ] && kill "$PID" 2>/dev/null
  exit 0
}
trap term TERM INT

while true; do
  CUR=$(stat -c %Y "$CRONTAB" 2>/dev/null || echo 0)
  if [ "$CUR" != "$LAST" ] || ! kill -0 "$PID" 2>/dev/null; then
    if [ -n "$PID" ]; then
      kill "$PID" 2>/dev/null || true
      wait "$PID" 2>/dev/null || true
    fi
    echo "[entrypoint] (re)starting supercronic, crontab mtime=$CUR"
    supercronic "$CRONTAB" &
    PID=$!
    LAST="$CUR"
  fi
  sleep 30 &
  wait "$!"
done
