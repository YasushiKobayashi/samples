import * as React from 'react'
import App from 'next/app'

import { AppStateContainer } from '@/context/AppStateContainer'

export default class CustomApp extends App {
  public render() {
    const { Component, pageProps } = this.props

    return (
      <AppStateContainer.Provider>
        <Component {...pageProps} />
      </AppStateContainer.Provider>
    )
  }
}
