import * as prismic from '@prismicio/client'

import { fetchCategories, fetchPosts } from '@/repository/prismic/client'

export const topService = async (client: prismic.Client) => {
  const posts = fetchPosts(client)
  const categories = fetchCategories(client)
  const res = await Promise.all([posts, categories])
  return { posts: res[0], categories: res[1] }
}
