FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    curl -fsSL -o /usr/local/bin/supercronic \
      https://github.com/aptible/supercronic/releases/download/v0.2.33/supercronic-linux-amd64 && \
    chmod +x /usr/local/bin/supercronic && \
    apt-get purge -y curl && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/.openclaw/workspace

COPY entrypoint.sh /entrypoint.sh
COPY run-job.sh /usr/local/bin/run-job.sh
COPY USAGE.md /usage.md
RUN chmod +x /entrypoint.sh /usr/local/bin/run-job.sh

ENTRYPOINT ["/entrypoint.sh"]
