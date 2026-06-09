#!/bin/bash
# 在 wrapped-chromium 启动 Chrome 前注入 Windows UA
# CHROME_CLI 传参会被 shell 按空格切分，含空格的 UA 无法通过该方式传递
# 因此直接修改 wrapper 脚本，将 --user-agent 以正确引号方式注入

UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'

if ! grep -q 'user-agent' /usr/bin/wrapped-chromium; then
  sed -i "s|   \"\$@\" > /dev/null|   --user-agent=\"${UA}\" \"\$@\" > /dev/null|g" /usr/bin/wrapped-chromium
fi
