/* eslint-env mocha */
import expect from 'expect'
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
    expect(Object.keys(newSchema.schema())).toEqual(['foo', 'foo.bar'])

    newSchema = schema.pick('fooArray')
    expect(Object.keys(newSchema.schema())).toEqual(['fooArray', 'fooArray.$', 'fooArray.$.bar'])

    newSchema = schema.pick('foo', 'fooArray')
    expect(Object.keys(newSchema.schema())).toEqual(['foo', 'foo.bar', 'fooArray', 'fooArray.$', 'fooArray.$.bar'])

    newSchema = schema.pick('blah')
    expect(Object.keys(newSchema.schema())).toEqual([])
  })

  it('error when you do not pick the parent', () => {
    const schema = new SimpleSchema({
      level1: { type: Object },
      'level1.level2': { type: Boolean }
    })

    expect(() => {
      schema.pick('level1.level2')
    }).toThrow('"level1.level2" is in the schema but "level1" is not')
  })
})
