/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai'
import { SimpleSchema } from './SimpleSchema'

describe('SimpleSchema', function () {
  describe('oneOf', function () {
    it('allows either type', function () {
      const schema = new SimpleSchema({
        foo: SimpleSchema.oneOf(String, Number, Date)
      })

      const test1 = { foo: 1 }
      expect(function test1func () {
        schema.validate(test1)
      }).not.to.throw()
      expect(typeof test1.foo).to.equal('number')

      const test2 = { foo: 'bar' }
      expect(function test2func () {
        schema.validate(test2)
      }).not.to.throw()
      expect(typeof test2.foo).to.equal('string')

      const test3 = { foo: new Date() }
      expect(function test2func () {
        schema.validate(test3)
      }).not.to.throw()
      expect(test3.foo instanceof Date).to.equal(true)

      const test4 = { foo: false }
      expect(function test3func () {
        schema.validate(test4)
      }).to.throw()
      expect(typeof test4.foo).to.equal('boolean')
    })

    it.skip('allows either type including schemas', function () {
      const schemaOne = new SimpleSchema({
        itemRef: String,
        partNo: String
      })

      const schemaTwo = new SimpleSchema({
        anotherIdentifier: String,
        partNo: String
      })

      const combinedSchema = new SimpleSchema({
        item: SimpleSchema.oneOf(String, schemaOne, schemaTwo)
      })

      let isValid = combinedSchema.namedContext().validate({
        item: 'foo'
      })
      expect(isValid).to.equal(true)

      isValid = combinedSchema.namedContext().validate({
        item: {
          anotherIdentifier: 'hhh',
          partNo: 'ttt'
        }
      })
      expect(isValid).to.equal(true)

      isValid = combinedSchema.namedContext().validate({
        item: {
          itemRef: 'hhh',
          partNo: 'ttt'
        }
      })
      expect(isValid).to.equal(true)
    })

    it('is valid as long as one min value is met', function () {
      const schema = new SimpleSchema({
        foo: SimpleSchema.oneOf({
          type: SimpleSchema.Integer,
          min: 5
        }, {
          type: SimpleSchema.Integer,
          min: 10
        })
      })

      expect(function () {
        schema.validate({ foo: 7 })
      }).not.to.throw()
    })

    it('works when one is an array', function () {
      const schema = new SimpleSchema({
        foo: SimpleSchema.oneOf(String, Array),
        'foo.$': String
      })

      expect(function () {
        schema.validate({
          foo: 'bar'
        })
      }).not.to.throw()

      expect(function () {
        schema.validate({
          foo: 1
        })
      }).to.throw()

      expect(function () {
        schema.validate({
          foo: []
        })
      }).not.to.throw()

      expect(function () {
        schema.validate({
          foo: ['bar', 'bin']
        })
      }).not.to.throw()

      expect(function () {
        schema.validate({
          foo: ['bar', 1]
        })
      }).to.throw()
    })

    it('works when one is a schema', function () {
      const objSchema = new SimpleSchema({
        _id: String
      })

      const schema = new SimpleSchema({
        foo: SimpleSchema.oneOf(String, objSchema)
      })

      expect(function () {
        schema.validate({
          foo: 'bar'
        })
      }).not.to.throw()

      expect(function () {
        schema.validate({
          foo: 1
        })
      }).to.throw()

      expect(function () {
        schema.validate({
          foo: []
        })
      }).to.throw()

      expect(function () {
        schema.validate({
          foo: {}
        })
      }).to.throw()

      expect(function () {
        schema.validate({
          foo: {
            _id: 'ID'
          }
        })
      }).not.to.throw()
    })

    it('is invalid if neither min value is met', function () {
      const schema = new SimpleSchema({
        foo: SimpleSchema.oneOf({
          type: SimpleSchema.Integer,
          min: 5
        }, {
          type: SimpleSchema.Integer,
          min: 10
        })
      })

      expect(function () {
        schema.validate({ foo: 3 })
      }).to.throw()
    })
  })
})
