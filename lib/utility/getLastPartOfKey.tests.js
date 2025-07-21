/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai'
import getLastPartOfKey from './getLastPartOfKey'

describe('getLastPartOfKey', function () {
  it('returns the correct string for a non-array key', function () {
    expect(getLastPartOfKey('a.b.c', 'a')).to.equal('b.c')
  })

  it('returns the correct string for an array key', function () {
    expect(getLastPartOfKey('a.b.$.c', 'a.b')).to.equal('c')
  })
})
