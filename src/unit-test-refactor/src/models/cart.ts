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
