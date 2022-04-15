import * as React from 'react'
import { asText } from '@prismicio/richtext'
import { GetStaticProps } from 'next'
import { ParsedUrlQuery } from 'node:querystring'
import useSWR from 'swr'

import { AppStateContainer } from '@/context/AppStateContainer'
import { fetchPost, PostDocument, prismicClient } from '@/repository/prismic/client'

interface Params extends ParsedUrlQuery {
  id: string
}

interface Props {
  post?: PostDocument
}

export const getStaticPaths = async () => {
  return { paths: [], fallback: true }
}

export const getStaticProps: GetStaticProps<Props, Params> = async context => {
  const client = prismicClient()
  const post = await fetchPost(client, context.params?.id as string)
  if (!post) {
    return {
      notFound: true,
    }
  }
  return {
    props: {
      post,
    },
    revalidate: 1,
  }
}

const Pages: React.FC<Props> = ({ post }) => {
  if (!post) {
    return null
  }

  const { client } = AppStateContainer.useContainer()
  const { data } = useSWR('/post/', () => fetchPost(client, post.uid as string), {
    fallbackData: post,
  })
  if (!data) {
    return null
  }

  const categories = data.data.categories.map(v => {
    if (!v.category?.data) {
      return
    }
    return asText(v.category.data.category_name)
  })

  return (
    <div>
      <p>タイトル</p>
      <h1>{asText(data.data.title)}</h1>

      <p>記事カテゴリ</p>
      <div>{categories.join(', ')}</div>

      <p>記事詳細</p>
      <div>{asText(data.data.content)}</div>
    </div>
  )
}

export default Pages
