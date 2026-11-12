import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { nextTick } from 'vue'
import { contentRepository } from '@/content'
import { pageTitle, setPageMeta } from '@/lib/pageMeta'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: pageTitle() } },
    {
      path: '/blog',
      name: 'blog',
      component: () => import('@/views/BlogListView.vue'),
      meta: {
        title: pageTitle('文章'),
        description: '记录学习与开发中的思考，让每一次实践都有迹可循。',
      },
    },
    {
      path: '/blog/:slug',
      name: 'blog-detail',
      component: () => import('@/views/BlogDetailView.vue'),
      meta: { title: pageTitle('文章') },
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/views/ProjectsView.vue'),
      meta: {
        title: pageTitle('项目'),
        description: '个人项目与开发实践，把想法变成作品，在构建中探索更多可能。',
      },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: { title: pageTitle('关于') },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: pageTitle('页面不存在') },
    },
  ],
  async scrollBehavior(to, _from, savedPosition) {
    // 正文采用动态加载；先等待页面具备实际高度，再恢复历史位置或定位锚点。
    if (to.name === 'blog-detail')
      await contentRepository.getPost(String(to.params.slug)).catch(() => null)
    await nextTick()
    if (savedPosition) return savedPosition
    if (to.hash) {
      try {
        const element = document.getElementById(decodeURIComponent(to.hash.slice(1)))
        if (element) return { el: element, top: 24 }
      } catch {
        /* 非法编码锚点退回页首，不中断导航。 */
      }
    }
    return { top: 0 }
  },
})

router.afterEach((to, from) => {
  // 同一文章切换锚点时保留详情页已设置的标题和摘要。
  if (to.name === 'blog-detail' && from.name === to.name && to.params.slug === from.params.slug)
    return
  setPageMeta(
    typeof to.meta.title === 'string' ? to.meta.title : pageTitle(),
    typeof to.meta.description === 'string' ? to.meta.description : undefined,
  )
})

export default router
