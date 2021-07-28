import * as React from 'react'
import { cleanup, render } from '@testing-library/react'

import { ShippingFee } from './ShippingFee'

describe('ShippingFee', () => {
  afterEach(() => {
    cleanup()
  })

  it('送料0円の場合は無料と表示', () => {
    const { container, asFragment } = render(<ShippingFee shippingFee={0} />)
    expect(container.textContent).toContain('無料')
    expect(asFragment()).toMatchSnapshot()
  })

  it('送料500円の場合はそのまま表示', () => {
    const { container, asFragment } = render(<ShippingFee shippingFee={500} />)
    expect(container.textContent).toMatch(/500/)
    expect(asFragment()).toMatchSnapshot()
  })
})
