请按下面这套规则整理和维护你的 workspace。

核心原则：workspace 根目录保持干净，只放 OpenClaw/persona/config 入口文件和少量顶层目录。所有脚本、结果、缓存、依赖、备份、敏感配置都必须分类存放。

一、根目录只保留这些入口文件/目录

根目录允许的文件：
- AGENTS.md
- SOUL.md
- USER.md
- TOOLS.md
- IDENTITY.md
- HEARTBEAT.md
- MEMORY.md

根目录允许的目录：
- tools/
- skills/
- memory/
- outputs/
- backups/
- cache/
- deps/
- .secrets/

不要把临时脚本、测试输出、下载文件、依赖目录、缓存文件随手堆在根目录。

二、目录用途

1. tools/：业务脚本和 helper 工具

所有业务脚本、自动化脚本、helper 工具放这里。

推荐结构：
tools/<domain>/<service-or-task>/

示例：
tools/aliyun/eip/
tools/aliyun/billing/
tools/cmdb/
tools/qiniu/
tools/pan123/offline_logs/
tools/device_dot/status_sync/

规则：
- 脚本代码放 tools/。
- 非敏感配置模板放 config.example.json。
- 真实配置、密码、token、AK/SK 不放 tools/，只放 .secrets/。
- README 可以写用法，但不能写真实凭据。

2. skills/：可复用流程和业务沉淀

可复用 SOP、业务流程、长期 skill 放这里。

推荐结构：
skills/<skill-name>/SKILL.md

自定义 skill 必须加前缀，避免和 OpenClaw 内置 skill 混淆，前缀按归属分两类：
- 公司业务相关 → `linkfog-` 前缀。例如：
  skills/linkfog-cmdb-compose-release/
  skills/linkfog-offboarding-access-disable/
- 个人通用、跟公司业务无关 → `kingsh2012-` 前缀。例如：
  skills/kingsh2012-qiniu-cdn-upload/
  skills/kingsh2012-feishu-file-send/

规则：
- skill 只写流程、约束、环境说明、非敏感路径。
- 不写密码、AK/SK、token、完整 DSN、内部安全策略明文。
- 如果 skill 需要凭据，只写“凭据位于 .secrets/<project>.json 的某个 section”，不要展开内容。
- 新建 skill 前先判断归属，选对前缀；不确定时倾向 `kingsh2012-`（个人通用），不要不带前缀。

3. outputs/：生成结果

所有生成结果放这里，按类型分目录。

推荐结构：
outputs/csv/
outputs/json/
outputs/text/
outputs/excel/
outputs/images/
outputs/reports/

规则：
- 导出文件、报表、分析结果放 outputs/。
- 不要把含敏感凭据的原始响应直接丢进去。
- 如果输出可能包含敏感信息，需要先脱敏。

4. backups/：备份快照

修改线上配置、脚本、任务、调度、重要数据前，如果可行，先备份到这里。

推荐结构：
backups/<domain>/

示例：
backups/gocron/
backups/cmdb/
backups/nginx/
backups/systemd/

规则：
- 备份文件名带时间戳。
- 备份内容如果含敏感信息，不要在聊天、README、memory 中展开。
- 修改配置前优先“读取现状 → 备份 → 合并修改”，不要直接覆盖。

5. cache/：运行缓存和构建缓存

所有运行缓存放这里。

推荐结构：
cache/pycache/
cache/site/
cache/tmp/

Python 建议使用：
PYTHONPYCACHEPREFIX=/home/node/.openclaw/workspace/cache/pycache

规则：
- Python __pycache__ 不要散落在业务目录。
- 构建产物、临时网页资源、下载缓存放 cache/。
- 缓存可以重建，不要把重要结果只放这里。

6. deps/：依赖

项目级依赖放这里，避免污染根目录。

推荐结构：
deps/node/
deps/python/
deps/bin/

规则：
- Node 依赖优先放 deps/node/。
- 不要在 workspace 根目录留下 node_modules/。
- 如果某个工具必须使用特定依赖路径，可以在工具 README 里说明。

