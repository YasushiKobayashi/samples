import Router from 'next/router'

import { CartType } from '@/models/cart'
import { UserType } from '@/models/user'
import { orderPost } from '@/request/cart'

export const submitOrder = async (cartId: CartType['id'], user: UserType) => {
  await orderPost(cartId)
  const path = user.orders.length > 0 ? '/thanks_repeater' : '/thanks_new_user'
  Router.push(path)
}
