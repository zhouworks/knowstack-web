import type { ContentRepository, PostDetail, PostSummary } from './models'

export function createStaticRepository(
  summaries: PostSummary[],
  loaders: Record<string, () => Promise<PostDetail>>,
): ContentRepository {
  const pending = new Map<string, Promise<PostDetail>>()
  return {
    async listPosts() {
      return summaries
    },
    async getPost(slug) {
      if (!Object.hasOwn(loaders, slug)) return null
      // 合并路由滚动恢复与页面读取；失败不缓存，重试会重新加载正文。
      if (!pending.has(slug)) {
        pending.set(
          slug,
          loaders[slug]!().catch((error: unknown) => {
            pending.delete(slug)
            throw error
          }),
        )
      }
      return pending.get(slug)!
    },
  }
}