7. .secrets/：敏感配置和凭据

所有敏感信息只放 .secrets/。

敏感信息包括但不限于：
- 密码
- API Key / Secret
- AK/SK
- token
- webhook URL
- SSH key
- 数据库 DSN
- 内部主机和生产配置
- 防火墙 / 安全组规则
- 签名密钥
- 第三方平台凭据

推荐结构：
.secrets/<project-or-service>.json

如果凭据是某个 skill 专用的，文件名直接用 skill 名（一个 skill 对应一个凭据文件），方便对应：
.secrets/<skill-name>.json

示例：
.secrets/cmdb.json
.secrets/grafana.json
.secrets/pan123_api_scheduler.json
.secrets/ops_hosts.json
.secrets/kingsh2012-qiniu-cdn-upload.json

规则：
- 默认用 JSON。
- 推荐一个项目/服务一个 JSON 文件，里面按 section 分组。
- 不要拆成很多单值 txt 文件。
- 不把真实凭据写进 tools/、skills/、outputs/、memory/、README 或聊天。
- 目录权限 700，文件权限 600。
- skill/工具依赖的凭据文件缺失或字段不全时，**不要直接报错崩溃**：明确列出缺哪些字段，告知
  用户通过聊天提供，你（agent）拿到值后自己创建/补全该文件，再重试。不要把凭据内容回显到
  聊天里确认，只确认字段是否齐全。
- 非敏感模板放 config.example.json，真实配置放 .secrets/。
- .secrets 目录权限建议 700，里面的 JSON 文件权限建议 600。

8. memory/：日常记录

长期会话记录、每日工作日志、经验沉淀放这里。

示例：
memory/2026-06-23.md
memory/heartbeat-state.json

规则：
- 记录事实、决策、任务进度、踩坑经验。
- 不记录密码、AK/SK、token、完整 DSN。
- 涉及敏感信息时只写路径或脱敏摘要。

三、文件移动和整理规则

移动文件时，不只是移动，还要同步更新引用。

标准步骤：
1. 判断文件类型，移动到正确目录。
2. 更新引用它的脚本、skill、README、配置。
3. grep 检查旧路径是否还存在。
4. 跑一个小验证：
   - Python：python -m py_compile
   - Shell：bash -n
   - Node：node --check
   - CLI：--help
   - 或最小 dry-run / import test
5. 确认根目录没有遗留临时文件。

不要为了方便保留兼容 wrapper。

只有以下情况才保留旧路径兼容入口：
- 外部系统正在调用旧路径；
- cron/systemd/CI/第三方工具依赖旧路径；
- 用户明确要求保留；
- 短期迁移窗口必须兼容。

否则应更新引用到真实分类路径，并删除旧入口。

四、配置和安全操作规则

修改以下内容前，必须先读取现状并尽量备份：
- crontab
- systemd unit
- nginx 配置
- shell rc 文件
- 数据库配置
- 防火墙 / 安全组规则
- 线上服务配置
- 调度器任务
- 生产脚本

默认策略：
1. 先 inspect 当前状态；
2. 备份到 backups/<domain>/；
3. 合并修改，不整文件盲目覆盖；
4. 做最小验证；
5. 报告修改内容和验证结果。

不要把敏感配置全文贴回聊天里，只总结变化。

五、初始化目录命令

新 workspace 可以先执行：

mkdir -p tools skills memory outputs/{csv,json,text,excel,reports,images} backups cache/{pycache,site,tmp} deps/{node,python,bin} .secrets
chmod 700 .secrets

六、总原则

- 根目录保持干净。
- 脚本进 tools/。
- 流程进 skills/。
- 结果进 outputs/。
- 备份进 backups/。
- 缓存进 cache/。
- 依赖进 deps/。
- 敏感信息只进 .secrets/。
- 移动文件要更新引用并验证。
- 修改配置要先 inspect、再备份、再合并。
- 不在聊天、普通文档、memory、skill 里暴露真实凭据。
