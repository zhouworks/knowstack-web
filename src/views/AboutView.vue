<script setup lang="ts">
import { PhArrowRight } from '@phosphor-icons/vue'
import { RouterLink } from 'vue-router'
</script>

<template>
  <article class="content-page about-page">
    <div class="page-heading">
      <h1>关于知栈</h1>
      <p>持续学习，持续构建。</p>
    </div>
    <div class="about-copy">
      <p>
        知栈是一个持续生长的个人技术网站。在这里，记录学习与开发中的思考，整理实践文章，也展示逐步完善的个人项目。
      </p>
      <p>希望每一次阅读、思考与尝试，都能成为下一次构建的基石。</p>
      <RouterLink to="/blog" class="text-link">
        前往文章 <PhArrowRight :size="22" aria-hidden="true" />
      </RouterLink>
    </div>
  </article>
</template>
