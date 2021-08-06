import * as React from 'react'
import { RichText } from 'prismic-reactjs'
import useSWR from 'swr'

import { fetchPost, PostResponse, prismicClient } from '@/repository/prismic/client'
import { GetStaticProps } from 'next'
import { ParsedUrlQuery } from 'node:querystring'
import { AppStateContainer } from '@/context/AppStateContainer'

interface Params extends ParsedUrlQuery {
  id: string
}

interface Props {
  post?: PostResponse
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

const Pages: React.VFC<Props> = ({ post }) => {
  if (!post) {
    return null
  }

  const { client } = AppStateContainer.useContainer()
  const { data } = useSWR('/post/', () => fetchPost(client, post.uid as string), {
    initialData: post,
  })
  if (!data) {
    return null
  }

  const categories = data.data.categories.map(v => {
    if (!v.category?.data) {
      return
    }
    return RichText.asText(v.category.data.category_name)
  })

  return (
    <div>
      <p>タイトル</p>
      <h1>{RichText.asText(data.data.title)}</h1>

      <p>記事カテゴリ</p>
      <div>{categories.join(', ')}</div>

      <p>記事詳細</p>
      <div>{RichText.render(data.data.content)}</div>
    </div>
  )
}

export default Pages
