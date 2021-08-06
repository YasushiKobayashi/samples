import * as React from 'react'
import { GetStaticProps, NextPage } from 'next'
import Link from 'next/link'
import { RichText } from 'prismic-reactjs'
import useSWR from 'swr'

import { AppStateContainer } from '@/context/AppStateContainer'
import { CategoriesResponse, PostsResponse, prismicClient } from '@/repository/prismic/client'
import { topService } from '@/service/topService'
import { pagesPath } from '@/utils/$path'

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
    revalidate: 1,
  }
}

const Pages: NextPage<Props> = props => {
  const { client } = AppStateContainer.useContainer()
  const { data } = useSWR('/top', () => topService(client), { initialData: props })
  if (!data) {
    return null
  }

  const categoryList = data.categories.results.map(v => {
    return <li key={v.id}>{RichText.asText(v.data.category_name)}</li>
  })

  const postList = data.posts.results.map(v => {
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
