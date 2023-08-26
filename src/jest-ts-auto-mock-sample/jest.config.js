const jest = require('../../jest.config')

jest.moduleNameMapper = { ...jest.moduleNameMapper, '@/(.*)$': '<rootDir>/src/$1' }

jest.transform = {
  '^.+\\.(j|t)s?$': 'ts-jest',
  '^.+\\.(j|t)sx?$': 'ts-jest',
}

jest.globals = {
  ...jest.globals,
  ...{
    'ts-jest': {
      compiler: 'ttypescript',
    },
  },
}
jest.testEnvironment = 'jest-environment-jsdom'
jest.reporters = [
  'default',
  ['jest-junit', { suiteName: 'next-sample' }],
]
module.exports = jest
