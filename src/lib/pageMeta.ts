import { siteContent, siteName } from '@/content/site'

export const defaultDescription = siteContent.description

export function pageTitle(label?: string): string {
  return label ? `${label} · ${siteName}` : siteName
}

export function setPageMeta(title: string, description = defaultDescription) {
  document.title = title
  document.querySelector('meta[name="description"]')?.setAttribute('content', description)
}
