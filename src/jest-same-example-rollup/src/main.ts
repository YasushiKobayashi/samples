const test = () => {
  return true
}

export const main = () => {
  return test()
}

/* @__PURE__ */
describe('main', () => {
  it('test', () => {
    const res = test()
    expect(res).toBeTruthy()
  })
})
