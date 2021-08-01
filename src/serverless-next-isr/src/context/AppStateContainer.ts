import * as React from 'react'
import { DefaultClient } from '@prismicio/client/types/client'
import { createContainer } from 'unstated-next'

import { prismicClient } from '@/repository/prismic/client'

const app = () => {
  const [client] = React.useState<DefaultClient>(prismicClient())

  return {
    client,
  }
}

export const AppStateContainer = createContainer(app)
