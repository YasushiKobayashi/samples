import * as React from 'react'
import { cleanup, render } from '@testing-library/react'

import { CartPriceInfo } from './CartPriceInfo'

describe('CartPriceInfo', () => {
  afterEach(() => {
    cleanup()
  })

  it('1,1000円で送料無料', () => {
    const props = {
      shippingFee: 0,
      paymentAmount: 11000,
    }
    const { container, asFragment } = render(<CartPriceInfo {...props} />)

    expect(container.textContent).toContain('無料')
    expect(container.textContent).toContain('11,000円')
    expect(asFragment()).toMatchSnapshot()
  })
})
