import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseDocument } from 'yaml'
import {
  decodeUrl,
  flattenTokens,
  parseMarkdown,
  renderMarkdown,
  validateLink,
} from '../src/lib/markdown.ts'
import type { PostDetail, PostSummary } from '../src/content/models.ts'

interface SourcePost {
  slug: string
  status: 'draft' | 'published'
  metadata: Record<string, unknown>
  body: string
  directory: string
}
type PublishedPost = PostDetail & { assets: Map<string, Buffer> }
const fields = new Set([
  'slug',
  'title',
  'summary',
  'publishedAt',
  'updatedAt',
  'status',
  'category',
  'tags',
])
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
function textField(value: unknown, label: string): string {
  assert(typeof value === 'string' && value.trim(), `${label}不能为空，且必须为字符串`)
  return value.trim()
}
function dateField(value: unknown, label: string): string {
  assert(
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value),
    `${label}必须为 YYYY-MM-DD`,
  )
  const date = new Date(`${value}T00:00:00Z`)
  assert(
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value,
    `${label}不是有效日期`,
  )
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  assert(value <= today, `${label}不能是未来日期`)
  return value
}
function contained(parent: string, child: string): boolean {
  const relative = path.relative(parent, child)
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}

async function readSources(root: string): Promise<SourcePost[]> {
  const sourceRoot = path.join(root, 'content/posts')
  const entries = await readdir(sourceRoot, { withFileTypes: true })
  const realRoot = await realpath(sourceRoot)
  const slugs = new Set<string>()
  const sources: SourcePost[] = []
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'README.md') continue
    assert(entry.isDirectory() && !entry.isSymbolicLink(), `文章必须放在独立目录中：${entry.name}`)
    const directory = path.join(sourceRoot, entry.name)
    const filename = path.join(directory, 'index.md')
    assert(contained(realRoot, await realpath(filename)), `文章文件越界：${entry.name}`)
    const raw = (await readFile(filename, 'utf8')).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
    const lines = raw.split('\n')
    const end = lines.indexOf('---', 1)
    assert(lines[0] === '---' && end > 0, `${entry.name}：缺少 YAML frontmatter`)
    const document = parseDocument(lines.slice(1, end).join('\n'), { uniqueKeys: true })
    assert(
      document.errors.length === 0,
      `${entry.name}：${document.errors.map((error) => error.message).join('; ')}`,
    )
    const metadata: unknown = document.toJS({ maxAliasCount: 50 })
    assert(
      metadata && typeof metadata === 'object' && !Array.isArray(metadata),
      `${entry.name}：元数据必须为对象`,
    )
    const data = metadata as Record<string, unknown>
    for (const key of Object.keys(data)) assert(fields.has(key), `${entry.name}：未知字段 ${key}`)
    const slug = textField(data.slug, `${entry.name}.slug`)
    assert(
      slugPattern.test(slug) && slug === entry.name && !slugs.has(slug),
      `${entry.name}：slug 无效、重复或与目录不一致`,
    )
    slugs.add(slug)
    const status = data.status === undefined ? 'draft' : data.status
    assert(status === 'draft' || status === 'published', `${slug}：status 只允许 draft / published`)
    for (const key of ['title', 'summary', 'category'])
      if (data[key] !== undefined) textField(data[key], `${slug}.${key}`)
    for (const key of ['publishedAt', 'updatedAt'])
      if (data[key] !== undefined) dateField(data[key], `${slug}.${key}`)
    if (data.publishedAt && data.updatedAt)
      assert(String(data.updatedAt) >= String(data.publishedAt), `${slug}：更新日期早于发布日期`)
    if (data.tags !== undefined)
      assert(
        Array.isArray(data.tags) && data.tags.every((tag) => typeof tag === 'string' && tag.trim()),
        `${slug}：tags 必须为非空字符串数组`,
      )
    sources.push({
      slug,
      status,
      metadata: data,
      body: lines
        .slice(end + 1)
        .join('\n')
        .trim(),
      directory,
    })
  }
  return sources
}

function imageFormat(bytes: Buffer, extension: string): boolean {
  if (extension === '.png')
    return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (extension === '.jpg' || extension === '.jpeg')
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  if (extension === '.gif') return /^GIF8[79]a$/.test(bytes.subarray(0, 6).toString())
  if (extension === '.webp')
    return bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP'
  return false
}

