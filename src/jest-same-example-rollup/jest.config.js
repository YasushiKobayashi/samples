const path = require('path')
const { execSync } = require('child_process')
const jest = require('../../jest.config')

jest.moduleNameMapper = {
  ...jest.moduleNameMapper,
  '@/(.*)$': '<rootDir>/src/$1',
}

jest.moduleFileExtensions = ['ts', 'tsx', 'js']
const basePath = path.resolve(__dirname, 'src')
const stdout = execSync(`grep -ril describe ${basePath}/*`)
const targets = stdout
  .toString()
  .split('\n')
  .filter(v => v !== '')
jest.testRegex = targets.concat([jest.testRegex])
module.exports = jest
