import * as React from 'react'
import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs'
import { waitFor } from '@testing-library/react'
import { expect, userEvent, within } from 'storybook/test'
import * as test from 'storybook/test'

import { Top } from './Top'

export default {
  title: 'templates/Top',
  component: Top,
} as Meta<typeof Top>
type Story = StoryObj<typeof Top>

const base = {
  submit: test.fn(),
}

const PrimaryTemplate: StoryFn<typeof Top> = additionalProps => {
  base.submit.mockClear()
  const props = { ...base, ...additionalProps }
  return <Top {...props} />
}
export const Primary: Story = {
  render: PrimaryTemplate,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await userEvent.type(canvas.getByLabelText('First Name'), 'LeBron')
      await userEvent.type(canvas.getByLabelText('Last Name'), 'James')
      await userEvent.click(canvas.getByRole('button', { name: 'submit' }))
    })

    expect(base.submit).toHaveBeenCalledWith({
      firstName: 'LeBron',
      lastName: 'James',
    })
    expect(base.submit).toHaveBeenCalledTimes(1)
  },
}
