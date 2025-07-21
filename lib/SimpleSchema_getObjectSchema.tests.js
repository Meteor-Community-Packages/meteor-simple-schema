/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai'
import { SimpleSchema } from './SimpleSchema'

describe('SimpleSchema', function () {
  describe('getObjectSchema', function () {
    it('top level object', function () {
      const schema = new SimpleSchema({
        foo: Object,
        'foo.aaa': {
          type: String,
          optional: true
        },
        'foo.bbb': {
          type: Object,
          optional: true
        },
        'foo.bbb.zzz': {
          type: Number
        }
      })

      const newSchema = schema.getObjectSchema('foo')
      expect(newSchema.mergedSchema()).to.deep.equal({
        aaa: {
          type: SimpleSchema.oneOf(String),
          label: 'Aaa',
          optional: true
        },
        bbb: {
          type: SimpleSchema.oneOf(Object),
          label: 'Bbb',
          optional: true
        },
        'bbb.zzz': {
          type: SimpleSchema.oneOf(Number),
          label: 'Zzz',
          optional: false
        }
      })
    })

    it('second level object', function () {
      const schema = new SimpleSchema({
        foo: Object,
        'foo.aaa': {
          type: String,
          optional: true
        },
        'foo.bbb': {
          type: Object,
          optional: true
        },
        'foo.bbb.zzz': {
          type: Number
        }
      })

      const newSchema = schema.getObjectSchema('foo.bbb')
      expect(newSchema.mergedSchema()).to.deep.equal({
        zzz: {
          type: SimpleSchema.oneOf(Number),
          label: 'Zzz',
          optional: false
        }
      })
    })

    it('object in array', function () {
      const schema = new SimpleSchema({
        foo: Object,
        'foo.aaa': {
          type: Array,
          optional: true
        },
        'foo.aaa.$': {
          type: Object
        },
        'foo.aaa.$.zzz': {
          type: String,
          optional: true
        },
        'foo.aaa.$.yyy': {
          type: Boolean
        }
      })

      const newSchema = schema.getObjectSchema('foo.aaa.$')
      expect(newSchema.mergedSchema()).to.deep.equal({
        zzz: {
          type: SimpleSchema.oneOf(String),
          label: 'Zzz',
          optional: true
        },
        yyy: {
          type: SimpleSchema.oneOf(Boolean),
          label: 'Yyy',
          optional: false
        }
      })
    })

    it('subschema', function () {
      const schema = new SimpleSchema({
        foo: new SimpleSchema({
          aaa: {
            type: String,
            optional: true
          },
          bbb: {
            type: Object,
            optional: true
          },
          'bbb.zzz': {
            type: Number
          }
        })
      })

      const newSchema = schema.getObjectSchema('foo')
      expect(newSchema.mergedSchema()).to.deep.equal({
        aaa: {
          type: SimpleSchema.oneOf(String),
          label: 'Aaa',
          optional: true
        },
        bbb: {
          type: SimpleSchema.oneOf(Object),
          label: 'Bbb',
          optional: true
        },
        'bbb.zzz': {
          type: SimpleSchema.oneOf(Number),
          label: 'Zzz',
          optional: false
        }
      })
    })
  })
})
