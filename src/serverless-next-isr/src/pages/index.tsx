import * as React from 'react'
import useSWR from 'swr'

import { AppStateContainer } from '@/context/AppStateContainer'
import { topService } from '@/service/topService'

const Pages: React.VFC = () => {
  const { client } = AppStateContainer.useContainer()
  const { data } = useSWR('/top', () => topService(client))

  if (!data) {
    return null
  }

  return <div>test</div>
}

export default Pages
