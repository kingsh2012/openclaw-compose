# openclaw-${INSTANCE_NAME}-scheduler

Source for the scheduler image used by the `openclaw-${INSTANCE_NAME}-scheduler`
service (see `templates/docker-compose.yml`). It runs the recurring Python
jobs (DOT 同步、Pan123 日志同步 etc.) via `supercronic`, separate from the
main agent container, so they don't consume LLM tokens.

It shares the instance's `./data` volume, mounted at `/home/node/.openclaw`,
so it sees the same workspace as the main agent.

## Layout

- `Dockerfile` — `python:3.11-slim` + `supercronic` + `run-job.sh` baked in at
  `/usr/local/bin/run-job.sh`
- `entrypoint.sh` — runs `supercronic` against
  `/home/node/.openclaw/workspace/tools/scheduler/crontab`, restarting it
  whenever that file changes (polled every 30s) or it exits
- `run-job.sh` — wrapper invoked from crontab lines as
  `run-job.sh <job-name> <command...>`: runs the given command as-is (cwd is
  the workspace), logs to `outputs/logs/scheduler/<job-name>.log`, and uses
  `flock` to avoid overlapping runs

The actual `crontab` is **not** in this directory — it lives in the
instance's `data/workspace/tools/scheduler/` (agent-writable, see the README
there), since `data/` is per-instance runtime state and that's also where the
existing job scripts (`tools/pan123/...`, `tools/device_dot/...`) already
live.

## Rebuilding

```
docker compose build openclaw-${INSTANCE_NAME}-scheduler
docker compose up -d openclaw-${INSTANCE_NAME}-scheduler
```
