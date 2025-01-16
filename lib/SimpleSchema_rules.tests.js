/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai'
import { SimpleSchema } from './SimpleSchema'

describe('SimpleSchema - Rules', function () {
  it('Rules should be passed the object being validated', function () {
    const validationContext = new SimpleSchema({
      foo: {
        type: Number
      },
      bar: {
        type: Number,
        max () {
          return this.obj.foo
        }
      }
    }).newContext()

    validationContext.validate({ foo: 5, bar: 10 })
    expect(validationContext.validationErrors().length).to.equal(1)
    validationContext.validate({ foo: 10, bar: 5 })
    expect(validationContext.validationErrors().length).to.equal(0)
  })
})
