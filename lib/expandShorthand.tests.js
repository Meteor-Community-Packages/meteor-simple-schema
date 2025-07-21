/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai'
import expandShorthand from './expandShorthand'

describe('expandShorthand', function () {
  it('test 1', function () {
    const result = expandShorthand({
      name: String,
      count: Number,
      exp: /foo/
    })

    expect(result).to.deep.equal({
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

    expect(result).to.deep.equal({
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
