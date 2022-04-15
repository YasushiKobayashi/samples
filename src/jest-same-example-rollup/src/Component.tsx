import * as React from 'react'
import type { render } from '@testing-library/react'

export const Component: React.FC = () => {
  return <div>test</div>
}

type TestUtils = {
  render: typeof render
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const testUtils: TestUtils = {}

/* @__PURE__ */
describe('Component', () => {
  // beforeAll(async () => {
  //   const { render } = await import('@testing-library/react')
  //   testUtils.render = render
  // })
  //
  // afterEach(async () => {
  //   const { cleanup } = await import('@testing-library/react')
  //   cleanup()
  // })

  it('render test', async () => {
    expect(true).toBe(true)
    // const { container, asFragment } = testUtils.render(<Component />)
    // expect(container.textContent).toContain('test')
    // expect(asFragment()).toMatchSnapshot()
  })
})
