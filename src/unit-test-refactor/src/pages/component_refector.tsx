import * as React from 'react'
import Router from 'next/router'
import useSWR from 'swr'

import { AppStateContainer } from '@/contexts/AppStateContainer'
import { CartType, getPaymentAmount, getShippingFee, getTotalPrice } from '@/models/cart'
import { CartPriceInfo } from '@/component/CartPriceInfo'

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

  const cartInfo = cart.details.map(v => {
    return (
      <li key={`product_${v.productId}`}>
        <p>{`商品名:${v.product.name}`}</p>
        <p>{`数量:${v.quantity}個`}</p>
        <p>{`価格:${v.product.price.toLocaleString()}円`}</p>
      </li>
    )
  })

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const method = 'POST'
      await fetch(`/api/cart/${cart.id}`, { method })
      const path = user.orders.length > 0 ? '/thanks_repeater' : '/thanks_new_user'
      Router.push(path)
    } catch (err) {
      console.error(err)
    }
  }

  const totalPrice = getTotalPrice(cart)
  const shippingFee = getShippingFee(totalPrice)
  const paymentAmount = getPaymentAmount(totalPrice, shippingFee)

  return (
    <div>
      <form onSubmit={submit}>
        <h2>配送先情報</h2>
        <p>{`${user.name}様`}</p>
        <p>
          {`〒${user.address.postCode} ${user.address.prefecture}${user.address.city}${
            user.address.address
          }${user.address.mansion ?? ''}`}
        </p>
        <h2>カート情報</h2>
        <ul>{cartInfo}</ul>
        <CartPriceInfo shippingFee={shippingFee} paymentAmount={paymentAmount} />
        <button type="submit">購入する</button>
      </form>
    </div>
  )
}

export default Pages
