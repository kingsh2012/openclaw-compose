# WORKSPACE_DESIGN.md —— workspace 迁移 / 整理操作指南

本文档是**情境化操作手册**：只在你需要「把一个已有 workspace 整理成标准布局」或
「做大范围文件迁移」时才用。

日常要遵守的目录规范（各目录归属、`.secrets` 约束、配置安全流程）已内联在 `AGENTS.md`
的「工作区规范」一节，每轮生效——这里不重复那些**规则**，只讲**怎么动手迁**。

## 一、初始化标准目录

新 workspace，或发现缺目录时，先把骨架建好：

```bash
mkdir -p tools skills memory outputs/{csv,json,text,excel,reports,images} \
         backups cache/{pycache,site,tmp} deps/{node,python,bin} .secrets
chmod 700 .secrets
```

## 二、把老 workspace 迁移到新布局

对一个还没分类、文件堆在根目录的旧 workspace，按顺序整理：

1. 先建标准目录（见上）。
2. 逐个判断根目录里的文件属于哪类，移动到对应目录：
   脚本 → `tools/`，结果 → `outputs/`，备份 → `backups/`，缓存 → `cache/`，
   依赖 → `deps/`，凭据 → `.secrets/`。
3. **敏感文件优先处理**：含密码 / token / AK-SK / DSN 的一律迁进 `.secrets/`；
   把散落在 `tools/`、`skills/`、`memory/` 里的明文凭据抽出来，原处只留
   “见 `.secrets/<x>.json`”。
4. 每移动一批就立刻更新引用（见第三节），不要攒到最后一次性改。
5. 迁完确认根目录只剩允许的入口文件和顶层目录，无遗留临时文件。

## 三、移动文件的标准步骤（移动 = 移动 + 更新引用 + 验证）

1. 判断文件类型，移动到正确目录。
2. 更新所有引用它的脚本、skill、README、配置。
3. `grep` 检查旧路径是否还有残留。
4. 跑最小验证：
   - Python：`python -m py_compile`
   - Shell：`bash -n`
   - Node：`node --check`
   - CLI：`--help`
   - 或最小 dry-run / import test
5. 确认根目录没有遗留临时文件。

**不要为了方便保留兼容 wrapper。** 只有下列情况才保留旧路径入口：

- 外部系统正在调用旧路径；
- cron / systemd / CI / 第三方工具依赖旧路径；
- 用户明确要求保留；
- 短期迁移窗口必须兼容。

否则应把引用更新到真实分类路径，并删除旧入口。
