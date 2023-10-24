/* eslint-env mocha */
import expect from 'expect'
import { SimpleSchema } from './SimpleSchema'

describe('SimpleSchema', function () {
  it('omit', function () {
    const schema = new SimpleSchema({
      foo: { type: Object },
      'foo.bar': { type: String },
      fooArray: { type: Array },
      'fooArray.$': { type: Object },
      'fooArray.$.bar': { type: String }
    })

    let newSchema = schema.omit('foo')
    expect(Object.keys(newSchema.schema())).toEqual(['fooArray', 'fooArray.$', 'fooArray.$.bar'])

    newSchema = schema.omit('fooArray')
    expect(Object.keys(newSchema.schema())).toEqual(['foo', 'foo.bar'])

    newSchema = schema.omit('foo', 'fooArray')
    expect(Object.keys(newSchema.schema())).toEqual([])

    newSchema = schema.omit('blah')
    expect(Object.keys(newSchema.schema())).toEqual(['foo', 'foo.bar', 'fooArray', 'fooArray.$', 'fooArray.$.bar'])
  })
})
