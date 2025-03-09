---
to: <%= abs_path %>/<%= component_name %>.spec.tsx
---
import * as React from 'react'
import { composeStories } from '@storybook/react'
import { act, cleanup, render } from '@testing-library/react'

import { axeRunner } from '@/testUtils/axeRunner'

import * as stories from './<%= component_name %>.story'


const { Primary } = composeStories(stories)

describe('<%= path %>', () => {
  afterEach(() => {
    cleanup()
  })

  it('Snap Shot', async () => {
    const { container, asFragment } = render(<Primary />)
    expect(asFragment()).toMatchSnapshot()

    await act(async () => {
      if (Primary.play) Primary.play({ canvasElement: container })
      const results = await axeRunner(container)
      expect(results).toHaveNoViolations()
    })
  });
});
