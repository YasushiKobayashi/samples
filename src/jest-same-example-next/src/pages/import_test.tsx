import * as React from 'react'
import type { render } from '@testing-library/react'

import { Component } from 'jest-same-example-rollup'

const Pages: React.FC = () => {
  return <Component />
}

type TestUtils = {
  render: typeof render
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const testUtils: TestUtils = {}

if (process.env.NODE_ENV === 'test') {
  /* @__PURE__ */
  describe('Component', () => {
    beforeAll(async () => {
      const { render } = await import('@testing-library/react')
      testUtils.render = render
    })

    afterEach(async () => {
      const { cleanup } = await import('@testing-library/react')
      cleanup()
    })

    it('render test', async () => {
      const { container, asFragment } = testUtils.render(<Pages />)
      expect(container.textContent).toContain('test')
      expect(asFragment()).toMatchSnapshot()
    })
  })
}

export default Pages
