const jest = require('../../jest.config')

jest.moduleNameMapper = { ...jest.moduleNameMapper, '@/(.*)$': '<rootDir>/src/$1' }

jest.globals['ts-jest'] = {
  ...jest.globals['ts-jest'],
  ...{ tsconfig: 'tsconfig.jest.json' },
}

jest.testEnvironment = 'jsdom'
module.exports = jest
