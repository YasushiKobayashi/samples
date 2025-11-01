// This file has been automatically migrated to valid ESM format by Storybook.
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { StorybookConfig } from '@storybook/nextjs'
import path, { dirname, join } from 'path'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

const config: StorybookConfig = {
  stories: ['../src/**/*.story.@(tsx|mdx)'],

  addons: [
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-docs")
  ],

  webpackFinal: async config => {
    if (config.resolve) {
      config.resolve.plugins = [
        new TsconfigPathsPlugin({
          configFile: path.resolve(__dirname, `../tsconfig.json`),
        }),
      ]
    }
    return config
  },

  framework: {
    name: getAbsolutePath('@storybook/nextjs'),
    options: {},
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  }
}

function getAbsolutePath(value: string) {
  return dirname(require.resolve(join(value, 'package.json')))
}

export default config
