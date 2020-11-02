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
    '^.+\\.(j|t)s?$': 'ts-jest',
    '^.+\\.(j|t)sx?$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      compiler: 'ttypescript',
    },
  },
  verbose: true,
  testURL: 'http://localhost/',
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts?|tsx?|js?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['../../jest-setup.ts'],
}
