const jest = require('../../jest.config')
const path = require('path')

jest.moduleNameMapper = {
  ...jest.moduleNameMapper,
  '@/(.*)$': '<rootDir>/src/$1',
}

jest.moduleFileExtensions = ['ts', 'tsx', 'js']
jest.testRegex = path.resolve(__dirname, 'src')
module.exports = jest
