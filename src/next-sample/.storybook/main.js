import { dirname, join } from "path";
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

module.exports = {
  stories: ['../src/**/*.story.@(tsx|mdx)'],
  addons: [
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
    getAbsolutePath("@storybook/addon-a11y"),
    '@chromatic-com/storybook'
  ],

  features: {
    interactionsDebugger: true,
  },

  webpackFinal: async config => {
    config.resolve.plugins = [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })]

    config.module.rules = [
      ...config.module.rules,
    ]

    return config
  },

  framework: {
    name: getAbsolutePath("@storybook/nextjs"),
    options: {}
  },

  docs: {
    autodocs: true
  }
}

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}
