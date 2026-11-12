import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { parseSite } from './src/content/siteSchema.ts'

const site = parseSite(
  JSON.parse(readFileSync(new URL('./content/site.json', import.meta.url), 'utf8')),
)
const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    {
      name: 'knowstack-site-meta',
      // 初始 HTML 和路由内的站点信息来自同一份配置，插值前转义属性与文本。
      transformIndexHtml: (html) =>
        html
          .replace('__SITE_TITLE__', () => escapeHtml(`${site.name} ${site.englishName}`))
          .replace('__SITE_DESCRIPTION__', () => escapeHtml(site.description)),
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
