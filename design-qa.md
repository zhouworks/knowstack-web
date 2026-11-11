# 首页设计与交互验证

日期：2026-11-11。

## 对照依据

- Source visual truth：`docs/design/home-reference.png`（1487 × 1058 像素）。
- Implementation：`docs/design/home-desktop.jpg`（1487 × 1058 像素）。
- CSS viewport：1487 × 1058，设备像素比约 1；相同视口、首页、浅色、初始状态，未做密度缩放。
- 完整并排对照：`docs/design/comparison-final.jpg`。
- 标题与按钮局部对照：`docs/design/comparison-detail.jpg`，区域 x=60..1420、y=135..395。
- 手机截图：`docs/design/home-mobile.jpg`，375 × 812 CSS px。
- 生产预览：`http://127.0.0.1:4173/`，使用 Vite preview。

## 迭代记录

1. 第一轮：`comparison-before.jpg` / `home-desktop-before.jpg`。主视觉偏低、页脚溢出首屏，标题与按钮偏小（P2）。调整主视觉间距、标题字号/行高、按钮尺寸及简介换行。
2. 第二轮：`home-layering-before.jpg`。上移的装饰图片覆盖标题底部（P2）。为正文建立更高层叠级别，同时禁止装饰图片拦截指针。
3. 修复后：`home-desktop.jpg` / `comparison-final.jpg` / `comparison-detail.jpg`。标题完整、功能入口清楚、主视觉无硬边、页脚完整可见，文档宽高均为 1487 × 1058。

## 五项视觉检查

- 字体：本地 Noto Serif SC 标题已加载；界面使用系统无衬线字体。文字为可选择的真实 DOM。
- 间距：保留上方左标题/右简介与操作、下方通栏书页、底部细分隔页脚的结构。
- 配色：暖灰白底、炭灰文字、灰绿色按钮；未采用高饱和光效或强烈黑白反差。
- 图片：独立 WebP 主视觉，1942 × 809 / 768 × 320 双尺寸，无文字、无功能控件，保留完整书页轮廓。
- 文案：首页标题、站点介绍、导航、两个操作与页脚与确认稿一致。

## 交互与响应式结果

- 320px、375px、768px、1487px 宽度均未出现整页横向溢出。
- 375px 手机四个导航入口持续可见；导航触控区域至少 44 × 46px，两个主要操作高度至少 48px。
- 首页「阅读文章」「浏览项目」、文章/项目/关于导航均可进入正确页面。
- 文章与项目明确显示空状态，不展示虚构内容；关于只介绍本站定位。
- 项目页刷新仍可访问；浏览器后退回到首页。
- `/missing-page` 显示 404 文案，返回首页可用。
- 键盘焦点可见；跳到主要内容链接可聚焦并进入 main；普通路由切换后焦点也进入 main。
- 768px 下检查按钮底部命中，装饰图片不拦截点击。
- 生产预览浏览器 console 的 error/warn 列表为空。

## 非阻塞差异与验证边界

- P3：生成书页资产的细节与参考图有小幅差异；背景采用更均匀的暖灰白，未复制设计图全屏纹理。
- P3：系统字体和真实字体字形与生成稿略有差异；导航/页脚字体比例保持清晰。
- 手机使用响应式重排，原设计未提供手机稿；未使用实体手机或 Safari 验证。
- 尚未提供文章、项目与 Markdown 读取系统；本次验证不代表首版内容系统或后端已完成。
- 正式部署必须配置 history fallback；本地刷新通过不代表生产托管配置已验证。

## 相关实现文件

- `src/App.vue`：公共导航、页脚和路由后焦点管理。
- `src/views/HomeView.vue`：首页与主要操作。
- `src/views/CollectionView.vue`：文章和项目空状态。
- `src/views/AboutView.vue`、`src/views/NotFoundView.vue`：关于和未知路径。
- `src/styles.css`：配色、排版、断点、键盘焦点、减少动态效果。
- `src/router/index.ts`、`src/main.ts`、`index.html`：路由、样式接入、中文语言与页面元信息。
- `src/assets/`：书页图、标题字体及许可证。
- `package.json`、`package-lock.json`：增加 Phosphor Vue 图标库。
- `README.md`、`docs/design/`、`docs/superpowers/plans/`：运行说明、设计依据、计划和验证证据。

final result: passed
