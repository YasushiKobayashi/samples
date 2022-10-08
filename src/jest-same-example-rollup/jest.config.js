const path = require('path')
const { spawnSync } = require('child_process')

const jest = require('../../jest.config')

const basePath = path.resolve(__dirname, 'src')
const spawn = spawnSync(`grep -ril describe ${basePath}/*`, { shell: true })
const targets = []

if (spawn.status === 0) {
  spawn.stdout
    .toString()
    .split('\n')
    .forEach(filePath => {
      if (filePath) targets.push(filePath)
    })
} else if (spawn.status !== 1) {
  throw new Error(spawn.error.message)
}

jest.testRegex = targets.concat([jest.testRegex])
jest.testEnvironment = 'jest-environment-jsdom'
module.exports = jest
