import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: '知栈 KnowStack' } },
    {
      path: '/blog',
      name: 'blog',
      component: () => import('@/views/CollectionView.vue'),
      props: { kind: 'blog' },
      meta: { title: '文章 · 知栈 KnowStack' },
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/views/CollectionView.vue'),
      props: { kind: 'projects' },
      meta: { title: '项目 · 知栈 KnowStack' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: { title: '关于 · 知栈 KnowStack' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: '页面不存在 · 知栈 KnowStack' },
    },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (to.hash === '#main-content') return { el: '#main-content' }
    return savedPosition ?? { top: 0 }
  },
})

router.afterEach((to) => {
  document.title = typeof to.meta.title === 'string' ? to.meta.title : '知栈 KnowStack'
})

export default router
