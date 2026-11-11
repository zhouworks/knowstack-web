<script setup lang="ts">
import { PhArrowLeft } from '@phosphor-icons/vue'
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="content-page not-found">
    <p class="eyebrow">404</p>
    <h1>这一页，暂未写下。</h1>
    <p>你访问的页面不存在，或已被移动。回到首页，继续探索吧。</p>
    <RouterLink to="/" class="button button-primary">
      <PhArrowLeft :size="22" aria-hidden="true" /> 返回首页
    </RouterLink>
  </section>
</template>
