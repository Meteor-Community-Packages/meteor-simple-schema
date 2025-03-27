/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai'
import { SimpleSchema } from './SimpleSchema'

describe('SimpleSchema', function () {
  it('pick', function () {
    const schema = new SimpleSchema({
      foo: { type: Object },
      'foo.bar': { type: String },
      fooArray: { type: Array },
      'fooArray.$': { type: Object },
      'fooArray.$.bar': { type: String }
    })

    let newSchema = schema.pick('foo')
    expect(Object.keys(newSchema.schema())).to.deep.equal(['foo', 'foo.bar'])

    newSchema = schema.pick('fooArray')
    expect(Object.keys(newSchema.schema())).to.deep.equal(['fooArray', 'fooArray.$', 'fooArray.$.bar'])

    newSchema = schema.pick('foo', 'fooArray')
    expect(Object.keys(newSchema.schema())).to.deep.equal(['foo', 'foo.bar', 'fooArray', 'fooArray.$', 'fooArray.$.bar'])

    newSchema = schema.pick('blah')
    expect(Object.keys(newSchema.schema())).to.deep.equal([])
  })

  it('error when you do not pick the parent', () => {
    const schema = new SimpleSchema({
      level1: { type: Object },
      'level1.level2': { type: Boolean }
    })

    expect(() => {
      schema.pick('level1.level2')
    }).to.throw('"level1.level2" is in the schema but "level1" is not')
  })
})
