module.exports = {
  reporters: [
    'default',
    [
      '../../node_modules/jest-html-reporter',
      {
        pageTitle: 'Test Report',
      },
    ],
  ],
  unmockedModulePathPatterns: ['react'],
  transform: {
    '^.+\\.(j|t)s?$': [
      'esbuild-jest',
      {
        sourcemap: true,
        loaders: {
          '.spec.ts': 'ts',
          '.ts': 'ts',
          target: 'esnext',
        },
      },
    ],
    '^.+\\.(j|t)sx?$': [
      'esbuild-jest',
      {
        sourcemap: true,
        loaders: {
          '.spec.ts': 'tsx',
          '.ts': 'tsx',
          target: 'esnext',
        },
      },
    ],
  },
  verbose: true,
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts?|tsx?|js?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['../../jest-setup.ts'],
}
