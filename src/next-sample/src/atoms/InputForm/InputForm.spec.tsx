import * as React from 'react'
import { composeStories } from '@storybook/react'
import { act, render } from '@testing-library/react'

import { axeRunner } from '@/testUtils/axeRunner'

import * as stories from './InputForm.story'

const { Primary } = composeStories(stories)

describe('atoms/InputForm', () => {
  it('Snap Shot', async () => {
    const { container, asFragment } = render(<Primary />)
    expect(asFragment()).toMatchSnapshot()

    await act(async () => {
      if (Primary.play) await Primary.play({ canvasElement: container })
      expect(await axeRunner(container)).toHaveNoViolations()
    })
  })
})
