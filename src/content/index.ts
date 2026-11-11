import summaries from '@/generated/posts.json'
import { postLoaders } from '@/generated/loaders'
import { createStaticRepository } from './staticRepository'

// 后续接入 HTTP 时只替换此处，页面继续使用相同的读取接口。
export const contentRepository = createStaticRepository(summaries, postLoaders)
