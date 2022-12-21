---
to: <%= abs_path %>/<%= component_name %>.story.tsx
---
import * as React from 'react'
import { ComponentMeta, ComponentStory } from '@storybook/react'
import { userEvent, within } from '@storybook/testing-library'
import { waitFor } from '@testing-library/react'
import { jest, expect } from '@storybook/jest'

import { <%= component_name %> } from './<%= component_name %>'

export default {
  title: '<%= path %>',
  component: <%= component_name %>,
} as ComponentMeta<typeof <%= component_name %>>

const base = {
}

const PrimaryTemplate: ComponentStory<typeof <%= component_name %>> = additionalProps => {
  const props = { ...base, ...additionalProps }
  return (
    <<%= component_name %> {...props} />
  )
}
export const Primary = PrimaryTemplate.bind({})
Primary.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await waitFor(async () => {
    await userEvent.click(canvas.getByRole('button', { name: '編集' }))
  })
}
