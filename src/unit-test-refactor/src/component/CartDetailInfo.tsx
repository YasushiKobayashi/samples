import * as React from 'react'

import { CartType } from '@/models/cart'

interface Props {
  cart: CartType
}

export const CartDetailInfo: React.FC<Props> = ({ cart }) => {
  const cartInfo = cart.details.map(v => {
    return (
      <li key={`product_${v.productId}`}>
        <p>{`商品名:${v.product.name}`}</p>
        <p>{`数量:${v.quantity}個`}</p>
        <p>{`価格:${v.product.price.toLocaleString()}円`}</p>
      </li>
    )
  })

  return (
    <>
      <h2>カート情報</h2>
      <ul>{cartInfo}</ul>
    </>
  )
}
