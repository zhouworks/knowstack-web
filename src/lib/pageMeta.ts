export const defaultDescription = '知栈 KnowStack，记录学习与开发中的思考，分享技术文章与项目实践。'

export function setPageMeta(title: string, description = defaultDescription) {
  document.title = title
  document.querySelector('meta[name="description"]')?.setAttribute('content', description)
}
