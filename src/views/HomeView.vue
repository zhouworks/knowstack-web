<script setup lang="ts">
import { PhArrowRight } from '@phosphor-icons/vue'
import { RouterLink } from 'vue-router'
import bookSculpture from '@/assets/book-sculpture.webp'
import bookSculptureSmall from '@/assets/book-sculpture-small.webp'
</script>

<template>
  <section class="home" aria-labelledby="home-title">
    <div class="home-intro">
      <h1 id="home-title" class="home-title">
        <span>把思考，</span>
        <span>写成新的可能。</span>
      </h1>
      <div class="home-summary">
        <p>
          这里是知栈，记录学习与开发中的思考，<br class="desktop-break" />分享技术文章与项目实践。
        </p>
        <div class="home-actions">
          <RouterLink to="/blog" class="button button-primary">
            阅读文章 <PhArrowRight :size="24" :weight="'regular'" aria-hidden="true" />
          </RouterLink>
          <RouterLink to="/projects" class="text-link">
            浏览项目 <PhArrowRight :size="24" :weight="'regular'" aria-hidden="true" />
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- 书页只承担视觉装饰，功能入口全部使用真实链接，不依赖图片内的文字。 -->
    <div class="home-art" aria-hidden="true">
      <img
        :src="bookSculpture"
        :srcset="`${bookSculptureSmall} 768w, ${bookSculpture} 1942w`"
        sizes="(max-width: 600px) calc(100vw - 32px), (max-width: 1480px) 90vw, 1320px"
        width="1942"
        height="809"
        alt=""
        fetchpriority="high"
        decoding="async"
      />
    </div>
  </section>
</template>
