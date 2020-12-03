import { CartType } from '@/models/cart'

export const orderPost = async (cartId: CartType['id']) => {
  const method = 'POST'
  const res = await fetch(`/api/cart/${cartId}`, { method })
  return res
}
