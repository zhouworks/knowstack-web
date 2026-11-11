import MarkdownIt, { type Token } from 'markdown-it'

type MarkdownEnvironment = { imageMap?: Record<string, string> }

export function decodeUrl(value: string): string {
  // 解码后检查协议与控制字符；路径、查询中的普通空格和百分号是合法内容。
  const decoded = decodeURIComponent(value)
  if (/[\p{Cc}\\]/u.test(decoded)) throw new Error(`链接格式不安全：${value}`)
  return decoded
}

export function validateLink(value: string): boolean {
  try {
    const url = decodeUrl(value)
    return /^(https?:\/\/|mailto:)/i.test(url) || /^\/(?!\/)/.test(url) || url.startsWith('#')
  } catch {
    return false
  }
}

const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false })
// 保留所有链接 token，在统一渲染/构建校验时明确报错，避免危险地址被悄悄忽略。
markdown.validateLink = () => true
markdown.core.ruler.push('knowstack_headings', (state) => {
  const ids = new Set<string>()
  for (let i = 0; i < state.tokens.length; i++) {
    const token = state.tokens[i]
    if (token?.type !== 'heading_open') continue
    const inline = state.tokens[i + 1]
    const text = (inline?.children ?? [])
      .filter((child) => ['text', 'code_inline', 'image'].includes(child.type))
      .map((child) => child.content)
      .join('')
    const base =
      text
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s+/g, '-') || 'section'
    let id = base
    let suffix = 2
    while (ids.has(id)) id = `${base}-${suffix++}`
    ids.add(id)
    token.attrSet('id', id)
  }
})

const defaultLink = markdown.renderer.rules.link_open
markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
  const token = tokens[index]!
  const href = String(token.attrGet('href') ?? '')
  if (!validateLink(href)) throw new Error(`不允许的链接：${href}`)
  if (/^https?:/i.test(href)) token.attrSet('rel', 'noopener noreferrer')
  return defaultLink
    ? defaultLink(tokens, index, options, env, self)
    : self.renderToken(tokens, index, options)
}

const defaultImage = markdown.renderer.rules.image!
markdown.renderer.rules.image = (tokens, index, options, env, self) => {
  const token = tokens[index]!
  const source = String(token.attrGet('src') ?? '')
  const destination = (env as MarkdownEnvironment | undefined)?.imageMap?.[source]
  if (
    !destination ||
    !/^\/media\/generated\/[a-f\d]{64}\.(png|jpe?g|webp|gif)$/.test(destination)
  ) {
    throw new Error(`图片未经过发布校验：${source}`)
  }
  token.attrSet('src', destination)
  token.attrSet('loading', 'lazy')
  token.attrSet('decoding', 'async')
  return defaultImage(tokens, index, options, env, self)
}

markdown.renderer.rules.table_open = () =>
  '<div class="table-scroll" tabindex="0" role="region" aria-label="数据表格"><table>\n'
markdown.renderer.rules.table_close = () => '</table></div>\n'
const defaultFence = markdown.renderer.rules.fence!
markdown.renderer.rules.fence = (tokens, index, options, env, self) =>
  defaultFence(tokens, index, options, env, self).replace(
    '<pre>',
    '<pre tabindex="0" aria-label="代码示例">',
  )
const defaultCodeBlock = markdown.renderer.rules.code_block!
markdown.renderer.rules.code_block = (tokens, index, options, env, self) =>
  defaultCodeBlock(tokens, index, options, env, self).replace(
    '<pre>',
    '<pre tabindex="0" aria-label="代码示例">',
  )

export function parseMarkdown(source: string): Token[] {
  return markdown.parse(source, {})
}

export function flattenTokens(tokens: Token[]): Token[] {
  return tokens.flatMap((token) => [token, ...flattenTokens(token.children ?? [])])
}

export function renderMarkdown(source: string, imageMap: Record<string, string> = {}): string {
  return markdown.render(source, { imageMap })
}
