import * as React from 'react'
import { RichText } from 'prismic-reactjs'

import { fetchPost, PostResponse, prismicClient } from '@/repository/prismic/client'
import { GetServerSideProps } from 'next'
import { ParsedUrlQuery } from 'node:querystring'

interface Params extends ParsedUrlQuery {
  id: string
}

interface Props {
  post: PostResponse
}

export const getServerSideProps: GetServerSideProps<Props, Params> = async context => {
  const client = prismicClient()
  const post = await fetchPost(client, context.params?.id as string)
  if (post) {
    return {
      props: {
        post,
      },
    }
  }
  return { notFound: true }
}

const Pages: React.VFC<Props> = ({ post }) => {
  const categories = post.data.categories.map(v => {
    if (!v.category?.data) {
      return
    }
    return RichText.asText(v.category.data.category_name)
  })

  return (
    <div>
      <p>タイトル</p>
      <h1>{RichText.asText(post.data.title)}</h1>

      <p>記事カテゴリ</p>
      <div>{categories.join(', ')}</div>

      <p>記事詳細</p>
      <div>{RichText.render(post.data.content)}</div>
    </div>
  )
}

export default Pages
