import * as React from 'react'

import { CartPriceInfo } from '@/component/CartPriceInfo'
import { CartType, getPaymentAmount, getShippingFee, getTotalPrice } from '@/models/cart'
import { UserType } from '@/models/user'
import { submitOrder } from '@/service/orderService'

import { CartDetailInfo } from './CartDetailInfo'
import { DeliverInfo } from './DeliverInfo'

interface Props {
  cart: CartType
  user: UserType
}

export const BestConfirmTemplate: React.FC<Props> = ({ cart, user }) => {
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      submitOrder(cart.id, user)
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
        <DeliverInfo user={user} />
        <CartDetailInfo cart={cart} />
        <CartPriceInfo shippingFee={shippingFee} paymentAmount={paymentAmount} />
        <button type="submit">購入する</button>
      </form>
    </div>
  )
}
