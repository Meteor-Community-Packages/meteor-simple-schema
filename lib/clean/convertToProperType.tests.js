/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai'
import convertToProperType from './convertToProperType'

describe('convertToProperType', function () {
  it('convert string `false` to boolean value false', function () {
    expect(convertToProperType('false', Boolean)).to.equal(false)
  })

  it('convert string `FALSE` to boolean value false', function () {
    expect(convertToProperType('FALSE', Boolean)).to.equal(false)
  })

  it('convert string `true` to boolean value true', function () {
    expect(convertToProperType('true', Boolean)).to.equal(true)
  })

  it('convert string `TRUE` to boolean value true', function () {
    expect(convertToProperType('TRUE', Boolean)).to.equal(true)
  })

  it('convert number 1 to boolean value true', function () {
    expect(convertToProperType(1, Boolean)).to.equal(true)
  })

  it('convert number 0 to boolean value false', function () {
    expect(convertToProperType(0, Boolean)).to.equal(false)
  })

  it('don\'t convert NaN to boolean value', function () {
    expect(convertToProperType(Number('text'), Boolean)).to.deep.equal(NaN)
  })

  it('does not try to convert null', function () {
    expect(convertToProperType(null, Array)).to.equal(null)
  })
})
