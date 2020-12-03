import { ProductType } from './product'
import { UserType } from './user'

interface CartDetail {
  productId: ProductType['id']
  product: ProductType
  quantity: number
}

export interface CartType {
  id: number
  userId: UserType['id']
  details: CartDetail[]
}

export const getTotalPrice = (cart: CartType) => {
  return cart.details.reduce((acc, v) => {
    return acc + v.quantity * v.product.price
  }, 0)
}

const freeShippingFee = 0
export const getShippingFee = (totalPrice: number) => {
  const shippingFee = 500
  const border = 10000
  return totalPrice > border ? freeShippingFee : shippingFee
}

export const isFreeShippingFee = (shippingFee: number) => {
  return shippingFee === freeShippingFee
}

export const getPaymentAmount = (totalPrice: number, shippingFee: number) => {
  return totalPrice + shippingFee
}
