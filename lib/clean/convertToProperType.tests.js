/* eslint-env mocha */
import expect from 'expect'
import convertToProperType from './convertToProperType'

describe('convertToProperType', function () {
  it('convert string `false` to boolean value false', function () {
    expect(convertToProperType('false', Boolean)).toBe(false)
  })

  it('convert string `FALSE` to boolean value false', function () {
    expect(convertToProperType('FALSE', Boolean)).toBe(false)
  })

  it('convert string `true` to boolean value true', function () {
    expect(convertToProperType('true', Boolean)).toBe(true)
  })

  it('convert string `TRUE` to boolean value true', function () {
    expect(convertToProperType('TRUE', Boolean)).toBe(true)
  })

  it('convert number 1 to boolean value true', function () {
    expect(convertToProperType(1, Boolean)).toBe(true)
  })

  it('convert number 0 to boolean value false', function () {
    expect(convertToProperType(0, Boolean)).toBe(false)
  })

  it('don\'t convert NaN to boolean value', function () {
    expect(convertToProperType(Number('text'), Boolean)).toEqual(NaN)
  })

  it('does not try to convert null', function () {
    expect(convertToProperType(null, Array)).toBe(null)
  })
})
