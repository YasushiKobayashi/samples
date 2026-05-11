import type { Preview } from '@storybook/react-vite'
import { initialize, mswLoader } from 'msw-storybook-addon'

initialize({ onUnhandledRequest: 'bypass' })

const preview: Preview = {
  parameters: {
    a11y: { element: '#storybook-root', options: {}, manual: true },
  },
  loaders: [mswLoader],
  tags: ['autodocs'],
}

export default preview
