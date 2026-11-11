export interface PostSummary {
  slug: string
  title: string
  summary: string
  publishedAt: string
  updatedAt?: string
  category?: string
  tags: string[]
}

export interface PostDetail extends PostSummary {
  bodyMarkdown: string
  imageMap: Record<string, string>
}

export interface ContentRepository {
  listPosts(): Promise<PostSummary[]>
  getPost(slug: string): Promise<PostDetail | null>
}
