import * as React from 'react'
import Router from 'next/router'
import useSWR from 'swr'

import { AppStateContainer } from '@/contexts/AppStateContainer'
import { CartType } from '@/models/cart'
import { BestConfirmTemplate } from '@/component/BestConfirmTemplate'

const fetchCart = async () => {
  const res = await fetch('/api/cart.json')
  return res.json() as Promise<CartType>
}

const Pages: React.FC = () => {
  const { user } = AppStateContainer.useContainer()
  const { data: cart } = useSWR('/cart', fetchCart)

  if (!user) {
    Router.push('/login')
    return null
  }

  if (!cart) {
    return <div>loading</div>
  }

  return <BestConfirmTemplate cart={cart} user={user} />
}

export default Pages
