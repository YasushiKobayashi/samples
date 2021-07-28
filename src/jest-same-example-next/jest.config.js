const path = require('path')
const { execSync } = require('child_process')
const jest = require('../../jest.config')

// "jsx": "react"にする
jest.globals['ts-jest'] = {
  ...jest.globals['ts-jest'],
  ...{ tsconfig: 'tsconfig.jest.json' },
}

const basePath = path.resolve(__dirname, 'src')
const stdout = execSync(`grep -ril describe ${basePath}/*`)
const targets = stdout
  .toString()
  .split('\n')
  .filter(v => v !== '')
jest.testRegex = targets.concat([jest.testRegex])
module.exports = jest
