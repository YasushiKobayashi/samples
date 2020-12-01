import * as React from 'react'

import { isFreeShippingFee } from '@/models/cart'

interface Props {
  shippingFee: number
}

export const ShippingFee: React.FC<Props> = ({ shippingFee }) => {
  const label = isFreeShippingFee(shippingFee) ? '無料' : `${shippingFee.toLocaleString()}円`
  return <>{label}</>
}
