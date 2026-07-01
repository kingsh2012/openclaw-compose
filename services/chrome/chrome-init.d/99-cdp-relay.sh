#!/bin/bash
# 等待 Chromium 的 CDP 端口就绪，然后启动 TCP 中继
# 将 0.0.0.0:9223 转发到 127.0.0.1:9222，供其他容器访问

(
  for i in $(seq 1 30); do
    if nc -z 127.0.0.1 9222 2>/dev/null; then
      break
    fi
    sleep 2
  done

  python3 - <<'PYEOF'
import socket, threading

def relay(src, dst):
    try:
        while True:
            data = src.recv(4096)
            if not data:
                break
            dst.sendall(data)
    except Exception:
        pass
    for s in (src, dst):
        try:
            s.close()
        except Exception:
            pass

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(('0.0.0.0', 9223))
server.listen(10)
while True:
    client, _ = server.accept()
    remote = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    remote.connect(('127.0.0.1', 9222))
    threading.Thread(target=relay, args=(client, remote), daemon=True).start()
    threading.Thread(target=relay, args=(remote, client), daemon=True).start()
PYEOF
) &
