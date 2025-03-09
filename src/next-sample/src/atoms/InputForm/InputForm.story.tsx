import * as React from 'react'
import type { Meta, StoryFn, StoryObj } from '@storybook/react'
import { expect, fn, userEvent, within } from '@storybook/test'
import { waitFor } from '@testing-library/react'

import { InputForm } from './InputForm'

export default {
  title: 'atoms/InputForm',
  component: InputForm,
} as Meta<typeof InputForm>
type Story = StoryObj<typeof InputForm>

const base = {
  id: 'id',
  label: 'label',
  val: '',
  onChange: fn(),
}

const PrimaryTemplate: StoryFn<typeof InputForm> = additionalProps => {
  base.onChange.mockClear()
  const props = { ...base, ...additionalProps }
  return <InputForm {...props} />
}

export const Primary: Story = {
  render: PrimaryTemplate,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await userEvent.type(canvas.getByLabelText('label'), 'v')
    })
    expect(base.onChange).toHaveBeenCalledWith('v')
  },
}
