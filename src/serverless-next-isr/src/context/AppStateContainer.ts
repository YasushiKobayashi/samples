import * as React from 'react'
import { Client } from '@prismicio/client'
import { createContainer } from 'unstated-next'

import { prismicClient } from '@/repository/prismic/client'

const app = () => {
  const [client] = React.useState<Client>(prismicClient())

  return {
    client,
  }
}

export const AppStateContainer = createContainer(app)
