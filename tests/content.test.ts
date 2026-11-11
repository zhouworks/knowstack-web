import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { collectPosts, generateContent, auditBuild } from '../scripts/content.ts'
import { renderMarkdown } from '../src/lib/markdown.ts'

const roots: string[] = []
async function workspace() {
  const root = await mkdtemp(join(tmpdir(), 'knowstack-content-'))
  roots.push(root)
  await mkdir(join(root, 'content/posts'), { recursive: true })
  return root
}
async function post(root: string, slug: string, extra = '', body = '## 正文\n\n阅读内容。') {
  await mkdir(join(root, 'content/posts', slug), { recursive: true })
  await writeFile(
    join(root, 'content/posts', slug, 'index.md'),
    `---\nslug: ${slug}\ntitle: 标题 ${slug}\nsummary: 摘要\npublishedAt: 2026-01-01\nstatus: published\n${extra}---\n${body}`,
  )
}
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('文章内容规则', () => {
  it('按日期降序、同日 slug 升序排列，摘要不包含正文，草稿不进入产物', async () => {
    const root = await workspace()
    await post(root, 'zebra')
    await post(root, 'alpha')
    await post(root, 'newest', 'updatedAt: 2026-02-01\n')
    const path = join(root, 'content/posts/newest/index.md')
    await writeFile(
      path,
      (await readFile(path, 'utf8')).replace('publishedAt: 2026-01-01', 'publishedAt: 2026-02-01'),
    )
    await mkdir(join(root, 'content/posts/private-draft'))
    await writeFile(
      join(root, 'content/posts/private-draft/index.md'),
      '---\nslug: private-draft\n---\nSECRET_DRAFT_SENTINEL',
    )
    await generateContent(root)
    const index = await readFile(join(root, 'src/generated/posts.json'), 'utf8')
    expect(JSON.parse(index).map((p: { slug: string }) => p.slug)).toEqual([
      'newest',
      'alpha',
      'zebra',
    ])
    expect(index).not.toContain('bodyMarkdown')
    expect(index).not.toContain('private-draft')
    expect(await readdir(join(root, 'src/generated/posts'))).toEqual([
      'alpha.json',
      'newest.json',
      'zebra.json',
    ])
  })

  it.each([
    ['重复键', 'title: 重复标题\n'],
    ['未知字段', 'typo: value\n'],
    ['不存在日期', 'updatedAt: 2026-02-30\n'],
    ['未来日期', 'updatedAt: 2999-01-01\n'],
    ['更新早于发布', 'updatedAt: 2025-01-01\n'],
    ['错误标签类型', 'tags: 单个标签\n'],
  ])('拒绝%s', async (_name, extra) => {
    const root = await workspace()
    await post(root, 'example', extra)
    await expect(collectPosts(root)).rejects.toThrow()
  })

  it('去重标签并验证发布文章必填内容', async () => {
    const root = await workspace()
    await post(root, 'example', 'tags: [Vue, Vue, Java]\n')
    expect((await collectPosts(root))[0]?.tags).toEqual(['Vue', 'Java'])
    await post(root, 'example', '', '   ')
    await expect(collectPosts(root)).rejects.toThrow(/正文/)
  })

  it('阻止不存在、草稿和不存在锚点的站内链接', async () => {
    const root = await workspace()
    await post(root, 'example', '', '[链接](/blog/missing)')
    await expect(collectPosts(root)).rejects.toThrow(/链接/)
    await post(root, 'example', '', '[链接](#missing)')
    await expect(collectPosts(root)).rejects.toThrow(/锚点/)
    await mkdir(join(root, 'content/posts/draft'))
    await writeFile(join(root, 'content/posts/draft/index.md'), '---\nslug: draft\n---\n')
    await post(root, 'example', '', '[链接](/blog/draft)')
    await expect(collectPosts(root)).rejects.toThrow(/链接/)
  })

  it('只复制引用图片，改写资源 URL，再生成时移除已撤下资源', async () => {
    const root = await workspace()
    await post(root, 'example', '', '![示例](./sample.png)')
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8X0AAAAASUVORK5CYII=',
      'base64',
    )
    await writeFile(join(root, 'content/posts/example/sample.png'), png)
    await writeFile(join(root, 'content/posts/example/unused.png'), png)
    await generateContent(root)
    const files = await readdir(join(root, 'public/media/generated'))
    expect(files).toHaveLength(1)
    const detail = JSON.parse(
      await readFile(join(root, 'src/generated/posts/example.json'), 'utf8'),
    )
    expect(renderMarkdown(detail.bodyMarkdown, detail.imageMap)).toContain(
      `/media/generated/${files[0]}`,
    )
    await post(root, 'example')
    await generateContent(root)
    expect(await readdir(join(root, 'public/media/generated'))).toEqual([])
  })

  it.each(['../outside.png', '/absolute.png', 'https://example.com/image.png', './image.svg'])(
    '拒绝图片路径 %s',
    async (url) => {
      const root = await workspace()
      await post(root, 'example', '', `![图片](${url})`)
      await expect(collectPosts(root)).rejects.toThrow(/图片/)
    },
  )

  it('草稿与公开文章共享带引号的代码时不误报泄漏', async () => {
    const root = await workspace()
    const body = '```java\nSystem.out.println("Hello, KnowStack!");\n```'
    await post(root, 'example', '', body)
    await mkdir(join(root, 'content/posts/draft'))
    await writeFile(join(root, 'content/posts/draft/index.md'), `---\nslug: draft\n---\n${body}`)
    await generateContent(root)
    await mkdir(join(root, 'dist'))
    await expect(auditBuild(root)).resolves.toBeUndefined()
  })

  it('产物审查发现草稿文本泄漏', async () => {
    const root = await workspace()
    await mkdir(join(root, 'content/posts/secret'))
    await writeFile(
      join(root, 'content/posts/secret/index.md'),
      '---\nslug: secret\n---\nPRIVATE_BODY_SENTINEL_123456789',
    )
    await generateContent(root)
    await mkdir(join(root, 'dist'))
    await writeFile(join(root, 'dist/bad.js'), 'PRIVATE_BODY_SENTINEL_123456789')
    await expect(auditBuild(root)).rejects.toThrow(/草稿/)
  })
})

