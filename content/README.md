# 内容维护

## 站点与个人资料

`site.json` 集中维护公开文字：`name`、`englishName`、`description`、`tagline`，首页的 `home.titleLines` / `summaryLines`，以及关于页的 `about.title` / `intro` / `sections`。段落使用字符串数组；栏目使用具有唯一 `id` 的 `{ id, title, text }` 对象。

`about.profile` 可选，包含 `name`、段落数组 `bio`，以及可选 `interests`、`links`。移除整个 `profile` 即隐藏个人资料区；不提供联系方式时使用空 `links` 数组。当前资料是站长明确授权公开的昵称、介绍和邮箱。

链接结构为 `{ "label": "显示文字", "href": "完整地址" }`。个人资料支持 HTTP/HTTPS 或 `mailto:单个邮箱`，不支持邮件主题/抄送等参数。未知字段、空文本或不合法链接会在构建时被拒绝。

首页标题应保持短行。标题使用本地字形子集，修改文字需同步字体子集或使用系统字体，并重新检查手机布局。

## 项目展示

`projects.json` 是按显示顺序排列的数组；填 `[]` 会展示项目空状态。当前首个项目为开发中的知栈。

| 字段               | 规则                                                     |
| ------------------ | -------------------------------------------------------- |
| `id`               | 必填且唯一，只使用小写字母、数字、连字符分段             |
| `name` / `summary` | 必填，项目名和真实简介                                   |
| `status`           | `building` 开发中、`live` 已上线、`archived` 已归档      |
| `tags`             | 可选，技术标签数组，自动去重                             |
| `highlights`       | 可选，项目特点数组                                       |
| `links`            | 可选，`{ label, href }` 数组，仅支持完整 HTTP/HTTPS 地址 |

没有可公开的源码或演示链接时，省略 `links` 或填 `[]`；页面不会出现空按钮。地址不得带账户密码，不使用 `#` 或虚构地址占位。链接合法性校验不代表目标网站在线。

**这两份 JSON 是公开配置，会进入浏览器产物。不要存放草稿、私密资料或密钥，也不要依靠页面隐藏来保密。** 修改后重启 `npm run dev`，执行 `npm run content:check` 和 `npm run build`，再检查预览。

## 文章

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

`posts/building-knowstack/index.md` 是根据当前实现起草的建站记录，保持 `draft`，不会进入公开列表或正文产物。发布前请审阅文字、移除草稿提示、填写实际发布日期，再将状态改为 `published`。
