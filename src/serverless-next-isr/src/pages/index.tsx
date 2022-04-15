import * as React from 'react'
import { asText } from '@prismicio/richtext'
import { GetStaticProps, NextPage } from 'next'
import Link from 'next/link'
import useSWR from 'swr'

import { AppStateContainer } from '@/context/AppStateContainer'
import { CategoriesDocument, PostsDocument, prismicClient } from '@/repository/prismic/client'
import { topService } from '@/service/topService'
import { pagesPath } from '@/utils/$path'

interface Props {
  posts: PostsDocument
  categories: CategoriesDocument
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
  const { data } = useSWR('/top', () => topService(client), { fallbackData: props })
  if (!data) {
    return null
  }

  const categoryList = data.categories.results.map(v => {
    return <li key={v.id}>{asText(v.data.category_name)}</li>
  })

  const postList = data.posts.results.map(v => {
    return (
      <li key={v.id}>
        <Link href={pagesPath.posts._id(v.uid as string).$url()}>
          <a>{asText(v.data.title)}</a>
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
