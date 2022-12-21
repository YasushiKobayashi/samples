import * as React from 'react'
import { expect, jest } from '@storybook/jest'
import { ComponentMeta, ComponentStory } from '@storybook/react'
import { userEvent, within } from '@storybook/testing-library'
import { waitFor } from '@testing-library/react'

import { Top } from './Top'

export default {
  title: 'templates/Top',
  component: Top,
} as ComponentMeta<typeof Top>

const base = {
  submit: jest.fn(),
}

const PrimaryTemplate: ComponentStory<typeof Top> = additionalProps => {
  base.submit.mockClear()
  const props = { ...base, ...additionalProps }
  return <Top {...props} />
}
export const Primary = PrimaryTemplate.bind({})
Primary.play = async ({ canvasElement }) => {
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
}
