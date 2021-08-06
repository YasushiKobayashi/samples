import * as React from 'react'
import { cleanup, fireEvent, render } from '@testing-library/react'

import { submitOrder } from '@/service/orderService'

import { BestConfirmTemplate } from './BestConfirmTemplate'

describe('BestConfirmTemplate', () => {
  beforeEach(() => {
    /* eslint-disable no-import-assign,@typescript-eslint/ban-ts-comment */
    // @ts-ignore
    submitOrder = jest.fn()
  })

  afterEach(() => {
    cleanup()
  })

  it('購入まで', () => {
    const props = {
      user: {
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
      },
      cart: {
        id: 1,
        userId: 1,
        details: [
          {
            productId: 1,
            quantity: 1,
            product: {
              id: 1,
              name: 'TypeScript入門',
              price: 3000,
            },
          },
          {
            productId: 2,
            quantity: 2,
            product: {
              id: 2,
              name: 'Python入門',
              price: 4000,
            },
          },
        ],
      },
    }
    const { container, asFragment, getByText } = render(<BestConfirmTemplate {...props} />)

    expect(container.textContent).toContain('配送先情報')
    expect(container.textContent).toContain('カート情報')
    expect(container.textContent).toContain('金額情報')

    expect(submitOrder).toHaveBeenCalledTimes(0)

    fireEvent.click(getByText('購入する'))
    expect(submitOrder).toHaveBeenCalledTimes(1)
    expect(submitOrder).toHaveBeenCalledWith(props.cart.id, props.user)

    expect(asFragment()).toMatchSnapshot()
  })
})
