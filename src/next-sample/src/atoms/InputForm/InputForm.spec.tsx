import * as React from 'react'
import { composeStories } from '@storybook/react'
import { render, waitFor } from '@testing-library/react'

import { axeRunner } from '@/testUtils/axeRunner'

import * as stories from './InputForm.story'

const { Primary } = composeStories(stories)

describe('atoms/InputForm', () => {
  it('Snap Shot', async () => {
    const { container, asFragment } = render(<Primary />)
    expect(asFragment()).toMatchSnapshot()

    // Execute the play function and wait for it to complete
    if (Primary.play) {
      await Primary.play({ canvasElement: container })
    }

    // Run accessibility check after play function completes
    await waitFor(async () => {
      const results = await axeRunner(container)
      expect(results).toHaveNoViolations()
    })
  })
})
