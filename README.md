# 知栈 KnowStack 前端

Vue 3 + TypeScript + Vite 单页应用。已实现暖灰白书页首页、公共导航与页脚、Markdown 文章列表与详情、项目展示、作者与站点介绍和不存在页面。

## 本地运行

需要 Node.js `^22.18.0 || >=24.12.0`。

```sh
npm ci
npm run dev
```

## 验证与构建

```sh
npm run build
npm test
npm run content:check
npm exec eslint .
npm exec oxlint .
npm exec prettier -- --check src scripts tests index.html
npm run preview
```

`build` 依次校验站点与项目配置、校验并生成文章、检查 TypeScript、生成 `dist/`、审查产物。测试使用 Vitest，覆盖内容规则、Markdown 安全、内容仓库、公开配置和项目卡片。文章验收记录见 `docs/design/articles-qa.md`，首页验收见 `design-qa.md`，项目与关于页验收见 `docs/design/site-content-qa.md`。

`dev` 启动前自动生成内容。修改 Markdown 或文章图片后请重启开发服务器；首版没有内容文件监听器。`type-check` 也会先生成内容，首次克隆后可以直接运行。

## 页面与内容

- `/`：站点介绍和文章、项目入口。
- `/blog`：按发布日期倒序列出已发布文章，包含标题、摘要、日期及可选分类/标签；没有已发布文章时展示空状态。
- `/blog/:slug`：Markdown 正文，支持代码、表格、本地图片和标题锚点；不存在或草稿文章显示不存在提示，加载失败可重试。
- `/projects`：展示项目简介、状态、技术标签与特点，目前收录开发中的「知栈 KnowStack」；无源码或演示地址时不生成按钮，无项目时展示空状态。
- `/about`：站点定位与建设目的，以及站长确认公开的昵称、介绍和邮箱。
- 其他路径：显示不存在提示及返回首页入口。

当前文章从本地 Markdown 生成，未接入后端接口。`src/content/index.ts` 是仓库装配入口，后续可替换为 HTTP 实现。摘要索引与按需加载的正文分离，草稿在构建阶段过滤，不交给浏览器过滤。

部署使用 history 路由，托管端必须为应用路径回退到 `index.html`，否则直接访问或刷新 `/blog/example` 等路径可能返回服务器 404。应用内 404 页面不等于服务器 HTTP 404。页面标题与描述由客户端更新，当前不提供 SSR 或预渲染。

## 新增文章

查看 `content/README.md`。写作模板位于 `content/posts/writing-template/index.md`，默认草稿，不公开展示。建站记录草稿位于 `content/posts/building-knowstack/index.md`，需站长审阅后自行发布。当前没有正式发布文章；早期文章验收截图中的示例仅用于测试，已从内容源和构建产物移除。

生成目录 `src/generated/` 与 `public/media/generated/` 已加入 `.gitignore`，不要手动维护。源 Markdown 及同目录图片应提交版本管理。

## 维护站点与项目

`content/site.json` 维护站点名称、描述、首页介绍及关于页资料；`content/projects.json` 维护公开项目列表。字段、状态和链接规则见 `content/README.md`。两份配置都会进入浏览器产物，只存放可以公开的信息。修改后重启开发服务器，并运行 `npm run content:check` 和 `npm run build`。

## 设计与资产

- 本站 Logo：`public/brand/knowstack-mark.svg`；设计、导出方式和验收见 `docs/design/brand.md`。导航、页脚与浏览器图标使用已确认的无外框书页标志，SVG/PNG 背景透明，已替换模板 favicon。
- 设计说明：`docs/design/home-design.md`；参考图：`docs/design/home-reference.png`。
- 首页：`src/views/HomeView.vue`；公共布局：`src/App.vue`；样式：`src/styles.css`。
- 书页图：`src/assets/book-sculpture.webp` 和窄屏版本 `book-sculpture-small.webp`，使用内置 Image Gen 从选定稿生成，再转换 WebP。
- 资产提示词摘要：保留展开书页、珍珠白纸质、浅绿和香槟阴影、柔和地面投影；去除 UI 与文字，使用宽幅构图和暖白背景。
- 标题使用本地 Noto Serif SC 500 字形子集，仅包含首页标题所需文字；修改标题时需重新生成子集，或使用系统字体。字体许可证位于 `src/assets/fonts/OFL.txt`。
- 箭头和栏目图标来自 `@phosphor-icons/vue`（MIT）。

主视觉是静态图片，按钮提供轻微悬停反馈，并尊重系统的减少动态效果设置。
