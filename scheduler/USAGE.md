<!-- Seeded once at first container startup (entrypoint.sh) from
     scheduler/USAGE.md in the repo. Safe to edit — won't be overwritten. -->

# Scheduler usage (openclaw-default-scheduler)

This directory's `crontab` file controls the recurring jobs that run in the
separate `openclaw-default-scheduler` container via `supercronic` — they do
**not** consume LLM tokens and run independently of the main agent.

## Format

One job per line, standard 5-field cron syntax:

```
<min> <hour> <day> <month> <weekday>  run-job.sh <job-name> <command...>
```

- `<job-name>`: any unique label you choose (used for log/lock filenames)
- `<command...>`: the real command, run as-is with cwd =
  `/home/node/.openclaw/workspace` (existing scripts under `tools/...` work
  without moving anything)
- `run-job.sh` is baked into the image and on `PATH`

Example — print "hello" every minute:

```
* * * * * run-job.sh hello-example echo hello
```

## Editing

- Just edit `crontab` and save. The container polls its mtime every ~30s and
  restarts `supercronic` automatically — no container restart needed.
- Add a job: append a line.
- Remove a job: delete the line.
- Change frequency: edit the cron fields.

## Env vars already set (no need to repeat per job)

- `PYTHONPATH=/home/node/.openclaw/workspace/deps/python`
- `PYTHONPYCACHEPREFIX=/home/node/.openclaw/workspace/cache/pycache`

If a job needs a different value, prefix the command with `env VAR=value ...`.

## Logs & locking

- Each run logs to `../../outputs/logs/scheduler/<job-name>.log` with
  `start` / `end (exit N)` lines.
- `run-job.sh` uses `flock` per job, so if a run is still active when the
  next trigger fires, that trigger is skipped (no overlap).
