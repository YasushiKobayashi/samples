import { AddressType } from './address'
import { OrderType } from './order'

export interface UserType {
  id: number
  name: string
  address: AddressType
  orders: OrderType[]
}

export const getUserFullAddress = (user: UserType) => {
  return `${user.address.postCode} ${user.address.prefecture}${user.address.city}${
    user.address.address
  }${user.address.mansion ?? ''}`
}
