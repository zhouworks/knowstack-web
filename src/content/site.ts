import siteData from '../../content/site.json'
import projectData from '../../content/projects.json'
import { parseProjects, parseSite } from './siteSchema'

// 此配置只用于已确认公开的信息，不存放草稿、凭据或尚未同意公开的个人资料。
export const siteContent = parseSite(siteData)
export const projects = parseProjects(projectData)
export const siteName = `${siteContent.name} ${siteContent.englishName}`
