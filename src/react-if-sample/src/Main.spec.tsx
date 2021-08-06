import * as React from 'react'
import { cleanup, render } from '@testing-library/react'

import { Bad, Better, Good } from './Main'

describe('Main', () => {
  afterEach(() => {
    cleanup()
  })
  it('Bad admin', () => {
    const { container, asFragment } = render(<Bad isAdmin />)
    expect(container.textContent).toContain('adminにはこれを見せるよ')
    expect(container.textContent).toContain('adminだけこの情報も見せるよ')
    expect(container.textContent).not.toContain('userにはこっち見せるよ')
    expect(asFragment()).toMatchSnapshot()
  })

  it('Bad user', () => {
    const { container, asFragment } = render(<Bad isAdmin={false} />)
    expect(container.textContent).not.toContain('adminにはこれを見せるよ')
    expect(container.textContent).not.toContain('adminだけこの情報も見せるよ')
    expect(container.textContent).toContain('userにはこっち見せるよ')
    expect(asFragment()).toMatchSnapshot()
  })

  it('Better admin', () => {
    const { container, asFragment } = render(<Better isAdmin />)
    expect(container.textContent).toContain('adminにはこれを見せるよ')
    expect(container.textContent).not.toContain('userにはこっち見せるよ')
    expect(asFragment()).toMatchSnapshot()
  })

  it('Better user', () => {
    const { container, asFragment } = render(<Better isAdmin={false} />)
    expect(container.textContent).not.toContain('adminにはこれを見せるよ')
    expect(container.textContent).toContain('userにはこっち見せるよ')
    expect(asFragment()).toMatchSnapshot()
  })

  it('Good admin', () => {
    const { container, asFragment } = render(<Good isAdmin />)
    expect(container.textContent).toContain('adminにはこれを見せるよ')
    expect(container.textContent).not.toContain('userにはこっち見せるよ')
    expect(asFragment()).toMatchSnapshot()
  })

  it('Good user', () => {
    const { container, asFragment } = render(<Good isAdmin={false} />)
    expect(container.textContent).not.toContain('adminにはこれを見せるよ')
    expect(container.textContent).toContain('userにはこっち見せるよ')
    expect(asFragment()).toMatchSnapshot()
  })
})
