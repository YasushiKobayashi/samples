import * as React from 'react'

import { ShippingFee } from './ShippingFee'

interface Props {
  shippingFee: number
  paymentAmount: number
}

export const CartPriceInfo: React.FC<Props> = ({ shippingFee, paymentAmount }) => {
  return (
    <div>
      <h2>金額情報</h2>
      <h3>送料</h3>
      <p>
        <ShippingFee shippingFee={shippingFee} />
      </p>
      <h3>合計金額</h3>
      <p>{`${paymentAmount.toLocaleString()}円`}</p>
    </div>
  )
}
