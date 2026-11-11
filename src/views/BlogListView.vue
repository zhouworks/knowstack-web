<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { PhArrowRight, PhBookOpen } from '@phosphor-icons/vue'
import { contentRepository } from '@/content'
import type { PostSummary } from '@/content/models'
import '@/articles.css'

const posts = ref<PostSummary[]>([])
const loading = ref(true)
const failed = ref(false)

async function loadPosts() {
  loading.value = true
  failed.value = false
  try {
    posts.value = await contentRepository.listPosts()
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}
onMounted(loadPosts)
</script>

<template>
  <section class="content-page blog-page" aria-labelledby="blog-title">
    <header class="page-heading blog-heading">
      <div>
        <p class="section-kicker" lang="en">NOTES & IDEAS</p>
        <h1 id="blog-title">文章</h1>
        <p>记录学习与开发中的思考，让每一次实践都有迹可循。</p>
      </div>
      <span v-if="!loading && !failed && posts.length" class="article-count"
        >{{ posts.length }} 篇记录</span
      >
    </header>
    <div v-if="loading" class="reading-state" role="status">正在加载文章…</div>
    <div v-else-if="failed" class="reading-state" role="alert">
      <h2>文章暂时无法加载</h2>
      <p>请稍后再试。</p>
      <button class="button button-primary" type="button" @click="loadPosts">重新加载</button>
    </div>
    <div v-else-if="!posts.length" class="empty-state">
      <PhBookOpen :size="40" weight="light" aria-hidden="true" />
      <h2>文章还在酝酿中</h2>
      <p>这里将收录技术文章与学习笔记。期待与你分享新的思考。</p>
      <RouterLink to="/" class="text-link"
        >返回首页 <PhArrowRight :size="18" aria-hidden="true"
      /></RouterLink>
    </div>
    <ul v-else class="article-list" aria-label="文章列表">
      <li v-for="post in posts" :key="post.slug">
        <article class="article-row">
          <div class="article-date">
            <time :datetime="post.publishedAt">{{ post.publishedAt.replaceAll('-', '.') }}</time>
          </div>
          <div class="article-info">
            <p v-if="post.category" class="article-category">{{ post.category }}</p>
            <h2>
              <RouterLink :to="`/blog/${post.slug}`"
                >{{ post.title }}<PhArrowRight :size="23" aria-hidden="true"
              /></RouterLink>
            </h2>
            <p class="article-summary">{{ post.summary }}</p>
            <ul v-if="post.tags.length" class="article-tags" aria-label="文章标签">
              <li v-for="tag in post.tags" :key="tag">{{ tag }}</li>
            </ul>
          </div>
        </article>
      </li>
    </ul>
  </section>
</template>
