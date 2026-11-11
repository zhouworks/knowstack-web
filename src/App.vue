<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()
const mainContent = ref<HTMLElement | null>(null)
const navigation = [
  { label: '首页', to: '/' },
  { label: '文章', to: '/blog' },
  { label: '项目', to: '/projects' },
  { label: '关于', to: '/about' },
]

watch(
  () => route.fullPath,
  async () => {
    // 单页路由切换后把焦点交给正文，避免键盘用户继续停留在旧页面入口。
    await nextTick()
    mainContent.value?.focus({ preventScroll: true })
  },
)
</script>

<template>
  <a class="skip-link" href="#main-content">跳到主要内容</a>
  <div class="site-shell">
    <header class="site-header">
      <RouterLink to="/" class="wordmark" aria-label="知栈 KnowStack 首页">
        知栈 <span lang="en">KnowStack</span>
      </RouterLink>
      <nav class="site-nav" aria-label="主导航">
        <RouterLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          exact-active-class="is-current"
          :class="{ 'is-current': item.to === '/blog' && route.path.startsWith('/blog/') }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </header>

    <main id="main-content" ref="mainContent" tabindex="-1">
      <RouterView />
    </main>

    <footer class="site-footer">
      <RouterLink to="/" class="footer-wordmark">知栈 KnowStack</RouterLink>
      <p>持续学习，持续构建。</p>
    </footer>
  </div>
</template>
