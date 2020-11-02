const fn = () => {
  return true
}

export const main = () => {
  return fn()
}

if (process.env.NODE_ENV === 'test') {
  /* @__PURE__ */
  describe('main', () => {
    it('test', () => {
      const res = fn()
      expect(res).toBeTruthy()
    })
  })
}
