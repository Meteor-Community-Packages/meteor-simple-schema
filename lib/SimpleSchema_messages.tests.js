/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai'
import { SimpleSchema } from './SimpleSchema'

describe('SimpleSchema', function () {
  describe('messages', function () {
    it('required', function () {
      const schema = new SimpleSchema({
        foo: String
      })

      const context = schema.newContext()
      context.validate({})
      expect(context.keyErrorMessage('foo')).to.equal('Foo is required')
    })

    it('minString', function () {
      const schema = new SimpleSchema({
        foo: {
          type: String,
          min: 2
        }
      })

      const context = schema.newContext()
      context.validate({ foo: 'a' })
      expect(context.keyErrorMessage('foo')).to.equal('Foo must be at least 2 characters')
    })

    it('maxString', function () {
      const schema = new SimpleSchema({
        foo: {
          type: String,
          max: 2
        }
      })

      const context = schema.newContext()
      context.validate({ foo: 'abc' })
      expect(context.keyErrorMessage('foo')).to.equal('Foo cannot exceed 2 characters')
    })

    it('minNumber', function () {
      const schema = new SimpleSchema({
        foo: {
          type: Number,
          min: 2
        }
      })

      const context = schema.newContext()
      context.validate({ foo: 1.5 })
      expect(context.keyErrorMessage('foo')).to.equal('Foo must be at least 2')
    })

    it('maxNumber', function () {
      const schema = new SimpleSchema({
        foo: {
          type: Number,
          max: 2
        }
      })

      const context = schema.newContext()
      context.validate({ foo: 2.5 })
      expect(context.keyErrorMessage('foo')).to.equal('Foo cannot exceed 2')
    })

    it('minNumberExclusive', function () {
      const schema = new SimpleSchema({
        foo: {
          type: Number,
          min: 2,
          exclusiveMin: true
        }
      })

      const context = schema.newContext()
      context.validate({ foo: 2 })
      expect(context.keyErrorMessage('foo')).to.equal('Foo must be greater than 2')
    })

    it('maxNumberExclusive', function () {
      const schema = new SimpleSchema({
        foo: {
          type: Number,
          max: 2,
          exclusiveMax: true
        }
      })

      const context = schema.newContext()
      context.validate({ foo: 2 })
      expect(context.keyErrorMessage('foo')).to.equal('Foo must be less than 2')
    })

    it('minDate', function () {
      const schema = new SimpleSchema({
        foo: {
          type: Date,
          min: new Date(Date.UTC(2015, 11, 15, 0, 0, 0, 0))
        }
      })

      const context = schema.newContext()
      context.validate({ foo: new Date(Date.UTC(2015, 10, 15, 0, 0, 0, 0)) })
      expect(context.keyErrorMessage('foo')).to.equal('Foo must be on or after 2015-12-15')
    })

    it('maxDate', function () {
      const schema = new SimpleSchema({
        foo: {
          type: Date,
          max: new Date(Date.UTC(2015, 11, 15, 0, 0, 0, 0))
        }
      })

      const context = schema.newContext()
      context.validate({ foo: new Date(Date.UTC(2016, 1, 15, 0, 0, 0, 0)) })
      expect(context.keyErrorMessage('foo')).to.equal('Foo cannot be after 2015-12-15')
    })

    it('badDate', function () {
      const schema = new SimpleSchema({
        foo: {
          type: Date
        }
      })

      const context = schema.newContext()
      context.validate({ foo: new Date('invalid') })
      expect(context.keyErrorMessage('foo')).to.equal('Foo is not a valid date')
    })

    it('minCount', function () {
      const schema = new SimpleSchema({
        foo: {
          type: Array,
          minCount: 2
        },
        'foo.$': Number
      })

      const context = schema.newContext()
      context.validate({ foo: [1] })
      expect(context.keyErrorMessage('foo')).to.equal('You must specify at least 2 values')
    })

    it('maxCount', function () {
      const schema = new SimpleSchema({
        foo: {
          type: Array,
          maxCount: 2
        },
        'foo.$': Number
      })

      const context = schema.newContext()
      context.validate({ foo: [1, 2, 3] })
      expect(context.keyErrorMessage('foo')).to.equal('You cannot specify more than 2 values')
    })

    it('noDecimal', function () {
      const schema = new SimpleSchema({
        foo: SimpleSchema.Integer
      })

      const context = schema.newContext()
      context.validate({ foo: 1.5 })
      expect(context.keyErrorMessage('foo')).to.equal('Foo must be an integer')
    })

    it('notAllowed', function () {
      const schema = new SimpleSchema({
        foo: {
          type: String,
          allowedValues: ['a', 'b', 'c']
        }
      })

      const context = schema.newContext()
      context.validate({ foo: 'd' })
      expect(context.keyErrorMessage('foo')).to.equal('d is not an allowed value')
    })

    it('expectedType', function () {
      const schema = new SimpleSchema({
        foo: String
      })

      const context = schema.newContext()
      context.validate({ foo: 1 })
      expect(context.keyErrorMessage('foo')).to.equal('Foo must be of type String')
    })

    it('regEx built in', function () {
      const schema = new SimpleSchema({
        foo: {
          type: String,
          regEx: SimpleSchema.RegEx.Email
        }
      })

      const context = schema.newContext()
      context.validate({ foo: 'abc' })
      expect(context.keyErrorMessage('foo')).to.equal('Foo must be a valid email address')
    })

    it('regEx other', function () {
      const schema = new SimpleSchema({
        foo: {
          type: String,
          regEx: /def/g
        }
      })

      const context = schema.newContext()
      context.validate({ foo: 'abc' })
      expect(context.keyErrorMessage('foo')).to.equal('Foo failed regular expression validation')
    })

    describe('keyNotInSchema', function () {
      const schema = new SimpleSchema({
        foo: String
      })

      it('normal', function () {
        const context = schema.newContext()
        context.validate({ bar: 1 })
        expect(context.keyErrorMessage('bar')).to.equal('bar is not allowed by the schema')
      })

      it('$set', function () {
        const context = schema.newContext()
        context.validate({
          $set: {
            bar: 1
          }
        }, { modifier: true })
        expect(context.keyErrorMessage('bar')).to.equal('bar is not allowed by the schema')
      })

      it('$unset does not complain', function () {
        const context = schema.newContext()
        context.validate({
          $unset: {
            bar: ''
          }
        }, { modifier: true })
        expect(context.isValid()).to.equal(true)
      })
    })

    it('should allow labels with apostrophes ("\'") in messages', function () {
      const schema = new SimpleSchema({
        foo: {
          type: String,
          label: 'Manager/supervisor\'s name'
        }
      })

      const context = schema.newContext()
      context.validate({})
      expect(context.keyErrorMessage('foo')).to.equal('Manager/supervisor\'s name is required')
    })
  })

  describe('multipleSchema', function () {
    const schema = new SimpleSchema({
      foo: String
    })

    schema.messageBox.messages({
      en: {
        required: {
          foo: 'Your foo is required mate'
        }
      }
    })

    const schema2 = new SimpleSchema({
      foo: String,
      bar: Number
    })

    schema2.messageBox.messages({
      en: {
        required: {
          foo: 'Your bar is required for sure'
        }
      }
    })

    it('should keep message boxes separate between objects', function () {
      const context = schema.newContext()
      context.validate({})
      expect(context.keyErrorMessage('foo')).to.equal('Your foo is required mate')
    })
  })
})
