import Router from 'next/router'

import { UserType } from '@/models/user'
import { orderPost } from '@/request/cart'

import { submitOrder } from './orderService'

jest.mock('next/router')
jest.mock('@/request/cart')

describe('orderService', () => {
  beforeEach(() => {
    Router.push = jest.fn()

    /* eslint-disable no-import-assign,@typescript-eslint/ban-ts-comment */
    // @ts-ignore
    orderPost = jest.fn()
  })

  it('購入済みユーザー', async () => {
    const user: UserType = {
      id: 1,
      name: 'Yasushi Kobayashi',
      address: {
        id: 1,
        postCode: '162-0846',
        prefecture: '東京都',
        city: '新宿区',
        address: '市谷左内町21-13',
        mansion: null,
      },
      orders: [
        {
          id: 1,
          userId: 1,
        },
      ],
    }

    await submitOrder(10, user)
    expect(orderPost).toHaveBeenCalledTimes(1)
    expect(orderPost).toHaveBeenCalledWith(10)
    expect(Router.push).toBeCalledWith('/thanks_repeater')
  })

  it('購入済みユーザー', async () => {
    const user: UserType = {
      id: 1,
      name: 'Yasushi Kobayashi',
      address: {
        id: 1,
        postCode: '162-0846',
        prefecture: '東京都',
        city: '新宿区',
        address: '市谷左内町21-13',
        mansion: null,
      },
      orders: [],
    }

    await submitOrder(11, user)
    expect(orderPost).toHaveBeenCalledTimes(1)
    expect(orderPost).toHaveBeenCalledWith(11)
    expect(Router.push).toBeCalledWith('/thanks_new_user')
  })
})
