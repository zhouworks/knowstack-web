import { describe, expect, it } from 'vitest'
import { parseProjects, parseSite } from '../src/content/siteSchema'

const baseSite = {
  name: '知栈',
  englishName: 'KnowStack',
  description: '学习与开发记录',
  tagline: '持续学习，持续构建。',
  home: { titleLines: ['把思考，', '写成新的可能。'], summaryLines: ['记录思考，', '分享实践。'] },
  about: {
    title: '关于知栈',
    intro: ['一个个人技术网站。'],
    sections: [{ id: 'notes', title: '记录', text: '留下思考。' }],
  },
}
const project = {
  id: 'knowstack',
  name: '知栈',
  summary: '个人技术网站',
  status: 'building',
  tags: ['Vue 3'],
  highlights: ['文章阅读'],
}

describe('公开站点配置', () => {
  it('未提供个人资料时不生成姓名或联系方式', () => {
    expect(parseSite(baseSite).about.profile).toBeUndefined()
  })
  it('允许独立维护个人简介及公开链接', () => {
    const site = parseSite({
      ...baseSite,
      about: {
        ...baseSite.about,
        profile: {
          name: '公开昵称',
          bio: ['个人介绍'],
          interests: ['Java'],
          links: [{ label: '联系', href: 'mailto:hello@example.com' }],
        },
      },
    })
    expect(site.about.profile?.links[0]?.href).toBe('mailto:hello@example.com')
  })
  it('拒绝拼错的配置字段和空文案', () => {
    expect(() => parseSite({ ...baseSite, typo: 'value' })).toThrow(/未知字段/)
    expect(() => parseSite({ ...baseSite, name: ' ' })).toThrow(/name/)
  })
})

describe('项目配置', () => {
  it('支持空列表与没有链接的项目，保留配置顺序', () => {
    expect(parseProjects([])).toEqual([])
    const values = parseProjects([project, { ...project, id: 'second' }])
    expect(values.map((value) => value.id)).toEqual(['knowstack', 'second'])
    expect(values[0]?.links).toEqual([])
  })
  it('拒绝重复标识和未知项目状态', () => {
    expect(() => parseProjects([project, project])).toThrow(/重复/)
    expect(() => parseProjects([{ ...project, status: 'fake' }])).toThrow(/status/)
  })
  it.each([
    'javascript:alert(1)',
    '//example.com',
    '#',
    'https://user:secret@example.com',
    'https://',
    'file:///secret',
  ])('拒绝项目链接 %s', (href) => {
    expect(() => parseProjects([{ ...project, links: [{ label: '源码', href }] }])).toThrow(/href/)
  })
  it('支持 HTTP/HTTPS 项目地址，不接受任意站内占位路径', () => {
    expect(
      parseProjects([
        { ...project, links: [{ label: '源码', href: 'https://example.com/project' }] },
      ])[0]?.links,
    ).toHaveLength(1)
    expect(() =>
      parseProjects([{ ...project, links: [{ label: '演示', href: '/missing' }] }]),
    ).toThrow(/href/)
  })
  it('标签去重，空白可选链接不能假装有效', () => {
    expect(parseProjects([{ ...project, tags: [' Vue 3 ', 'Vue 3'] }])[0]?.tags).toEqual(['Vue 3'])
    expect(() => parseProjects([{ ...project, links: [{ label: '源码', href: '' }] }])).toThrow(
      /href/,
    )
  })
})
