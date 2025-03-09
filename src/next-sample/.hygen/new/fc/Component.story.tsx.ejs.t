---
to: <%= abs_path %>/<%= component_name %>.story.tsx
---
import * as React from 'react'
import { Meta, StoryFn, StoryObj } from '@storybook/react'
import { userEvent, within } from '@storybook/testing-library'
import { waitFor } from '@testing-library/react'
import { jest, expect } from '@storybook/jest'

import { <%= component_name %> } from './<%= component_name %>'

export default {
  title: '<%= path %>',
  component: <%= component_name %>,
} as Meta<typeof <%= component_name %>>
type Story = StoryObj<typeof <%= component_name %>>;

const base = {
}

const PrimaryTemplate: StoryFn<typeof <%= component_name %>> = additionalProps => {
  const props = { ...base, ...additionalProps }
  return (
    <<%= component_name %> {...props} />
  )
}

export const Primary: Story = {
  render: Template,
  play: ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const target = canvas.getByRole('hoge')
    expect(target).not.toBeNull()
  },
}
