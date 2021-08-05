import * as React from 'react'
import Link from 'next/link'
import { GetStaticProps } from 'next'
import { RichText } from 'prismic-reactjs'

import { topService } from '@/service/topService'
import { pagesPath } from '@/utils/$path'
import { CategoriesResponse, PostsResponse, prismicClient } from '@/repository/prismic/client'

interface Props {
  posts: PostsResponse
  categories: CategoriesResponse
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const client = prismicClient()
  const { posts, categories } = await topService(client)
  return {
    props: {
      posts,
      categories,
    },
    revalidate: 60,
  }
}

const Pages: React.VFC<Props> = ({ posts, categories }) => {
  const categoryList = categories.results.map(v => {
    return <li key={v.id}>{RichText.asText(v.data.category_name)}</li>
  })

  const postList = posts.results.map(v => {
    return (
      <li key={v.id}>
        <Link href={pagesPath.posts._id(v.uid as string).$url()}>
          <a>{RichText.asText(v.data.title)}</a>
        </Link>
      </li>
    )
  })

  return (
    <div>
      <h2>カテゴリ一覧</h2>
      <ul>{categoryList}</ul>
      <h2>記事一覧</h2>
      <ul>{postList}</ul>
    </div>
  )
}

export default Pages
