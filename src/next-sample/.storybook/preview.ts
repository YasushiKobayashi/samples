import type { Preview } from '@storybook/nextjs'
import { initialize, mswLoader } from 'msw-storybook-addon'

// msw-storybook-addon は package.json の条件分岐で
// 実行環境を自動判別する (browser → setupWorker / node → setupServer)。
// preview から initialize を呼んでおくと Storybook と vitest の両方で MSW が立ち上がる。
initialize({ onUnhandledRequest: 'bypass' })

const preview: Preview = {
  parameters: {
    a11y: {
      element: '#storybook-root',
      options: {},
      manual: true,
    },
  },

  loaders: [mswLoader],
  tags: ['autodocs'],
}

export default preview
