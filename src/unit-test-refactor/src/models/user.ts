import { AddressType } from './address'
import { OrderType } from './order'

export interface UserType {
  id: number
  name: string
  address: AddressType
  orders: OrderType[]
}
