const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

module.exports = {
  core: {
    builder: 'webpack5',
  },
  stories: ['../src/**/*.story.@(tsx|mdx)'],
  addons: ['@storybook/addon-essentials', 'storybook-addon-turbo-build', '@storybook/addon-interactions', '@storybook/addon-a11y'],
  features: {
    interactionsDebugger: true,
  },
  webpackFinal: async config => {
    config.resolve.plugins = [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })]

    config.module.rules = [
      ...config.module.rules,
      ...[
        {
          test: /\.(ts|js|mjs)?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'esbuild-loader',
              options: {
                loader: 'ts',
                target: 'esnext',
              },
            },
          ],
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'esbuild-loader',
              options: {
                loader: 'tsx',
                target: 'esnext',
              },
            },
          ],
        },
      ],
    ]

    return config
  },
}
