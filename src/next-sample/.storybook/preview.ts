import type { Preview } from '@storybook/nextjs'

const preview: Preview = {
  parameters: {
    a11y: {
      element: '#storybook-root',
      options: {},
      manual: true,
    },
  },

  tags: ['autodocs']
}

export default preview
