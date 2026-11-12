<script setup lang="ts">
import { PhArrowUpRight, PhCheck } from '@phosphor-icons/vue'
import { projectStatusLabels, type ProjectContent } from '../content/siteSchema'

defineProps<{ project: ProjectContent; index: number }>()
</script>

<template>
  <article class="project-card" :aria-labelledby="`project-${project.id}`">
    <div class="project-index" aria-hidden="true">{{ String(index).padStart(2, '0') }}</div>
    <div class="project-card-main">
      <header class="project-card-heading">
        <h2 :id="`project-${project.id}`">{{ project.name }}</h2>
        <span class="project-status" :class="`project-status-${project.status}`"
          ><span aria-hidden="true"></span>{{ projectStatusLabels[project.status] }}</span
        >
      </header>
      <p class="project-description">{{ project.summary }}</p>
      <ul v-if="project.tags.length" class="content-tags" aria-label="技术标签">
        <li v-for="tag in project.tags" :key="tag">{{ tag }}</li>
      </ul>
      <ul v-if="project.highlights.length" class="project-highlights" aria-label="项目特点">
        <li v-for="(highlight, itemIndex) in project.highlights" :key="itemIndex">
          <PhCheck :size="17" aria-hidden="true" />{{ highlight }}
        </li>
      </ul>
      <!-- 没有提供地址时不显示操作区，避免占位链接误导访客。 -->
      <div v-if="project.links.length" class="project-links">
        <a
          v-for="link in project.links"
          :key="link.href"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`${link.label}（新窗口打开）`"
          >{{ link.label }}<PhArrowUpRight :size="18" aria-hidden="true"
        /></a>
      </div>
    </div>
  </article>
</template>
