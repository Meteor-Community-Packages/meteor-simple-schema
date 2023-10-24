/* eslint-env mocha */
import expect from 'expect'
import getLastPartOfKey from './getLastPartOfKey'

describe('getLastPartOfKey', function () {
  it('returns the correct string for a non-array key', function () {
    expect(getLastPartOfKey('a.b.c', 'a')).toBe('b.c')
  })

  it('returns the correct string for an array key', function () {
    expect(getLastPartOfKey('a.b.$.c', 'a.b')).toBe('c')
  })
})
