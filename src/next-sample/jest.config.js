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

module.exports = createJestConfig(jest)
