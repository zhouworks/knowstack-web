<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { PhArrowLeft } from '@phosphor-icons/vue'
import { contentRepository } from '@/content'
import type { PostDetail } from '@/content/models'
import { renderMarkdown } from '@/lib/markdown'
import { pageTitle, setPageMeta } from '@/lib/pageMeta'
import '@/articles.css'

const route = useRoute()
const post = ref<PostDetail | null>(null)
const bodyHtml = ref('')
const loading = ref(true)
const failed = ref(false)
const retry = ref(0)

watch(
  [() => route.params.slug, retry],
  async ([slug], _previous, onCleanup) => {
    let active = true
    onCleanup(() => {
      active = false
    })
    loading.value = true
    failed.value = false
    post.value = null
    bodyHtml.value = ''
    try {
      const result = await contentRepository.getPost(String(slug))
      if (!active) return
      const html = result ? renderMarkdown(result.bodyMarkdown, result.imageMap) : ''
      post.value = result
      bodyHtml.value = html
      setPageMeta(pageTitle(result ? result.title : '文章不存在'), result?.summary)
    } catch {
      if (!active) return
      failed.value = true
      setPageMeta(pageTitle('文章加载失败'))
    } finally {
      if (active) loading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <section class="content-page article-page" aria-label="文章详情">
    <RouterLink to="/blog" class="back-link"
      ><PhArrowLeft :size="18" aria-hidden="true" />所有文章</RouterLink
    >
    <div v-if="loading" class="reading-state" role="status">正在加载正文…</div>
    <div v-else-if="failed" class="reading-state" role="alert">
      <h1>正文暂时无法加载</h1>
      <p>请稍后重试，或返回文章列表继续浏览。</p>
      <button type="button" class="button button-primary" @click="retry++">重新加载</button>
    </div>
    <div v-else-if="!post" class="reading-state">
      <p class="section-kicker">404</p>
      <h1>这篇文章还不在这里</h1>
      <p>文章可能尚未发布、已经移除，或链接有误。</p>
      <RouterLink to="/blog" class="text-link"
        >返回文章列表 <PhArrowLeft :size="18" aria-hidden="true"
      /></RouterLink>
    </div>
    <article v-else>
      <header class="article-header">
        <p v-if="post.category" class="article-category">{{ post.category }}</p>
        <h1>{{ post.title }}</h1>
        <p class="article-lead">{{ post.summary }}</p>
        <div class="article-meta">
          <span
            >发布于
            <time :datetime="post.publishedAt">{{
              post.publishedAt.replaceAll('-', '.')
            }}</time></span
          >
          <span v-if="post.updatedAt && post.updatedAt !== post.publishedAt"
            >更新于
            <time :datetime="post.updatedAt">{{ post.updatedAt.replaceAll('-', '.') }}</time></span
          >
        </div>
        <ul v-if="post.tags.length" class="article-tags" aria-label="文章标签">
          <li v-for="tag in post.tags" :key="tag">{{ tag }}</li>
        </ul>
      </header>
      <!-- 只接收受控渲染器输出；Markdown 原始 HTML 关闭，链接和图片在构建时及渲染时校验。 -->
      <div class="article-body" v-html="bodyHtml"></div>
      <footer class="article-end">
        <span>感谢阅读。</span
        ><RouterLink to="/blog" class="back-link"
          ><PhArrowLeft :size="18" aria-hidden="true" />返回文章列表</RouterLink
        >
      </footer>
    </article>
  </section>
</template>
