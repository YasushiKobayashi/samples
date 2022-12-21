import * as React from 'react'
import { expect, jest } from '@storybook/jest'
import { ComponentMeta, ComponentStory } from '@storybook/react'
import { userEvent, within } from '@storybook/testing-library'
import { waitFor } from '@testing-library/react'

import { InputForm } from './InputForm'

export default {
  title: 'atoms/InputForm',
  component: InputForm,
} as ComponentMeta<typeof InputForm>

const base = {
  id: 'id',
  label: 'label',
  val: '',
  onChange: jest.fn(),
}

const PrimaryTemplate: ComponentStory<typeof InputForm> = additionalProps => {
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
