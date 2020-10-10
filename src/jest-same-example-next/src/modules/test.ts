const fn = () => {
  return true
}

export const main = () => {
  return fn()
}

/* @__TEST__ */
/* @__PURE__ */
if (process.env.NODE_ENV === 'test') {
  describe('main', () => {
    it('test', () => {
      const res = fn()
      expect(res).toBeTruthy()
    })
  })
}
