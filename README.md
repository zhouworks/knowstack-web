# 知栈 KnowStack 前端

Vue 3 + TypeScript + Vite 单页应用。当前实现已确认的暖灰白书页首页、公共导航与页脚，以及文章/项目空状态、关于页和不存在页面。

## 本地运行

需要 Node.js `^22.18.0 || >=24.12.0`。

```sh
npm ci
npm run dev
```

## 验证与构建

```sh
npm run build
npm exec eslint .
npm exec oxlint .
npm exec prettier -- --check src index.html
npm run preview
```

`build` 同时执行 TypeScript 检查并生成 `dist/`。目前没有单元测试框架；页面交互与响应式验证见 `design-qa.md`。

## 页面与内容

- `/`：站点介绍和文章、项目入口。
- `/blog`、`/projects`：真实内容尚未提供，当前展示空状态。
- `/about`：站点定位与建设目的，不包含未经提供的个人信息。
- 其他路径：显示不存在提示及返回首页入口。

本次没有接入 Markdown 内容系统或后端接口。部署使用 history 路由，托管端必须为应用路径回退到 `index.html`，否则直接访问或刷新 `/blog` 等路径可能返回服务器 404。应用内 404 页面不等于服务器 HTTP 404。

## 设计与资产

- 设计说明：`docs/design/home-design.md`；参考图：`docs/design/home-reference.png`。
- 首页：`src/views/HomeView.vue`；公共布局：`src/App.vue`；样式：`src/styles.css`。
- 书页图：`src/assets/book-sculpture.webp` 和窄屏版本 `book-sculpture-small.webp`，使用内置 Image Gen 从选定稿生成，再转换 WebP。
- 资产提示词摘要：保留展开书页、珍珠白纸质、浅绿和香槟阴影、柔和地面投影；去除 UI 与文字，使用宽幅构图和暖白背景。
- 标题使用本地 Noto Serif SC 500 字形子集，仅包含首页标题所需文字；修改标题时需重新生成子集，或使用系统字体。字体许可证位于 `src/assets/fonts/OFL.txt`。
- 箭头和栏目图标来自 `@phosphor-icons/vue`（MIT）。

主视觉是静态图片，按钮提供轻微悬停反馈，并尊重系统的减少动态效果设置。
