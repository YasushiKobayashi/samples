const test = () => {
  return true
}

export const main = () => {
  return test()
}

describe('main', () => {
  it('test', () => {
    const res = test()
    expect(res).toBeTruthy()
  })
})
