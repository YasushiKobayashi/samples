import Prismic from '@prismicio/client'
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse'
import { DefaultClient } from '@prismicio/client/types/client'
import { Document } from '@prismicio/client/types/documents'
import { RichTextBlock } from 'prismic-reactjs'

const apiEndpoint = process.env.NEXT_PUBLIC_PRISMIC_API_ENDPOINT as string
const accessToken = process.env.NEXT_PUBLIC_PRISMIC_ACCESS_TOKEN
export const prismicClient = (req?: any) => {
  return Prismic.client(apiEndpoint, { ...{ accessToken, req } })
}

type PostType = 'sample-post' | 'sample-category'
const post: PostType = 'sample-post'
const category: PostType = 'sample-category'

interface CustomDocument<T> extends Document {
  data: T
}

interface CustomApiSearchResponse<T> extends ApiSearchResponse {
  results: CustomDocument<T>[]
}

interface CategoryInterface {
  category_name: RichTextBlock[]
  slug: RichTextBlock[]
}

interface PostInterface {
  title: RichTextBlock[]
  content: RichTextBlock[]
  categories: { category?: CustomDocument<CategoryInterface> }[]
}

export type PostsResponse = CustomApiSearchResponse<PostInterface>
export type PostResponse = CustomDocument<PostInterface>
export type CategoriesResponse = CustomApiSearchResponse<CategoryInterface>

export const fetchPosts = async (client: DefaultClient) => {
  const res = await client.query(Prismic.predicates.at('document.type', post))
  return res as PostsResponse
}

export const fetchPost = async (
  client: DefaultClient,
  id: string,
): Promise<PostResponse | undefined> => {
  const res = await client.getByUID(post, id, {
    fetchLinks: `${category}.category_name`,
  })
  return res
}

export const fetchCategories = async (client: DefaultClient) => {
  const res = await client.query(Prismic.predicates.at('document.type', category))
  return res as CategoriesResponse
}
