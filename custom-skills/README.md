# 自定义 Skills

放这里的 skill 会被 `init.sh`（首次初始化）和 `update.sh`（同步更新）自动复制到每个实例的
`data/workspace/skills/<skill-name>/`，所有用这套模板部署的 OpenClaw 实例都能复用。

## 目录结构

每个 skill 一个子目录，名字即 skill 名：

```
custom-skills/
└── <skill-name>/
    ├── SKILL.md          # skill 说明（必须）
    ├── skill-card.md      # 可选，简短卡片描述
    └── scripts/           # 可选，脚本/资源
```

参考已有的 `openai-image-gen` skill 结构（装在某个实例的
`data/workspace/skills/openai-image-gen/` 下）即可。

## 同步规则

- `init.sh` / `update.sh` 会用本目录**整体覆盖**对应实例的 `data/workspace/skills/<skill-name>/`
  （先删旧的再复制新的），所以不要在实例里直接改 `data/workspace/skills/` 下由这里同步过来的
  skill 内容，改了也会被下次同步覆盖。
- 改 skill 内容 → 改这里的源文件 → 对各实例跑 `bash update.sh`。
- 这里的内容会进 git，**不要把 API Key / token 等敏感信息写进 skill 文件**，需要凭据的话让
  skill 走环境变量或读 `data/openclaw.json`（参考 README 顶层「Skills / 图片生成」一节里
  `openai-image-gen` 的环境变量用法）。
