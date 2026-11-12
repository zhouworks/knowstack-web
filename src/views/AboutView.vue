<script setup lang="ts">
import { PhArrowRight, PhEnvelopeSimple } from '@phosphor-icons/vue'
import { RouterLink } from 'vue-router'
import { siteContent } from '@/content/site'
import '@/site-pages.css'

const about = siteContent.about
</script>

<template>
  <article class="content-page about-page" aria-labelledby="about-title">
    <header class="page-heading">
      <p class="content-kicker" lang="en">A LITTLE ABOUT</p>
      <h1 id="about-title">{{ about.title }}</h1>
      <p>{{ siteContent.tagline }}</p>
    </header>
    <div class="about-layout">
      <div class="about-story">
        <div class="about-intro">
          <p v-for="(paragraph, index) in about.intro" :key="index">{{ paragraph }}</p>
        </div>
        <div class="about-sections">
          <section
            v-for="(section, index) in about.sections"
            :key="section.id"
            :aria-labelledby="`about-${section.id}`"
          >
            <span aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
            <div>
              <h2 :id="`about-${section.id}`">{{ section.title }}</h2>
              <p>{{ section.text }}</p>
            </div>
          </section>
        </div>
        <div class="about-actions">
          <RouterLink to="/blog" class="text-link"
            >阅读文章 <PhArrowRight :size="20" aria-hidden="true"
          /></RouterLink>
          <RouterLink to="/projects" class="text-link"
            >浏览项目 <PhArrowRight :size="20" aria-hidden="true"
          /></RouterLink>
        </div>
      </div>
      <aside v-if="about.profile" class="profile-card" aria-labelledby="profile-name">
        <p class="content-kicker">本站作者</p>
        <h2 id="profile-name">{{ about.profile.name }}</h2>
        <p v-for="(paragraph, index) in about.profile.bio" :key="index" class="profile-bio">
          {{ paragraph }}
        </p>
        <ul v-if="about.profile.interests.length" class="content-tags" aria-label="关注方向">
          <li v-for="interest in about.profile.interests" :key="interest">{{ interest }}</li>
        </ul>
        <div v-if="about.profile.links.length" class="profile-links">
          <a
            v-for="link in about.profile.links"
            :key="link.href"
            :href="link.href"
            :target="link.href.startsWith('mailto:') ? undefined : '_blank'"
            :rel="link.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'"
            :aria-label="
              link.href.startsWith('mailto:')
                ? `发送邮件至 ${link.label}`
                : `${link.label}（新窗口打开）`
            "
          >
            <PhEnvelopeSimple
              v-if="link.href.startsWith('mailto:')"
              :size="18"
              aria-hidden="true"
            /><span>{{ link.label }}</span
            ><PhArrowRight v-if="!link.href.startsWith('mailto:')" :size="18" aria-hidden="true" />
          </a>
        </div>
      </aside>
    </div>
  </article>
</template>
