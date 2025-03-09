import * as React from 'react'
import type { Meta, StoryFn } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import * as test from '@storybook/test'
import { waitFor } from '@testing-library/react'

import { InputForm } from './InputForm'

export default {
  title: 'atoms/InputForm',
  component: InputForm,
} as Meta<typeof InputForm>

const base = {
  id: 'id',
  label: 'label',
  val: '',
  onChange: test.fn(),
}

const PrimaryTemplate: StoryFn<typeof InputForm> = additionalProps => {
  base.onChange.mockClear()
  const props = { ...base, ...additionalProps }
  return <InputForm {...props} />
}

export const Primary = PrimaryTemplate.bind({})
Primary.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await waitFor(async () => {
    await userEvent.type(canvas.getByLabelText('label'), 'v')
  })
  expect(base.onChange).toHaveBeenCalledWith('v')
}
