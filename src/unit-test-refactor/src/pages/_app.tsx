import * as React from 'react'
import App from 'next/app'
import { NextRouter, withRouter } from 'next/router'
import useSWR from 'swr'

import { AppStateContainer } from '@/contexts/AppStateContainer'
import { UserType } from '@/models/user'

interface AppProps {
  router: NextRouter
  children: React.ReactElement
}

const fetchMe = async () => {
  const res = await fetch('/api/me.json')
  return res.json() as Promise<UserType>
}

const AppWrapper = withRouter<AppProps>(props => {
  const { user, updateUser } = AppStateContainer.useContainer()
  const { router, children } = props
  const { data: userData } = useSWR('/me', fetchMe)

  React.useEffect(() => {
    updateUser(userData)
  }, [userData, updateUser])

  if (!user) {
    return <div>loading</div>
  }

  const render = React.cloneElement(children, {
    router,
  })

  return <>{render}</>
})

export default class CustomApp extends App {
  public render() {
    const { Component, pageProps } = this.props

    return (
      <AppStateContainer.Provider>
        <AppWrapper>
          <Component {...pageProps} />
        </AppWrapper>
      </AppStateContainer.Provider>
    )
  }
}
