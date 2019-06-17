import fetch from 'node-fetch'

/**
 * documentation: https://dev.to/api
 * spec: https://github.com/thepracticaldev/dev.to/blob/master/spec/requests/api/v0/articles_spec.rb
 **/

export async function getArticles(tag?: string): Promise<Article[]> {
  const queryString = tag === 'Top' ? '' : `tag=${tag}`
  const articles = await fetch(`https://dev.to/api/articles?${queryString}`).then<Article[]>((res: any) => res.json())
  return articles
}

export async function postArticle(article: PostArticle, token: string) {
  return await fetch('https://dev.to/api/articles', {
    method: 'post',
    body: JSON.stringify(article),
    headers: {
      'Content-Type': 'application/json',
      'api-key': token,
    },
  }).then((res: any) => res.json())
}

export interface Article {
  type_of: string
  id: number
  title: string
  description: string
  cover_image: string | null
  published_at: string
  tag_list: string[]
  slug: string
  path: string
  url: string
  canonical_url: string
  comments_count: number
  positive_reactions_count: number
  published_timestamp: string
  user: {
    name: string
    username: string
    twitter_username: string | null
    github_username: string | null
    website_url: string | null
    profile_image: string | null
    profile_image_90: string | null
  }
  flare_tag: {
    name: string
    bg_color_hex: string
    text_color_hex: string
  }
}

export interface PostArticle {
  article: {
    title: string
    body_markdown: string
    description?: string
    published?: boolean
    tags?: string[]
    series?: string
    organization_id?: string
    main_image?: string
    canonical_url?: string
  }
}
