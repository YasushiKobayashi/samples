import testUtils from './testUtils'

const test = () => {
  return 'test method'
}

export const main = () => {
  return test()
}

/* @__PURE__ */
describe('main', () => {
  it('test', () => {
    testUtils()
    const res = test()
    expect(res).toBeTruthy()
  })
})
