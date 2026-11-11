<script setup lang="ts">
import { computed } from 'vue'
import { PhArrowLeft, PhBookOpen, PhStack } from '@phosphor-icons/vue'
import { RouterLink } from 'vue-router'

const props = defineProps<{ kind: 'blog' | 'projects' }>()

const content = computed(() =>
  props.kind === 'blog'
    ? {
        title: '文章',
        description: '记录学习与开发中的思考，让每一次实践都有迹可循。',
        emptyTitle: '文章还在酝酿中',
        emptyDescription: '这里将收录技术文章与学习笔记。期待与你分享新的思考。',
        icon: PhBookOpen,
      }
    : {
        title: '项目',
        description: '把想法变成作品，在构建中探索更多可能。',
        emptyTitle: '作品正在积累',
        emptyDescription: '这里将展示个人项目与开发实践，完成整理后便会与你见面。',
        icon: PhStack,
      },
)
</script>

<template>
  <section class="content-page" :aria-label="content.title">
    <div class="page-heading">
      <h1>{{ content.title }}</h1>
      <p>{{ content.description }}</p>
    </div>
    <div class="empty-state">
      <component :is="content.icon" :size="40" weight="light" aria-hidden="true" />
      <h2>{{ content.emptyTitle }}</h2>
      <p>{{ content.emptyDescription }}</p>
      <RouterLink to="/" class="text-link">
        <PhArrowLeft :size="20" aria-hidden="true" /> 返回首页
      </RouterLink>
    </div>
  </section>
</template>
