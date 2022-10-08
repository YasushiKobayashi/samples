const path = require('path')
const { execSync } = require('child_process')
const jest = require('../../jest.config')

const basePath = path.resolve(__dirname, 'src')
const stdout = execSync(`grep -ril describe ${basePath}/*`)
const targets = stdout
  .toString()
  .split('\n')
  .filter(v => v !== '')
jest.testRegex = targets.concat([jest.testRegex])
jest.testEnvironment = 'jsdom'
module.exports = jest
