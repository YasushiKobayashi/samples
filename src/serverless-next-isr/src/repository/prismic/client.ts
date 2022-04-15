import * as prismic from '@prismicio/client'
import { PrismicDocument, Query, RichTextField } from '@prismicio/types'

const apiEndpoint = process.env.NEXT_PUBLIC_PRISMIC_API_ENDPOINT as string
const accessToken = process.env.NEXT_PUBLIC_PRISMIC_ACCESS_TOKEN
export const prismicClient = (req?: any): prismic.Client => {
  return prismic.createClient(apiEndpoint, { ...{ accessToken, req } })
}

type PostType = 'sample-post' | 'sample-category'
const post: PostType = 'sample-post'
const category: PostType = 'sample-category'

type CategoryInterface = {
  category_name: RichTextField
  slug: RichTextField
}
type CategoryDocument = PrismicDocument<CategoryInterface>

type PostInterface = {
  title: RichTextField
  content: RichTextField
  categories: { category?: CategoryDocument }[]
}

// 多分ライブラリー側のバグ
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export type PostDocument = PrismicDocument<PostInterface>
export type PostsDocument = Query<PostDocument>
export type CategoriesDocument = Query<CategoryDocument>

export const fetchPosts = async (client: prismic.Client) => {
  const res = await client.query<PostDocument>(prismic.predicates.at('document.type', post))
  return res
}

export const fetchPost = async (client: prismic.Client, id: string) => {
  const res = await client.getByUID<PostDocument>(post, id, {
    fetchLinks: `${category}.category_name`,
  })
  return res
}

export const fetchCategories = async (client: prismic.Client) => {
  const res = await client.query<CategoryDocument>(prismic.predicates.at('document.type', category))
  return res
}
