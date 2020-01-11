import Main from './main'

describe('Main test', () => {
  it('optional chain', () => {
    const name = 'name'
    const main: Main = { name, bar: { name: 'bar', baz: { name: 'baz' } } }
    console.log(main?.bar?.baz)
    expect(main.name).toBe(name)
  })
})
