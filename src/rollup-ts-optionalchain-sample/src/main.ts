interface Main {
  name: string
  bar?: {
    name: string
    baz?: {
      name: string
    }
  }
}

const main: Main = { name: 'name', bar: { name: 'bar', baz: { name: 'baz' } } }
console.log(main?.bar?.baz)

export { Main as default }
