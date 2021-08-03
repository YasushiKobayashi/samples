import * as React from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { RichText } from 'prismic-reactjs'

import { AppStateContainer } from '@/context/AppStateContainer'
import { topService } from '@/service/topService'
import { pagesPath } from '@/utils/$path'

const Pages: React.VFC = () => {
  const { client } = AppStateContainer.useContainer()
  const { data } = useSWR('/top', () => topService(client))

  if (!data) {
    return null
  }

  const categories = data.categories.results.map(v => {
    return <li key={v.id}>{RichText.asText(v.data.category_name)}</li>
  })

  const posts = data.posts.results.map(v => {
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
      <ul>{categories}</ul>
      <h2>記事一覧</h2>
      <ul>{posts}</ul>
    </div>
  )
}

export default Pages
