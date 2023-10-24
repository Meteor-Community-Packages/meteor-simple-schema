/* eslint-env mocha */
import expect from 'expect'
import { SimpleSchema } from '../SimpleSchema'

describe('defaultValue', function () {
  describe('normal objects', function () {
    it('adds default value for missing top-level simple prop', function () {
      const schema = new SimpleSchema({
        name: {
          type: String,
          defaultValue: 'Test',
          optional: true
        }
      })

      const result = schema.clean({})

      expect(result).toEqual({ name: 'Test' })
    })

    it('does not add default value for already set top-level simple prop', function () {
      const schema = new SimpleSchema({
        name: {
          type: String,
          defaultValue: 'Test',
          optional: true
        }
      })

      const result = schema.clean({ name: 'Other' })

      expect(result).toEqual({ name: 'Other' })
    })

    it('adds default value for missing top-level array prop', function () {
      const schema = new SimpleSchema({
        names: {
          type: Array,
          defaultValue: [],
          optional: true
        },
        'names.$': String
      })

      const result = schema.clean({})

      expect(result).toEqual({ names: [] })
    })

    it('does not add default value for top-level array prop that is already set', function () {
      const schema = new SimpleSchema({
        names: {
          type: Array,
          defaultValue: [],
          optional: true
        },
        'names.$': String
      })

      const result = schema.clean({ names: ['foo', 'bar'] })

      expect(result).toEqual({ names: ['foo', 'bar'] })
    })

    it('does not add defaultValue for prop in object, if object is not set', function () {
      const schema = new SimpleSchema({
        a: {
          type: Object,
          optional: true
        },
        'a.b': {
          type: String,
          defaultValue: 'Test',
          optional: true
        }
      })

      const result = schema.clean({})

      expect(result).toEqual({})
    })

    it('adds defaultValue for prop in object, if object is set in object being cleaned', function () {
      const schema = new SimpleSchema({
        a: {
          type: Object,
          optional: true
        },
        'a.b': {
          type: String,
          defaultValue: 'Test',
          optional: true
        }
      })

      const result = schema.clean({ a: {} })

      expect(result).toEqual({ a: { b: 'Test' } })
    })

    it('adds defaultValue for prop in objects within array, if object is set in object being cleaned', function () {
      const schema = new SimpleSchema({
        b: {
          type: Array,
          optional: true
        },
        'b.$': {
          type: Object
        },
        'b.$.a': {
          type: String,
          defaultValue: 'Test',
          optional: true
        }
      })

      const result = schema.clean({ b: [{}, {}] })

      expect(result).toEqual({ b: [{ a: 'Test' }, { a: 'Test' }] })
    })

    it('does not add defaultValue for prop in objects within array, if the prop is already set in object being cleaned', function () {
      const schema = new SimpleSchema({
        b: {
          type: Array,
          optional: true
        },
        'b.$': {
          type: Object
        },
        'b.$.a': {
          type: String,
          defaultValue: 'Test',
          optional: true
        }
      })

      const result = schema.clean({ b: [{ a: 'Other' }] })

      expect(result).toEqual({ b: [{ a: 'Other' }] })
    })

    it('adds defaultValue for prop in objects within array, if array and object are set by array defaultValue', function () {
      const schema = new SimpleSchema({
        b: {
          type: Array,
          optional: true,
          defaultValue: [{}, { a: 'Other' }]
        },
        'b.$': {
          type: Object
        },
        'b.$.a': {
          type: String,
          defaultValue: 'Test',
          optional: true
        }
      })

      const result = schema.clean({})

      expect(result).toEqual({ b: [{ a: 'Test' }, { a: 'Other' }] })
    })

    it('adds defaultValue for prop in object, if object is set by another defaultValue', function () {
      const schema = new SimpleSchema({
        a: {
          type: Object,
          defaultValue: {},
          optional: true
        },
        'a.b': {
          type: String,
          defaultValue: 'Test',
          optional: true
        }
      })

      const result = schema.clean({})

      expect(result).toEqual({ a: { b: 'Test' } })
    })

    it('does not add defaultValue for prop in object, if prop already has value in object being cleaned', function () {
      const schema = new SimpleSchema({
        a: {
          type: Object,
          optional: true
        },
        'a.b': {
          type: String,
          defaultValue: 'Test',
          optional: true
        }
      })

      const result = schema.clean({ a: { b: 'Other' } })

      expect(result).toEqual({ a: { b: 'Other' } })
    })

    it('adds boolean true default value', function () {
      const schema = new SimpleSchema({
        bool: {
          type: Boolean,
          defaultValue: true
        }
      })

      const result = schema.clean({})
      expect(result).toEqual({ bool: true })
    })

    it('adds boolean false default value', function () {
      const schema = new SimpleSchema({
        bool: {
          type: Boolean,
          defaultValue: false
        }
      })

      const result = schema.clean({})
      expect(result).toEqual({ bool: false })
    })
  })

  describe('modifier object', function () {
    it('adds to $set object', function () {
      const schema = new SimpleSchema({
        obj: {
          type: Object
        },
        'obj.a': {
          type: Number,
          optional: true
        },
        'obj.b': {
          type: Number,
          optional: true,
          defaultValue: 10
        }
      })

      const result = schema.clean({
        $set: {
          obj: { a: 1 }
        }
      })

      expect(result).toEqual({
        $set: {
          obj: { a: 1, b: 10 }
        }
      })
    })

    it('adds to $set object with dotted set prop', function () {
      const schema = new SimpleSchema({
        obj: {
          type: Object
        },
        'obj.a': {
          type: Object,
          optional: true
        },
        'obj.a.foo': {
          type: Number,
          optional: true,
          defaultValue: 20
        },
        'obj.b': {
          type: Number,
          optional: true,
          defaultValue: 10
        }
      })

      const result = schema.clean({
        $set: {
          'obj.a': {}
        }
      }, {
        isModifier: true,
        isUpsert: true
      })

      expect(result).toEqual({
        $set: {
          'obj.a': { foo: 20 }
        },
        $setOnInsert: {
          'obj.b': 10
        }
      })
    })

    it('adds to $set object with dotted set prop and array', function () {
      const schema = new SimpleSchema({
        obj: {
          type: Object
        },
        'obj.a': {
          type: Object,
          optional: true
        },
        'obj.a.foo': {
          type: Array,
          optional: true
        },
        'obj.a.foo.$': Object,
        'obj.a.foo.$.bar': {
          type: Number,
          optional: true,
          defaultValue: 200
        }
      })

      let result = schema.clean({
        $set: {
          'obj.a': {}
        }
      })

      expect(result).toEqual({
        $set: {
          'obj.a': {}
        }
      })

      result = schema.clean({
        $set: {
          'obj.a': { foo: [] }
        }
      })

      expect(result).toEqual({
        $set: {
          'obj.a': { foo: [] }
        }
      })

      result = schema.clean({
        $set: {
          'obj.a': { foo: [{}, {}] }
        }
      })

      expect(result).toEqual({
        $set: {
          'obj.a': { foo: [{ bar: 200 }, { bar: 200 }] }
        }
      })
    })

    it('adds a $setOnInsert if $setting a sibling prop', function () {
      const schema = new SimpleSchema({
        obj: {
          type: Object
        },
        'obj.a': {
          type: Number,
          optional: true
        },
        'obj.b': {
          type: Number,
          optional: true,
          defaultValue: 10
        },
        'obj.c': {
          type: Number,
          optional: true,
          defaultValue: 50
        }
      })

      const result = schema.clean({
        $set: {
          'obj.a': 100,
          'obj.c': 2
        }
      }, {
        isModifier: true,
        isUpsert: true
      })

      expect(result).toEqual({
        $set: {
          'obj.a': 100,
          'obj.c': 2
        },
        $setOnInsert: {
          'obj.b': 10
        }
      })
    })

    it('adds a $setOnInsert if $setting a sibling child prop', function () {
      const schema = new SimpleSchema({
        obj: {
          type: Object
        },
        'obj.a': {
          type: Object,
          optional: true
        },
        'obj.a.one': {
          type: Number,
          optional: true,
          defaultValue: 500
        },
        'obj.a.two': {
          type: Number,
          optional: true,
          defaultValue: 1000
        },
        'obj.b': {
          type: Number,
          optional: true,
          defaultValue: 10
        },
        'obj.c': {
          type: Number,
          optional: true,
          defaultValue: 50
        }
      })

      const result = schema.clean({
        $set: {
          'obj.a.one': 100
        }
      }, {
        isModifier: true,
        isUpsert: true
      })

      expect(result).toEqual({
        $set: {
          'obj.a.one': 100
        },
        $setOnInsert: {
          'obj.a.two': 1000,
          'obj.b': 10,
          'obj.c': 50
        }
      })
    })

    it('adds $setOnInsert for top-level prop', function () {
      const schema = new SimpleSchema({
        foo: {
          type: String,
          defaultValue: 'Test'
        },
        names: {
          type: Array,
          optional: true
        },
        'names.$': {
          type: String
        }
      })

      const result = schema.clean({
        $addToSet: {
          names: 'new value'
        }
      }, {
        isModifier: true,
        isUpsert: true
      })

      expect(result).toEqual({
        $addToSet: {
          names: 'new value'
        },
        $setOnInsert: {
          foo: 'Test'
        }
      })
    })

    it('adds default values to object being $pushed into array', function () {
      const schema = new SimpleSchema({
        things: Array,
        'things.$': Object,
        'things.$.a': {
          type: String,
          defaultValue: 'foo'
        },
        'things.$.b': {
          type: String,
          defaultValue: 'bar'
        }
      })

      const result = schema.clean({
        $push: {
          things: {}
        }
      })

      expect(result).toEqual({
        $push: {
          things: {
            a: 'foo',
            b: 'bar'
          }
        }
      })
    })
  })

  it('nested defaultValue for prop in obj in array', function () {
    const listItemSchema = new SimpleSchema({
      foo: {
        type: String,
        defaultValue: 'TEST',
        optional: true
      }
    })

    const detailsSchema = new SimpleSchema({
      list: {
        type: Array,
        optional: true
      },
      'list.$': listItemSchema
    })

    const schema = new SimpleSchema({
      name: String,
      details: {
        type: detailsSchema,
        optional: true
      }
    })

    const cleanedObject = schema.clean({
      name: 'NAME',
      details: {}
    })

    expect(cleanedObject).toEqual({
      name: 'NAME',
      details: {}
    })
  })

  it('issue 426', function () {
    const schema = new SimpleSchema({
      name: {
        type: String
      },
      images: {
        type: Array,
        label: 'Images',
        minCount: 0,
        defaultValue: []
      },
      'images.$': {
        type: Object,
        label: 'Image'
      }
    })

    const doc = {
      name: 'Test'
    }
    expect(schema.clean(doc)).toEqual({
      name: 'Test',
      images: []
    })
  })

  it('complex with .$. modifier', () => {
    const fooSchema = new SimpleSchema({
      bar: {
        type: String,
        optional: true,
        defaultValue: 'TEST'
      }
    })

    const itemSchema = new SimpleSchema({
      foo: {
        type: fooSchema,
        optional: true
      }
    })

    const schema = new SimpleSchema({
      items: {
        type: Array,
        optional: true
      },
      'items.$': {
        type: itemSchema
      }
    })

    let result = schema.clean({
      $set: {
        'items.$.foo': { bar: 'OTHER' }
      }
    })

    expect(result).toEqual({
      $set: {
        'items.$.foo': { bar: 'OTHER' }
      }
    })

    result = schema.clean({
      $addToSet: {
        items: {
          foo: { bar: 'OTHER' }
        }
      }
    })

    expect(result).toEqual({
      $addToSet: {
        items: {
          foo: { bar: 'OTHER' }
        }
      }
    })
  })

  it('$setOnInsert are correctly added with path notation', function () {
    const schema = new SimpleSchema({
      settings: {
        type: Object,
        optional: true,
        defaultValue: {}
      },
      'settings.bool': {
        type: Boolean,
        defaultValue: false
      },
      'settings.obj': {
        type: Object,
        optional: true,
        defaultValue: {}
      },
      'settings.obj.bool': {
        type: Boolean,
        optional: true,
        defaultValue: false
      },
      'settings.obj.name': {
        type: Boolean,
        optional: true,
        defaultValue: 'foo'
      },
      'settings.obj2': {
        type: Object,
        optional: true,
        defaultValue: {}
      },
      'settings.obj2.bool': {
        type: Boolean,
        optional: true,
        defaultValue: false
      },
      'settings.obj2.name': String
    })

    expect(schema.clean({
      $set: {
        'settings.obj.bool': true
      },
      $unset: {
        'settings.obj2.name': ''
      }
    }, {
      isModifier: true,
      isUpsert: true
    })).toEqual({
      $set: {
        'settings.obj.bool': true
      },
      $unset: {
        'settings.obj2.name': ''
      },
      $setOnInsert: {
        'settings.bool': false,
        'settings.obj.name': 'foo',
        'settings.obj2': { bool: false }
      }
    })
  })

  it('$setOnInsert are correctly added with path notation - v2', function () {
    // This is the same as the test above, except that there is no default
    // value of {} for settings.obj2 so settings.obj2.bool should not be
    // set on insert
    const schema = new SimpleSchema({
      settings: {
        type: Object,
        optional: true,
        defaultValue: {}
      },
      'settings.bool': {
        type: Boolean,
        defaultValue: false
      },
      'settings.obj': {
        type: Object,
        optional: true,
        defaultValue: {}
      },
      'settings.obj.bool': {
        type: Boolean,
        optional: true,
        defaultValue: false
      },
      'settings.obj.name': {
        type: Boolean,
        optional: true,
        defaultValue: 'foo'
      },
      'settings.obj2': {
        type: Object,
        optional: true
      },
      'settings.obj2.bool': {
        type: Boolean,
        optional: true,
        defaultValue: false
      },
      'settings.obj2.name': String
    })

    expect(schema.clean({
      $set: {
        'settings.obj.bool': true
      },
      $unset: {
        'settings.obj2.name': ''
      }
    }, {
      isModifier: true,
      isUpsert: true
    })).toEqual({
      $set: {
        'settings.obj.bool': true
      },
      $unset: {
        'settings.obj2.name': ''
      },
      $setOnInsert: {
        'settings.bool': false,
        'settings.obj.name': 'foo'
      }
    })
  })

  it('default value for sibling field added by $addToSet', function () {
    const AddressItem = new SimpleSchema({
      fullName: String,
      address1: String,
      address2: String
    })

    const Profile = new SimpleSchema({
      addressBook: {
        type: Array,
        optional: true
      },
      'addressBook.$': {
        type: AddressItem
      },
      invited: {
        type: Boolean,
        defaultValue: false
      }
    })

    const schema = new SimpleSchema({
      profile: {
        type: Profile,
        optional: true
      }
    })

    const accountsUpdateQuery = {
      $addToSet: {
        'profile.addressBook': {
          fullName: 'Sonny Hayes',
          address1: '518 Nader Rapids',
          address2: 'Apt. 893'
        }
      }
    }

    const cleanedModifier = schema.clean(accountsUpdateQuery, { isModifier: true, isUpsert: true })
    expect(cleanedModifier).toEqual({
      $addToSet: {
        'profile.addressBook': {
          fullName: 'Sonny Hayes',
          address1: '518 Nader Rapids',
          address2: 'Apt. 893'
        }
      },
      $setOnInsert: {
        'profile.invited': false
      }
    })
  })

  it('does not add $setOnInsert to modifiers normally', function () {
    const schema = new SimpleSchema({
      name: String,
      isOwner: { type: Boolean, defaultValue: true }
    })

    expect(schema.clean({
      $set: { name: 'Phil' }
    }, {
      isModifier: true
    })).toEqual({
      $set: { name: 'Phil' }
    })
  })

  it('adds $setOnInsert to modifiers when isUpsert it true', function () {
    const schema = new SimpleSchema({
      name: String,
      isOwner: { type: Boolean, defaultValue: true }
    })

    expect(schema.clean({
      $set: { name: 'Phil' }
    }, {
      isModifier: true,
      isUpsert: true
    })).toEqual({
      $set: { name: 'Phil' },
      $setOnInsert: { isOwner: true }
    })
  })
})
