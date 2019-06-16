import fetch from 'node-fetch'

/**
 * documentation: https://dev.to/api
 * spec: https://github.com/thepracticaldev/dev.to/blob/master/spec/requests/api/v0/articles_spec.rb
 **/

export async function getArticles(tag?: string): Promise<Article[]> {
  const queryString = tag === 'Top' ? '' : `tag=${tag}`
  const articles = await fetch(`https://dev.to/api/articles?top=10&${queryString}`).then<Article[]>((res: any) =>
    res.json(),
  )
  return articles
}

/**
 *
 * title: The title of an article (string, optional)
 * description: Description of the article (string, optional)
 * body_markdown: The Markdown body, with or without a front matter (string, required)
 * published: True if the article should be published right away, defaults to false (boolean, optional)
 * tags: A list of tags for the article (array, optional)
 * series: The name of the series the article should be published within (string, optional)
 * publish_under_org: True if the article should be placed under the organization belonging to the user creating the  * article, defaults to false (boolean, optional)
 * main_image: URL of the image to use as the cover (string, optional)
 * canonical_url: canonical URL of the article (string, optional)
 *
 * curl -X POST -H "Content-Type: application/json" \
 * -H "api-key: ACCESS_TOKEN" \
 * -d '{"article": {"body_markdown": "---\ntitle: A sample article about...\npublished: false\n...", "publish_under_org": true}}' \
 * https://dev.to/api/articles
 *
 */
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
    publish_under_org?: boolean
    main_image?: string
    canonical_url?: string
  }
}
