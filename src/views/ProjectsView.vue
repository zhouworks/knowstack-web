<script setup lang="ts">
import { PhArrowLeft, PhStack } from '@phosphor-icons/vue'
import { RouterLink } from 'vue-router'
import ProjectCard from '@/components/ProjectCard.vue'
import { projects } from '@/content/site'
import '@/site-pages.css'
</script>

<template>
  <section class="content-page projects-page" aria-labelledby="projects-title">
    <header class="page-heading">
      <p class="content-kicker" lang="en">SELECTED WORK</p>
      <h1 id="projects-title">项目</h1>
      <p>把想法变成作品，在构建中探索更多可能。</p>
    </header>
    <ul v-if="projects.length" class="projects-list" aria-label="项目列表">
      <li v-for="(project, index) in projects" :key="project.id">
        <ProjectCard :project="project" :index="index + 1" />
      </li>
    </ul>
    <div v-else class="empty-state">
      <PhStack :size="40" weight="light" aria-hidden="true" />
      <h2>作品正在积累</h2>
      <p>这里将展示个人项目与开发实践，完成整理后便会与你见面。</p>
      <RouterLink to="/" class="text-link"
        ><PhArrowLeft :size="20" aria-hidden="true" />返回首页</RouterLink
      >
    </div>
  </section>
</template>
