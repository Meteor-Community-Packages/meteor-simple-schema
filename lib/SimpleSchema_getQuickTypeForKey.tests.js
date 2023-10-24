/* eslint-env mocha */
import expect from 'expect'
import { SimpleSchema } from './SimpleSchema'

describe('SimpleSchema', function () {
  describe('getQuickTypeForKey', function () {
    it('string', function () {
      const schema = new SimpleSchema({
        foo: String
      })

      const type = schema.getQuickTypeForKey('foo')
      expect(type).toBe('string')
    })

    it('number', function () {
      const schema = new SimpleSchema({
        foo: Number
      })

      const type = schema.getQuickTypeForKey('foo')
      expect(type).toBe('number')
    })

    it('int', function () {
      const schema = new SimpleSchema({
        foo: SimpleSchema.Integer
      })

      const type = schema.getQuickTypeForKey('foo')
      expect(type).toBe('number')
    })

    it('boolean', function () {
      const schema = new SimpleSchema({
        foo: Boolean
      })

      const type = schema.getQuickTypeForKey('foo')
      expect(type).toBe('boolean')
    })

    it('date', function () {
      const schema = new SimpleSchema({
        foo: Date
      })

      const type = schema.getQuickTypeForKey('foo')
      expect(type).toBe('date')
    })

    it('object', function () {
      const schema = new SimpleSchema({
        foo: Object
      })

      const type = schema.getQuickTypeForKey('foo')
      expect(type).toBe('object')
    })

    it('stringArray', function () {
      const schema = new SimpleSchema({
        foo: [String]
      })

      const type = schema.getQuickTypeForKey('foo')
      expect(type).toBe('stringArray')
    })

    it('numberArray', function () {
      const schema = new SimpleSchema({
        foo: [Number]
      })

      const type = schema.getQuickTypeForKey('foo')
      expect(type).toBe('numberArray')
    })

    it('int array', function () {
      const schema = new SimpleSchema({
        foo: [SimpleSchema.Integer]
      })

      const type = schema.getQuickTypeForKey('foo')
      expect(type).toBe('numberArray')
    })

    it('booleanArray', function () {
      const schema = new SimpleSchema({
        foo: [Boolean]
      })

      const type = schema.getQuickTypeForKey('foo')
      expect(type).toBe('booleanArray')
    })

    it('dateArray', function () {
      const schema = new SimpleSchema({
        foo: [Date]
      })

      const type = schema.getQuickTypeForKey('foo')
      expect(type).toBe('dateArray')
    })

    it('objectArray', function () {
      const schema = new SimpleSchema({
        foo: [Object]
      })

      const type = schema.getQuickTypeForKey('foo')
      expect(type).toBe('objectArray')
    })

    it('objectArray (subschema)', function () {
      const subschema = new SimpleSchema({
        bar: String
      })

      const schema = new SimpleSchema({
        foo: [subschema]
      })

      const type = schema.getQuickTypeForKey('foo')
      expect(type).toBe('objectArray')
    })
  })
})
