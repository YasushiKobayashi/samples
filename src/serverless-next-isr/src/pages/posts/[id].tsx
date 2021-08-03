import * as React from 'react'
import useSWR from 'swr'
import { RichText } from 'prismic-reactjs'

import { AppStateContainer } from '@/context/AppStateContainer'
import { useRouter } from 'next/dist/client/router'
import { fetchPost } from '@/repository/prismic/client'

const Pages: React.VFC = () => {
  const { client } = AppStateContainer.useContainer()
  const route = useRouter()
  const { id } = route.query
  if (typeof id === 'string') {
    const { data } = useSWR(`/posts/${id}`, () => fetchPost(client, id))
    if (!data) {
      return null
    }

    const categories = data.data.categories.map(v => {
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

  return null
}

export default Pages
