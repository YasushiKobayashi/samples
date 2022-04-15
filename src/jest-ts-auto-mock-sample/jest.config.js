const jest = require('../../jest.config')

jest.moduleNameMapper = { ...jest.moduleNameMapper, '@/(.*)$': '<rootDir>/src/$1' }
jest.testEnvironment = 'jsdom'
module.exports = jest
