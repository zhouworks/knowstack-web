import { describe, expect, it, vi } from 'vitest'
import { createStaticRepository } from '../src/content/staticRepository'
import type { PostDetail, PostSummary } from '../src/content/models'

const summary: PostSummary = {
  slug: 'example',
  title: '示例',
  summary: '摘要',
  publishedAt: '2026-01-01',
  tags: [],
}
const detail: PostDetail = { ...summary, bodyMarkdown: '正文', imageMap: {} }
describe('静态内容仓库', () => {
  it('列表不加载正文，未知 slug 返回 null，并复用并发正文请求', async () => {
    const loader = vi.fn(async () => detail)
    const repository = createStaticRepository([summary], { example: loader })
    expect(await repository.listPosts()).toEqual([summary])
    expect(loader).not.toHaveBeenCalled()
    expect(await repository.getPost('missing')).toBeNull()
    expect(await repository.getPost('constructor')).toBeNull()
    expect(
      await Promise.all([repository.getPost('example'), repository.getPost('example')]),
    ).toEqual([detail, detail])
    expect(loader).toHaveBeenCalledTimes(1)
  })
  it('读取失败不会伪装成不存在，之后可重试', async () => {
    const loader = vi
      .fn<() => Promise<PostDetail>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(detail)
    const repository = createStaticRepository([summary], { example: loader })
    await expect(repository.getPost('example')).rejects.toThrow('offline')
    expect(await repository.getPost('example')).toEqual(detail)
  })
})