export async function collectPosts(root: string): Promise<PublishedPost[]> {
  const sources = await readSources(root)
  const published = sources.filter((source) => source.status === 'published')
  const headings = new Map(
    published.map((source) => [
      source.slug,
      new Set(
        parseMarkdown(source.body)
          .filter((token) => token.type === 'heading_open')
          .map((token) => token.attrGet('id')),
      ),
    ]),
  )
  const posts: PublishedPost[] = []
  for (const source of published) {
    const { slug, metadata: data, body } = source
    assert(body, `${slug}：发布文章正文不能为空`)
    const post: PublishedPost = {
      slug,
      title: textField(data.title, `${slug}.title`),
      summary: textField(data.summary, `${slug}.summary`),
      publishedAt: dateField(data.publishedAt, `${slug}.publishedAt`),
      ...(data.updatedAt ? { updatedAt: String(data.updatedAt) } : {}),
      ...(data.category ? { category: String(data.category).trim() } : {}),
      tags: [...new Set(((data.tags ?? []) as string[]).map((tag) => tag.trim()))],
      bodyMarkdown: body,
      imageMap: {},
      assets: new Map(),
    }
    for (const token of flattenTokens(parseMarkdown(body))) {
      if (token.type === 'link_open') {
        const href = String(token.attrGet('href') ?? '')
        assert(validateLink(href), `${slug}：不允许的链接 ${href}`)
        const decoded = decodeUrl(href)
        if (decoded.startsWith('/') || decoded.startsWith('#')) {
          const url = new URL(decoded, `https://knowstack.invalid/blog/${slug}`)
          const pathname = decodeURIComponent(url.pathname).replace(/\/$/, '') || '/'
          const target = pathname.startsWith('/blog/') ? pathname.slice(6) : null
          assert(
            target
              ? headings.has(target)
              : ['/', '/blog', '/projects', '/about'].includes(pathname),
            `${slug}：站内链接不存在或尚未发布 ${href}`,
          )
          if (url.hash) {
            const anchor = decodeURIComponent(url.hash.slice(1))
            assert(
              anchor === 'main-content' || (target && headings.get(target)?.has(anchor)),
              `${slug}：锚点不存在 ${href}`,
            )
          }
        }
      }
      if (token.type === 'image') {
        const url = String(token.attrGet('src') ?? '')
        let decoded = ''
        try {
          decoded = decodeURIComponent(url)
        } catch {
          throw new Error(`${slug}：图片路径编码无效`)
        }
        assert(
          decoded &&
            !/[:\\?#%\p{Cc}]/u.test(decoded) &&
            !decoded.startsWith('/') &&
            !decoded.split('/').includes('..'),
          `${slug}：图片只允许当前文章内的相对路径 ${url}`,
        )
        const extension = path.extname(decoded).toLowerCase()
        assert(
          ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(extension),
          `${slug}：不支持的图片格式 ${url}`,
        )
        const filename = path.resolve(source.directory, decoded)
        let resolved: string
        try {
          resolved = await realpath(filename)
        } catch {
          throw new Error(`${slug}：图片不存在 ${url}`)
        }
        assert(
          contained(await realpath(source.directory), resolved),
          `${slug}：图片真实路径越界 ${url}`,
        )
        const stats = await lstat(resolved)
        assert(
          stats.isFile() && stats.size <= 5 * 1024 * 1024,
          `${slug}：图片必须为不超过 5 MiB 的文件`,
        )
        const bytes = await readFile(resolved)
        assert(imageFormat(bytes, extension), `${slug}：图片内容与扩展名不符 ${url}`)
        const name = `${createHash('sha256').update(bytes).digest('hex')}${extension === '.jpeg' ? '.jpg' : extension}`
        post.imageMap[url] = `/media/generated/${name}`
        post.assets.set(name, bytes)
      }
    }
    renderMarkdown(body, post.imageMap)
    posts.push(post)
  }
  return posts.sort(
    (a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug, 'en'),
  )
}

// 只允许清理两个专属生成目录；逐层拒绝符号链接，避免穿过父目录链接误删外部文件。
async function safeOutput(
  root: string,
  relative: 'src/generated' | 'public/media/generated',
): Promise<string> {
  const base = await realpath(root)
  let current = base
  for (const segment of relative.split('/')) {
    current = path.join(current, segment)
    try {
      const stat = await lstat(current)
      assert(
        stat.isDirectory() && !stat.isSymbolicLink(),
        `生成目录不能为文件或符号链接：${current}`,
      )
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }
  assert(
    contained(base, current) && current === path.resolve(base, relative),
    '生成目录超出项目范围',
  )
  return current
}

export async function generateContent(root: string): Promise<void> {
  const posts = await collectPosts(root)
  const generated = await safeOutput(root, 'src/generated')
  const media = await safeOutput(root, 'public/media/generated')
  for (const directory of [generated, media]) {
    await rm(directory, { recursive: true, force: true })
    await mkdir(directory, { recursive: true })
  }
  await mkdir(path.join(generated, 'posts'))
  const summaries: PostSummary[] = []
  for (const post of posts) {
    const { bodyMarkdown, imageMap, assets, ...summary } = post
    summaries.push(summary)
    await writeFile(
      path.join(generated, 'posts', `${post.slug}.json`),
      JSON.stringify({ ...summary, bodyMarkdown, imageMap }, null, 2),
    )
    for (const [name, bytes] of assets) await writeFile(path.join(media, name), bytes)
  }
  await writeFile(path.join(generated, 'posts.json'), JSON.stringify(summaries, null, 2))
  const imports = posts
    .map(
      (post) =>
        `  '${post.slug}': () => import('./posts/${post.slug}.json').then(module => module.default),`,
    )
    .join('\n')
  await writeFile(
    path.join(generated, 'loaders.ts'),
    `// 自动生成：只包含已发布文章，请勿手动编辑。\nimport type { PostDetail } from '../content/models'\nexport const postLoaders: Record<string, () => Promise<PostDetail>> = {\n${imports}\n}\n`,
  )
}

async function filesIn(directory: string): Promise<string[]> {
  const result: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name)
    assert(!entry.isSymbolicLink(), `产物中不允许符号链接：${filename}`)
    if (entry.isDirectory()) result.push(...(await filesIn(filename)))
    else result.push(filename)
  }
  return result
}

