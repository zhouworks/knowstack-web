import { describe, expect, it } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import ProjectCard from '../src/components/ProjectCard.vue'
import type { ProjectContent } from '../src/content/siteSchema'

const project: ProjectContent = {
  id: 'sample',
  name: '示例项目',
  summary: '用于测试展示的项目',
  status: 'building',
  tags: ['Vue 3'],
  highlights: ['文章阅读'],
  links: [],
}
describe('项目展示', () => {
  it('展示名称、状态、技术和亮点，没有链接时不生成按钮或链接', async () => {
    const html = await renderToString(createSSRApp(ProjectCard, { project, index: 1 }))
    expect(html).toContain('示例项目')
    expect(html).toContain('开发中')
    expect(html).toContain('Vue 3')
    expect(html).toContain('文章阅读')
    expect(html).not.toMatch(/<(a|button)\b/)
  })
  it('按提供的链接展示入口，并转义项目文字', async () => {
    const html = await renderToString(
      createSSRApp(ProjectCard, {
        project: {
          ...project,
          name: '<img onerror="alert(1)">',
          status: 'live',
          links: [{ label: '源代码', href: 'https://example.com/code' }],
        },
        index: 1,
      }),
    )
    expect(html).toContain('已上线')
    expect(html).toContain('href="https://example.com/code"')
    expect(html).toContain('源代码')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })
})
