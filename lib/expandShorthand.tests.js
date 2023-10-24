/* eslint-env mocha */
import expect from 'expect'
import expandShorthand from './expandShorthand'

describe('expandShorthand', function () {
  it('test 1', function () {
    const result = expandShorthand({
      name: String,
      count: Number,
      exp: /foo/
    })

    expect(result).toEqual({
      name: {
        type: String
      },
      count: {
        type: Number
      },
      exp: {
        type: String,
        regEx: /foo/
      }
    })
  })

  it('test 2', function () {
    const result = expandShorthand({
      name: [String],
      count: [Number]
    })

    expect(result).toEqual({
      name: {
        type: Array
      },
      'name.$': {
        type: String
      },
      count: {
        type: Array
      },
      'count.$': {
        type: Number
      }
    })
  })
})
