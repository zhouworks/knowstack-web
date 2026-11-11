# 文章维护

每篇文章使用一个独立目录：`posts/<slug>/index.md`，图片放在同一文章目录或其子目录中。

```markdown
---
slug: my-first-note
title: 我的第一篇笔记
summary: 用一两句话介绍文章讨论的问题。
publishedAt: 2026-11-10
status: published
category: 学习笔记
tags: [Java, 学习]
---

## 问题背景

从这里开始写正文。

![配图说明](./images/example.webp)
```

- `slug` 必须与目录名相同，只允许小写字母、数字和单个连字符分段。
- 不填 `status` 时默认为 `draft`；只有 `published` 会发布。
- 发布时必须有非空 `title`、`summary`、正文和有效 `publishedAt`。`updatedAt` 可选，不得早于发布日期。日期按上海时区判断，不得在未来。
- `category` 和 `tags` 可选，标签为字符串数组，重复项自动去重。未知字段、重复 YAML 键和错误类型会报错。
- 支持 Markdown 标题、段落、强调、列表、引用、链接、代码块、表格和图片。原始 HTML 按文本显示，不执行脚本。
- 标题锚点按标题生成，例如 `## 实践清单` 可用 `[跳转](#实践清单)`；重名依次追加 `-2`、`-3`，可链接 `/blog/my-first-note#实践清单`。
- 站内链接必须指向现有路由、已发布文章和存在的锚点；外链仅允许 HTTP、HTTPS、mailto。首版不检查外部网站的在线状态。
- 图片只允许文章目录内的 PNG、JPEG、WebP、GIF，单张不超过 5 MiB。暂不支持远程图片或 SVG，禁止跨目录和符号链接越界。

发布步骤：补全内容 → `npm run content:check` → `npm test` → `npm run build` → `npm run preview` 检查文章。日期仅为格式示例，请填写实际日期。

开发时修改内容后重启 `npm run dev`。撤下文章时将其改为 `draft` 并重新构建；下一次生成会清理旧正文与不再引用的生成图片。部署时同步替换整套 `dist/`，避免服务器保留旧资源。

构建程序只清理 `src/generated/` 和 `public/media/generated/`，不会清理源文章。`PostDetail.imageMap` 将相对图片引用映射到带内容哈希的公开 URL，Markdown 中的代码示例不会被字符串替换改写。
