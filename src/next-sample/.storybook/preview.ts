import type { Preview } from '@storybook/react'

const preview: Preview = {
  parameters: {
    a11y: {
      element: '#storybook-root',
      options: {},
      manual: true,
    },
  },
}

export default preview
