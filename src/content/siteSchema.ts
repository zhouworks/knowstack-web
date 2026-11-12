export interface PublicLink {
  label: string
  href: string
}
export interface PublicProfile {
  name: string
  bio: string[]
  interests: string[]
  links: PublicLink[]
}
export interface SiteContent {
  name: string
  englishName: string
  description: string
  tagline: string
  home: { titleLines: string[]; summaryLines: string[] }
  about: {
    title: string
    intro: string[]
    sections: { id: string; title: string; text: string }[]
    profile?: PublicProfile
  }
}
export const projectStatusLabels = {
  building: '开发中',
  live: '已上线',
  archived: '已归档',
} as const
export interface ProjectContent {
  id: string
  name: string
  summary: string
  status: keyof typeof projectStatusLabels
  tags: string[]
  highlights: string[]
  links: PublicLink[]
}

function object(value: unknown, fields: string[], location: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${location} 必须是对象`)
  for (const key of Object.keys(value))
    if (!fields.includes(key)) throw new Error(`${location} 未知字段：${key}`)
  return value as Record<string, unknown>
}
function text(value: unknown, location: string): string {
  if (typeof value !== 'string' || !value.trim() || /\p{Cc}/u.test(value))
    throw new Error(`${location} 必须是非空文本且不含控制字符`)
  return value.trim()
}
function list(value: unknown, location: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${location} 必须是数组`)
  return value
}
function texts(value: unknown, location: string, required = false): string[] {
  const result = list(value, location).map((item, index) => text(item, `${location}[${index}]`))
  if (required && result.length === 0) throw new Error(`${location} 不能为空`)
  return result
}
function identifier(value: unknown, location: string): string {
  const id = text(value, location)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`${location} 格式错误`)
  return id
}
function links(value: unknown, location: string, allowMail: boolean): PublicLink[] {
  return list(value ?? [], location).map((item, index) => {
    const key = `${location}[${index}]`
    const data = object(item, ['label', 'href'], key)
    const label = text(data.label, `${key}.label`)
    const href = text(data.href, `${key}.href`)
    // 联系方式仅接受单个明确邮箱；外链禁止凭据和反斜杠，避免意外公开秘密或误导地址。
    if (allowMail && /^mailto:[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(href)) return { label, href }
    try {
      const url = new URL(href)
      if (
        !/^https?:\/\//i.test(href) ||
        !url.hostname ||
        url.username ||
        url.password ||
        /[\s\\]/.test(href)
      )
        throw new Error('invalid')
    } catch {
      throw new Error(`${key}.href 必须是有效 HTTP/HTTPS 地址${allowMail ? '或 mailto 邮箱' : ''}`)
    }
    return { label, href }
  })
}

export function parseProjects(value: unknown): ProjectContent[] {
  const ids = new Set<string>()
  return list(value, 'projects').map((item, index) => {
    const key = `projects[${index}]`
    const data = object(
      item,
      ['id', 'name', 'summary', 'status', 'tags', 'highlights', 'links'],
      key,
    )
    const id = identifier(data.id, `${key}.id`)
    if (ids.has(id)) throw new Error(`${key}.id 重复：${id}`)
    ids.add(id)
    if (typeof data.status !== 'string' || !Object.hasOwn(projectStatusLabels, data.status))
      throw new Error(`${key}.status 无效`)
    return {
      id,
      name: text(data.name, `${key}.name`),
      summary: text(data.summary, `${key}.summary`),
      status: data.status as ProjectContent['status'],
      tags: [...new Set(texts(data.tags ?? [], `${key}.tags`))],
      highlights: texts(data.highlights ?? [], `${key}.highlights`),
      links: links(data.links, `${key}.links`, false),
    }
  })
}

export function parseSite(value: unknown): SiteContent {
  const data = object(
    value,
    ['name', 'englishName', 'description', 'tagline', 'home', 'about'],
    'site',
  )
  const home = object(data.home, ['titleLines', 'summaryLines'], 'site.home')
  const about = object(data.about, ['title', 'intro', 'sections', 'profile'], 'site.about')
  const sectionIds = new Set<string>()
  const sections = list(about.sections, 'site.about.sections').map((item, index) => {
    const key = `site.about.sections[${index}]`
    const section = object(item, ['id', 'title', 'text'], key)
    const id = identifier(section.id, `${key}.id`)
    if (sectionIds.has(id)) throw new Error(`${key}.id 重复`)
    sectionIds.add(id)
    return {
      id,
      title: text(section.title, `${key}.title`),
      text: text(section.text, `${key}.text`),
    }
  })
  let profile: PublicProfile | undefined
  if (about.profile !== undefined) {
    const item = object(about.profile, ['name', 'bio', 'interests', 'links'], 'site.about.profile')
    profile = {
      name: text(item.name, 'site.about.profile.name'),
      bio: texts(item.bio, 'site.about.profile.bio', true),
      interests: [...new Set(texts(item.interests ?? [], 'site.about.profile.interests'))],
      links: links(item.links, 'site.about.profile.links', true),
    }
  }
  return {
    name: text(data.name, 'site.name'),
    englishName: text(data.englishName, 'site.englishName'),
    description: text(data.description, 'site.description'),
    tagline: text(data.tagline, 'site.tagline'),
    home: {
      titleLines: texts(home.titleLines, 'site.home.titleLines', true),
      summaryLines: texts(home.summaryLines, 'site.home.summaryLines', true),
    },
    about: {
      title: text(about.title, 'site.about.title'),
      intro: texts(about.intro, 'site.about.intro', true),
      sections,
      ...(profile ? { profile } : {}),
    },
  }
}
