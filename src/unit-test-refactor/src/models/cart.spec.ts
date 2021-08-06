import { CartType, getShippingFee, getTotalPrice, isFreeShippingFee } from './cart'

describe('cart', () => {
  it('getTotalPrice', () => {
    const cart: CartType = {
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
    }
    expect(getTotalPrice(cart)).toEqual(11000)
  })

  it('getShippingFee', () => {
    expect(getShippingFee(9999)).toEqual(500)
    expect(getShippingFee(10000)).toEqual(500)
    expect(getShippingFee(0)).toEqual(500)
  })

  it('getShippingFee free', () => {
    expect(getShippingFee(10001)).toEqual(0)
  })

  it('isFreeShippingFee', () => {
    expect(isFreeShippingFee(500)).toBeFalsy()
  })

  it('isFreeShippingFee free', () => {
    expect(isFreeShippingFee(0)).toBeTruthy()
  })
})
