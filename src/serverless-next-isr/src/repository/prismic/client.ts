import Prismic from '@prismicio/client'
import { DefaultClient } from '@prismicio/client/types/client'

const apiEndpoint = process.env.NEXT_PUBLIC_PRISMIC_API_ENDPOINT as string
const accessToken = process.env.NEXT_PUBLIC_PRISMIC_ACCESS_TOKEN
export const prismicClient = (req?: any) => {
  return Prismic.client(apiEndpoint, { ...{ accessToken, req } })
}

type PostType = 'sample-post' | 'sample-category'
const post: PostType = 'sample-post'
const category: PostType = 'sample-category'

export const fetchPosts = async (client: DefaultClient) => {
  const res = await client.query(Prismic.predicates.at('document.type', post))
  return res
}

export const fetchCategories = async (client: DefaultClient) => {
  const res = await client.query(Prismic.predicates.at('document.type', category))
  return res
}