export async function auditBuild(root: string): Promise<void> {
  const sources = await readSources(root)
  const published = await collectPosts(root)
  const allowedImages = new Set(published.flatMap((post) => [...post.assets.keys()]))
  const publicText = published
    .map((post) =>
      [post.title, post.summary, post.bodyMarkdown, post.category ?? '', ...post.tags].join('\n'),
    )
    .join('\n')
  // 审查草稿独有的正文行，兼顾 JSON 转义；短文本会与通用 UI 文案碰撞，交由结构隔离保证。
  const privateLines = sources
    .filter((source) => source.status === 'draft')
    .flatMap((source) => source.body.split('\n').map((line) => line.trim()))
    .filter((line) => line.length >= 16 && !publicText.includes(line))
  const generatedFiles = await filesIn(path.join(root, 'src/generated/posts'))
  const expected = new Set(published.map((post) => `${post.slug}.json`))
  assert(
    generatedFiles.length === expected.size &&
      generatedFiles.every((file) => expected.has(path.basename(file))),
    '生成的文章清单与发布状态不一致',
  )
  const outputs = [
    ...(await filesIn(path.join(root, 'dist'))),
    ...(await filesIn(path.join(root, 'src/generated'))),
  ]
  for (const filename of outputs) {
    if (/\.(js|json|html|map|ts|css)$/.test(filename)) {
      const content = await readFile(filename, 'utf8')
      assert(
        !privateLines.some(
          (line) => content.includes(line) || content.includes(JSON.stringify(line).slice(1, -1)),
        ),
        `草稿正文泄漏到产物：${filename}`,
      )
    }
    if (filename.includes(`${path.sep}media${path.sep}generated${path.sep}`))
      assert(allowedImages.has(path.basename(filename)), `产物含已撤下图片：${filename}`)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const command = process.argv[2]
  try {
    if (command === 'check')
      console.log(`内容校验通过：${(await collectPosts(root)).length} 篇已发布文章`)
    else if (command === 'generate') {
      await generateContent(root)
      console.log('文章与图片生成完成')
    } else if (command === 'audit') {
      await auditBuild(root)
      console.log('构建产物审查通过')
    } else throw new Error('使用方式：node scripts/content.ts check|generate|audit')
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
