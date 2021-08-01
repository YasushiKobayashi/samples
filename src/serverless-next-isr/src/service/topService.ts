import { fetchCategories, fetchPosts } from '@/repository/prismic/client'
import { DefaultClient } from '@prismicio/client/types/client'

export const topService = async (client: DefaultClient) => {
  const posts = fetchPosts(client)
  const categories = fetchCategories(client)
  const res = await Promise.all([posts, categories])
  return { posts: res[0], categories: res[1] }
}
