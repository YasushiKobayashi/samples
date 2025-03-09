import { StorybookConfig } from '@storybook/nextjs'
import path, { dirname, join } from 'path'
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

const config: StorybookConfig = {
  stories: ['../src/**/*.story.@(tsx|mdx)'],
  addons: [
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-interactions'),
    getAbsolutePath('@storybook/addon-a11y'),
    '@chromatic-com/storybook',
  ],
  webpackFinal: async config => {
    if (config.resolve) {
      config.resolve.plugins = [
        new TsconfigPathsPlugin({
          configFile: path.resolve(__dirname, `./tsconfig.json`),
        }),
      ]
    }
    return config
  },
  framework: {
    name: getAbsolutePath('@storybook/nextjs'),
    options: {},
  },
  docs: {
    autodocs: true,
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
}

function getAbsolutePath(value: string) {
  return dirname(require.resolve(join(value, 'package.json')))
}

export default config
