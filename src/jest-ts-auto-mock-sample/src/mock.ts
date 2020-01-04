interface MockInterface {
  a: string
  b: number
}

type MockType = {
  a: string
  b: number
}

class MockClass implements MockInterface {
  public a: string
  public b: number

  public constructor(a: string, b: number) {
    this.a = a
    this.b = b
  }
}

export { MockInterface, MockType, MockClass }
