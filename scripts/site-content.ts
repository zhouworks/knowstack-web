import { readFile } from 'node:fs/promises'
import { parseProjects, parseSite } from '../src/content/siteSchema.ts'

try {
  const site = parseSite(
    JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8')),
  )
  const projects = parseProjects(
    JSON.parse(await readFile(new URL('../content/projects.json', import.meta.url), 'utf8')),
  )
  console.log(`公开配置校验通过：${site.name}，${projects.length} 个项目`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
