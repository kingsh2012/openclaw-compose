#!/bin/sh
# Wrapper invoked from the crontab. Usage: run-job.sh <job-name> <command...>
# - Runs <command...> as-is (cwd is the workspace, set via Dockerfile WORKDIR)
# - Logs to outputs/logs/scheduler/<job-name>.log
# - Skips the run (instead of overlapping) if a previous run is still active
set -eu

JOB_NAME="${1:?usage: run-job.sh <job-name> <command...>}"
shift

WORKSPACE_DIR="/home/node/.openclaw/workspace"
SCHED_DIR="$WORKSPACE_DIR/tools/scheduler"

LOG_DIR="$WORKSPACE_DIR/outputs/logs/scheduler"
LOCK_FILE="$SCHED_DIR/locks/${JOB_NAME}.lock"
LOG_FILE="$LOG_DIR/${JOB_NAME}.log"

mkdir -p "$LOG_DIR" "$SCHED_DIR/locks"

{
  echo "[$(date '+%F %T')] start $JOB_NAME"
  set +e
  flock -n "$LOCK_FILE" "$@"
  status=$?
  set -e
  echo "[$(date '+%F %T')] end (exit $status) $JOB_NAME"
  exit "$status"
} >> "$LOG_FILE" 2>&1
