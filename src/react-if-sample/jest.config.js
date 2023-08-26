const jest = require('../../jest.config');

jest.moduleNameMapper = { ...jest.moduleNameMapper, '@/(.*)$': '<rootDir>/src/$1' };
jest.testEnvironment = 'jsdom'
jest.reporters = [
  'default',
  ['jest-junit', { suiteName: 'next-sample' }],
]
module.exports = jest;