describe('Markdown 渲染', () => {
  it('允许链接路径和查询中的编码空格、百分号', () => {
    expect(
      renderMarkdown('[搜索](https://example.com/search?q=spring%20boot&progress=50%25)'),
    ).toContain('href="https://example.com/search?q=spring%20boot&amp;progress=50%25"')
    expect(renderMarkdown('[邮件](mailto:hello@example.com?subject=Java%20Notes)')).toContain(
      'mailto:hello@example.com?subject=Java%20Notes',
    )
  })
  it('关闭原始 HTML，保留代码、表格和去重的中文标题锚点', () => {
    const html = renderMarkdown(
      '# 你好\n\n# 你好\n\n<script>alert(1)</script>\n\n```html\n<img onerror="x">\n```\n\n| 标题 |\n| --- |\n| 内容 |',
    )
    expect(html).toContain('id="你好"')
    expect(html).toContain('id="你好-2"')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;img')
    expect(html).toContain('<table>')
  })
  it.each([
    'javascript:alert(1)',
    'data:text/html,x',
    '//evil.test',
    '%6aavascript%3Aalert(1)',
    'file:///tmp/a',
  ])('不渲染危险链接 %s', (url) => {
    expect(() => renderMarkdown(`[点击](<${url}>)`)).toThrow(/链接/)
  })
  it('允许公开协议和站内路径，并转义标题属性', () => {
    const html = renderMarkdown(
      '[邮件](mailto:hello@example.com) [站内](/blog) [外部](https://example.com "&quot; hi")',
    )
    expect(html).toContain('mailto:hello@example.com')
    expect(html).toContain('href="/blog"')
    expect(html).toContain('&quot; hi')
  })
})
