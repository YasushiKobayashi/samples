import * as React from 'react'
import { composeStories } from '@storybook/react'
import { act, cleanup, render } from '@testing-library/react'

import { axeRunner } from '@/testUtils/axeRunner'

import * as stories from './Top.story'

const { Primary } = composeStories(stories)

describe('templates/Top', () => {
  afterEach(() => {
    cleanup()
  })

  it('Snap Shot', async () => {
    const { container, asFragment } = render(<Primary />)
    expect(asFragment()).toMatchSnapshot()

    await act(async () => {
      if (Primary.play) Primary.play({ canvasElement: container })
      expect(await axeRunner(container)).toHaveNoViolations()
    })
  })
})
