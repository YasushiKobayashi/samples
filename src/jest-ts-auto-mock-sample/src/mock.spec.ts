import { createMock } from 'ts-auto-mock'

import { MockInterface, MockType, MockClass } from './mock'

describe('Mock test', () => {
  it('MockInterface', () => {
    const testA = 'testA'
    const mock = createMock<MockInterface>({
      a: testA,
    })
    expect(mock.a).toBe(testA)
    expect(mock.b).toBe(0)
  })

  it('MockType', () => {
    const testA = 'testA'
    const testB = 2020
    const mock = createMock<MockType>({
      a: testA,
      b: testB,
    })
    expect(mock.a).toBe(testA)
    expect(mock.b).toBe(testB)
  })

  it('MockClass', () => {
    const testA = 'testA'
    const testB = 2020
    const mock = createMock<MockClass>(new MockClass(testA, testB))
    expect(mock.a).toBe(testA)
    expect(mock.b).toBe(testB)
  })
})
