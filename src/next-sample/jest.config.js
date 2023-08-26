const nextJest = require('next/jest')
const jest = require('../../jest.config')

const createJestConfig = nextJest({
  dir: './',
})

jest.moduleNameMapper = {
  ...jest.moduleNameMapper,
  '@/(.*)$': '<rootDir>/src/$1',
}

jest.setupFilesAfterEnv = ['./jest.setup.js']
jest.testEnvironment = 'jest-environment-jsdom'
jest.reporters = [
  'default',
  ['jest-junit', { suiteName: 'next-sample' }],
]

module.exports = createJestConfig(jest)
