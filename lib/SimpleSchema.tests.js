/* eslint-env mocha */
import expect from 'expect'
import { SimpleSchema } from './SimpleSchema'
import testSchema from './testHelpers/testSchema'
import expectValid from './testHelpers/expectValid'
import expectErrorOfTypeLength from './testHelpers/expectErrorOfTypeLength'

class CustomObject {
  constructor (obj) {
    Object.assign(this, obj)
  }

  bar () {
    return 20
  }
}

describe('SimpleSchema', function () {
  it('throws error if first argument is an array', function () {
    expect(function () {
      return new SimpleSchema([])
    }).toThrow('You may not pass an array of schemas to the SimpleSchema constructor or to extend()')
  })

  it('throws error if a key is missing type', function () {
    expect(function () {
      return new SimpleSchema({
        foo: {}
      })
    }).toThrow('Invalid definition for foo field: "type" option is required')
  })

  it('throws an explicit error if you define fields that override object methods', function () {
    expect(function () {
      return new SimpleSchema({
        valueOf: {
          type: String
        }
      })
    }).toThrow('valueOf key is actually the name of a method on Object')
  })

  it('throws a error if array item definition is missing', function () {
    expect(function () {
      return new SimpleSchema({
        someArray: Array
      })
    }).toThrow('"someArray" is Array type but the schema does not include a "someArray.$" definition for the array items')
  })

  it('does not allow prototype pollution', function () {
    const obj = {}
    expect(obj.polluted).toBe(undefined)
    const badObj = JSON.parse('{"__proto__":{"polluted":"yes"}}')
    SimpleSchema.setDefaultMessages(badObj)
    expect(obj.polluted).toBe(undefined)
  })

  describe('nesting', function () {
    it('throws an error if a nested schema defines a field that its parent also defines', function () {
      expect(function () {
        return new SimpleSchema({
          foo: new SimpleSchema({
            bar: String
          }),
          'foo.bar': String
        })
      }).toThrow()
    })

    it('expects a field with SimpleSchema type to be an object', function () {
      const schema = new SimpleSchema({
        foo: new SimpleSchema({
          bar: String
        })
      })

      const context = schema.newContext()
      context.validate({
        foo: 'string'
      })

      expect(context.validationErrors()).toEqual([
        {
          dataType: 'Object',
          name: 'foo',
          type: SimpleSchema.ErrorTypes.EXPECTED_TYPE,
          value: 'string'
        }
      ])
    })

    it('includes type validation errors from nested schemas', function () {
      const schema = new SimpleSchema({
        foo: new SimpleSchema({
          bar: String
        })
      })

      const context = schema.newContext()
      context.validate({
        foo: {
          bar: 12345
        }
      })

      expect(context.validationErrors()).toEqual([
        {
          dataType: 'String',
          name: 'foo.bar',
          type: SimpleSchema.ErrorTypes.EXPECTED_TYPE,
          value: 12345
        }
      ])
    })

    it('includes allowed value validation errors from nested schemas', function () {
      const schema = new SimpleSchema({
        foo: new SimpleSchema({
          bar: {
            type: String,
            allowedValues: ['hot']
          }
        })
      })

      const context = schema.newContext()
      context.validate({
        foo: {
          bar: 'cold'
        }
      })

      expect(context.validationErrors()).toEqual([
        {
          name: 'foo.bar',
          type: SimpleSchema.ErrorTypes.VALUE_NOT_ALLOWED,
          value: 'cold'
        }
      ])
    })

    it('includes validation errors from nested schemas when validating modifiers', function () {
      const schema = new SimpleSchema({
        foo: new SimpleSchema({
          bar: String
        })
      })

      const context = schema.newContext()
      context.validate({
        $set: {
          'foo.bar': 12345
        }
      }, { modifier: true })

      expect(context.validationErrors()).toEqual([
        {
          dataType: 'String',
          name: 'foo.bar',
          type: SimpleSchema.ErrorTypes.EXPECTED_TYPE,
          value: 12345
        }
      ])
    })

    it('validates nested requiredness', function () {
      const schema = new SimpleSchema({
        a: {
          type: new SimpleSchema({
            b: {
              type: new SimpleSchema({
                c: {
                  type: String
                }
              })
            }
          })
        }
      })

      let context = schema.newContext()
      context.validate({ a: {} })

      expect(context.validationErrors()).toEqual([
        {
          name: 'a.b',
          type: SimpleSchema.ErrorTypes.REQUIRED,
          value: undefined
        },
        {
          name: 'a.b.c',
          type: SimpleSchema.ErrorTypes.REQUIRED,
          value: undefined
        }
      ])

      context = schema.newContext()
      context.validate({ a: { b: {} } })

      expect(context.validationErrors()).toEqual([
        {
          name: 'a.b.c',
          type: SimpleSchema.ErrorTypes.REQUIRED,
          value: undefined
        }
      ])
    })

    it('issue #307 - throws an error if incorrect import results in empty object', function () {
      expect(function () {
        // Assume that default import of a file with no default export returns an empty object
        const Place = {}

        // eslint-disable-next-line no-new
        new SimpleSchema({
          places: {
            type: Array,
            label: 'Places',
            optional: true
          },
          'places.$': { type: Place }
        })
      }).toThrow('Invalid definition for places.$ field: "type" may not be an object. Change it to Object')
    })
  })

  it('Safely sets defaultValues on subschemas nested in arrays', function () {
    const nestedSchema = new SimpleSchema({
      nested: {
        type: Array
      },
      'nested.$': {
        type: new SimpleSchema({
          somethingOptional: {
            type: String,
            optional: true
          },
          somethingAutovalued: {
            type: String,
            optional: false,
            defaultValue: 'x'
          }
        })
      }
    })

    const context = nestedSchema.newContext()
    const cleaned = context.clean({
      $set: {
        nested: [
          { somethingOptional: 'q' },
          { somethingOptional: 'z' }
        ]
      }
    }, { modifier: true })

    expect(cleaned).toEqual({
      $set: {
        nested: [
          { somethingAutovalued: 'x', somethingOptional: 'q' },
          { somethingAutovalued: 'x', somethingOptional: 'z' }
        ]
      }
    })
  })

  it('Issue #123', function () {
    // With $set
    const userSchema = new SimpleSchema({
      profile: {
        type: Object
      },
      'profile.name': {
        type: String
      }
    })

    const context = userSchema.namedContext()

    expect(context.validate({
      $set: {
        profile: {}
      }
    }, { modifier: true })).toBe(false)

    // With $push
    const userSchema2 = new SimpleSchema({
      profile: {
        type: Array
      },
      'profile.$': {
        type: Object
      },
      'profile.$.name': {
        type: String
      }
    })

    const context2 = userSchema2.namedContext()

    expect(context2.validate({
      $push: {
        profile: {}
      }
    }, { modifier: true })).toBe(false)
  })

  it('validate object with prototype', function () {
    const schema = new SimpleSchema({
      foo: { type: SimpleSchema.Integer }
    })

    const testObj = new CustomObject({ foo: 1 })

    const context = schema.namedContext()
    expect(context.validate(testObj)).toBe(true)
    expect(testObj instanceof CustomObject).toBe(true)

    testObj.foo = 'not a number'
    expect(context.validate(testObj)).toBe(false)
  })

  it('validate object with prototype within normal object', function () {
    const schema = new SimpleSchema({
      customObject: Object,
      'customObject.foo': SimpleSchema.Integer
    })

    const customObject = new CustomObject({ foo: 1 })
    const testObj = {
      customObject
    }

    const context = schema.namedContext()
    expect(context.validate(testObj)).toBe(true)
    expect(testObj.customObject instanceof CustomObject).toBe(true)

    testObj.customObject.foo = 'not a number'
    expect(context.validate(testObj)).toBe(false)
  })

  it('allowsKey', function () {
    function run (key, allowed) {
      expect(testSchema.allowsKey(key)).toBe(allowed)
    }

    run('minMaxString', true)
    run('minMaxString.$', false)
    run('minMaxString.$.foo', false)
    run('minMaxString.$foo', false)
    run('minMaxString.foo', false)
    run('sub', true)
    run('sub.number', true)
    run('sub.number.$', false)
    run('sub.number.$.foo', false)
    run('sub.number.$foo', false)
    run('sub.number.foo', false)
    run('minMaxStringArray', true)
    run('minMaxStringArray.$', true)
    run('minMaxStringArray.$.foo', false)
    run('minMaxStringArray.foo', false)
    run('customObject', true)
    run('customObject.$', false)
    run('customObject.foo', true)
    run('customObject.foo.$', true)
    run('customObject.foo.$foo', true)
    run('customObject.foo.$.$foo', true)
    run('blackBoxObject', true)
    run('blackBoxObject.$', false)
    run('blackBoxObject.foo', true)
    run('blackBoxObject.foo.$', true)
    run('blackBoxObject.foo.$foo', true)
    run('blackBoxObject.foo.$.$foo', true)
    run('blackBoxObject.foo.bar.$.baz', true)
  })

  it('allowsKey in subschema', function () {
    const schema = new SimpleSchema({
      foo: new SimpleSchema({
        bar: Object,
        'bar.baz': String
      })
    })

    expect(schema.allowsKey('foo.bar')).toBe(true)
    expect(schema.allowsKey('foo.bar.baz')).toBe(true)
    expect(schema.allowsKey('foo.bar.bum')).toBe(false)
    expect(schema.allowsKey('foo.bar.baz.bum')).toBe(false)
  })

  it('validating an object with a "length" property should not error', function () {
    const schema = new SimpleSchema({
      length: {
        type: Number,
        optional: true
      }
    })

    expect(() => {
      schema.validate({
        length: 10
      })

      schema.validate({
        $set: {
          length: 10
        }
      }, { modifier: true })
    }).toNotThrow()
  })

  it('extend with no type', function () {
    const schema = new SimpleSchema({
      name: {
        type: String,
        min: 5
      }
    })
    schema.extend({
      name: {
        max: 15
      }
    })
    expect(schema.get('name', 'max')).toBe(15)
  })

  it('this.key in label function context', function () {
    const schema = new SimpleSchema({
      items: Array,
      'items.$': {
        type: String,
        label () {
          const { key } = this
          if (!key) return 'Item'
          return `Item ${key.slice(key.lastIndexOf('.') + 1)}`
        }
      }
    })

    expect(schema.label('items.0')).toBe('Item 0')
    expect(schema.label('items.1')).toBe('Item 1')
  })

  it('keyIsInBlackBox in subschema', function () {
    const schema = new SimpleSchema({
      foo: new SimpleSchema({
        bar: {
          type: Object,
          blackbox: true
        }
      })
    })

    expect(schema.keyIsInBlackBox('foo.bar')).toBe(false)
    expect(schema.keyIsInBlackBox('foo.bar.baz')).toBe(true)
    expect(schema.keyIsInBlackBox('foo.bar.baz.$.bum')).toBe(true)
  })

  describe('blackboxKeys from subschema', function () {
    it('are correct', function () {
      const schema = new SimpleSchema({
        apple: {
          type: Object,
          blackbox: true
        },
        pear: new SimpleSchema({
          info: {
            type: Object,
            blackbox: true
          }
        })
      })

      expect(schema.blackboxKeys()).toEqual(['apple', 'pear.info'])
    })

    it('are updated after extending', function () {
      const schema = new SimpleSchema({
        apple: {
          type: Object,
          blackbox: true
        },
        pear: new SimpleSchema({
          info: {
            type: Object,
            blackbox: true
          }
        })
      })

      schema.extend({
        pear: String
      })

      expect(schema.blackboxKeys()).toEqual(['apple'])
    })
  })

  describe('extend', function () {
    it('works for plain object', function () {
      const schema = new SimpleSchema({
        firstName: {
          type: String,
          label: 'First name',
          optional: false
        },
        lastName: {
          type: String,
          label: 'Last name',
          optional: false
        }
      })

      schema.extend({
        firstName: {
          optional: true
        }
      })

      expect(schema.schema()).toEqual({
        firstName: {
          type: SimpleSchema.oneOf(String),
          label: 'First name',
          optional: true
        },
        lastName: {
          type: SimpleSchema.oneOf(String),
          label: 'Last name',
          optional: false
        }
      })
    })

    it('works for another SimpleSchema instance and copies validators', function () {
      const schema1 = new SimpleSchema({
        firstName: {
          type: String,
          label: 'First name',
          optional: false
        },
        lastName: {
          type: String,
          label: 'Last name',
          optional: false
        }
      })

      const schema2 = new SimpleSchema({
        age: {
          type: Number,
          label: 'Age'
        }
      })
      schema2.addValidator(() => {})
      schema2.addDocValidator(() => {})

      expect(schema1.schema()).toEqual({
        firstName: {
          type: SimpleSchema.oneOf(String),
          label: 'First name',
          optional: false
        },
        lastName: {
          type: SimpleSchema.oneOf(String),
          label: 'Last name',
          optional: false
        }
      })
      expect(schema1._validators.length).toBe(0)
      expect(schema1._docValidators.length).toBe(0)

      schema1.extend(schema2)

      expect(schema1.schema()).toEqual({
        firstName: {
          type: SimpleSchema.oneOf(String),
          label: 'First name',
          optional: false
        },
        lastName: {
          type: SimpleSchema.oneOf(String),
          label: 'Last name',
          optional: false
        },
        age: {
          type: SimpleSchema.oneOf(Number),
          label: 'Age',
          optional: false
        }
      })
      expect(schema1._validators.length).toBe(1)
      expect(schema1._docValidators.length).toBe(1)
    })

    it('keeps both min and max', function () {
      const schema = new SimpleSchema({
        name: {
          type: String,
          min: 5
        }
      })
      schema.extend({
        name: {
          type: String,
          max: 15
        }
      })

      expect(schema._schema.name.type.definitions[0].min).toBe(5)
      expect(schema._schema.name.type.definitions[0].max).toBe(15)
    })

    it('does not mutate a schema that is passed to extend', function () {
      const itemSchema = new SimpleSchema({
        _id: String
      })
      const mainSchema = new SimpleSchema({
        items: Array,
        'items.$': itemSchema
      })

      const item2Schema = new SimpleSchema({
        blah: String
      })
      const main2Schema = new SimpleSchema({
        items: Array,
        'items.$': item2Schema
      })

      new SimpleSchema({}).extend(mainSchema).extend(main2Schema)

      expect(mainSchema._schema['items.$'].type.definitions[0].type._schemaKeys).toEqual(['_id'])
    })

    it('can extend array definition only, without array item definition', function () {
      const schema = new SimpleSchema({
        myArray: {
          type: Array
        },
        'myArray.$': {
          type: String,
          allowedValues: ['foo', 'bar']
        }
      })

      expect(schema._schema.myArray.type.definitions[0].minCount).toBe(undefined)

      schema.extend({
        myArray: {
          minCount: 1
        }
      })

      expect(schema._schema.myArray.type.definitions[0].minCount).toBe(1)
    })

    it('tests requiredness on fields added through extension', function () {
      const subitemSchema = new SimpleSchema({
        name: String
      })

      const itemSchema = new SimpleSchema({
        name: String,
        subitems: {
          type: Array,
          optional: true
        },
        'subitems.$': {
          type: subitemSchema
        }
      })

      const schema = new SimpleSchema({
        name: String,
        items: {
          type: Array,
          optional: true
        },
        'items.$': {
          type: itemSchema
        }
      })

      subitemSchema.extend({
        other: String
      })

      expectErrorOfTypeLength(SimpleSchema.ErrorTypes.REQUIRED, schema, {
        name: 'foo',
        items: [{
          name: 'foo',
          subitems: [{
            name: 'foo'
          }]
        }]
      }).toBe(1)
    })
  })

  it('empty required array is valid', function () {
    const schema = new SimpleSchema({
      names: { type: Array },
      'names.$': { type: String }
    })

    expectValid(schema, {
      names: []
    })
  })

  it('null in array is not valid', function () {
    const schema = new SimpleSchema({
      names: { type: Array },
      'names.$': { type: String }
    })

    expectErrorOfTypeLength(SimpleSchema.ErrorTypes.EXPECTED_TYPE, schema, {
      names: [null]
    })
  })

  it('null is valid for optional', function () {
    const schema = new SimpleSchema({
      test: { type: String, optional: true }
    })

    expectValid(schema, {
      test: null
    })
  })

  it('issue 360', function () {
    const schema = new SimpleSchema({
      emails: {
        type: Array
      },
      'emails.$': {
        type: Object
      },
      'emails.$.address': {
        type: String,
        regEx: SimpleSchema.RegEx.Email
      },
      'emails.$.verified': {
        type: Boolean
      }
    })

    expectErrorOfTypeLength(SimpleSchema.ErrorTypes.EXPECTED_TYPE, schema, {
      emails: [
        {
          address: 12321,
          verified: 'asdasd'
        }
      ]
    }, { keys: ['emails'] }).toBe(2)

    expectErrorOfTypeLength(SimpleSchema.ErrorTypes.EXPECTED_TYPE, schema, {
      emails: [
        {
          address: 12321,
          verified: 'asdasd'
        }
      ]
    }, { keys: ['emails.0'] }).toBe(2)
  })

  it('ignore option', function () {
    const schema = new SimpleSchema({
      foo: { type: String, optional: true }
    })

    expectValid(schema, {
      foo: 'bar'
    })

    expectValid(schema, {
      foo: 'bar'
    }, {
      ignore: [SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA]
    })

    expectValid(schema, {
      foo: 'bar'
    }, {
      keys: ['foo'],
      ignore: [SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA]
    })

    expectErrorOfTypeLength(SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA, schema, {
      bar: 'foo'
    })

    expectValid(schema, {
      bar: 'foo'
    }, {
      ignore: [SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA]
    })

    expectValid(schema, {
      bar: 'foo'
    }, {
      keys: ['bar'],
      ignore: [SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA]
    })
  })

  it('ClientError', function () {
    const schema = new SimpleSchema({
      int: SimpleSchema.Integer,
      string: String
    })

    function verify (error) {
      expect(error.name).toBe('ClientError')
      expect(error.errorType).toBe('ClientError')
      expect(error.error).toBe('validation-error')
      expect(error.details.length).toBe(2)
      expect(error.details[0].name).toBe('int')
      expect(error.details[0].type).toBe(SimpleSchema.ErrorTypes.EXPECTED_TYPE)
      expect(error.details[0].message).toBe('Int must be of type Integer')
      expect(error.details[1].name).toBe('string')
      expect(error.details[1].type).toBe(SimpleSchema.ErrorTypes.REQUIRED)
      expect(error.details[1].message).toBe('String is required')

      // In order for the message at the top of the stack trace to be useful,
      // we set it to the first validation error message.
      expect(error.reason, 'Int must be of type Integer')
      expect(error.message, 'Int must be of type Integer [validation-error]')
    }

    try {
      schema.validate({ int: '5' })
    } catch (error) {
      verify(error)
    }

    try {
      SimpleSchema.validate({ int: '5' }, schema)
    } catch (error) {
      verify(error)
    }

    try {
      SimpleSchema.validate({ int: '5' }, {
        int: SimpleSchema.Integer,
        string: String
      })
    } catch (error) {
      verify(error)
    }

    try {
      schema.validator()({ int: '5' })
    } catch (error) {
      verify(error)
    }

    expect(function () {
      schema.validator({ clean: true })({ int: '5', string: 'test' })
    }).toNotThrow()
  })

  it('getFormValidator', function () {
    const schema = new SimpleSchema({
      int: SimpleSchema.Integer,
      string: String
    })

    return Promise.all([
      schema.getFormValidator()({ int: '5' }).then((errors) => {
        expect(errors).toEqual([
          {
            dataType: 'Integer',
            message: 'Int must be of type Integer',
            name: 'int',
            type: 'expectedType',
            value: '5'
          },
          {
            message: 'String is required',
            name: 'string',
            type: 'required',
            value: undefined
          }
        ])
      }),
      schema.getFormValidator({ clean: true })({ int: '5', string: 'test' }).then((errors) => {
        expect(errors).toEqual([])
      })
    ])
  })

  it('validate takes an array', function () {
    const schema = new SimpleSchema({
      int: SimpleSchema.Integer,
      string: String
    })

    function verify (error) {
      expect(error.name).toBe('ClientError')
      expect(error.errorType).toBe('ClientError')
      expect(error.error).toBe('validation-error')
      expect(error.details.length).toBe(2)
      expect(error.details[0].name).toBe('int')
      expect(error.details[0].type).toBe(SimpleSchema.ErrorTypes.EXPECTED_TYPE)
      expect(error.details[1].name).toBe('string')
      expect(error.details[1].type).toBe(SimpleSchema.ErrorTypes.REQUIRED)

      // In order for the message at the top of the stack trace to be useful,
      // we set it to the first validation error message.
      expect(error.reason, 'Int must be of type Integer')
      expect(error.message, 'Int must be of type Integer [validation-error]')
    }

    try {
      schema.validate([{ int: 5, string: 'test' }, { int: '5' }])
    } catch (error) {
      verify(error)
    }

    try {
      SimpleSchema.validate([{ int: 5, string: 'test' }, { int: '5' }], schema)
    } catch (error) {
      verify(error)
    }

    try {
      SimpleSchema.validate([{ int: 5, string: 'test' }, { int: '5' }], {
        int: SimpleSchema.Integer,
        string: String
      })
    } catch (error) {
      verify(error)
    }

    try {
      schema.validator()([{ int: 5, string: 'test' }, { int: '5' }])
    } catch (error) {
      verify(error)
    }
  })

  it('validationErrorTransform', function () {
    const schema = new SimpleSchema({
      string: String
    })

    SimpleSchema.defineValidationErrorTransform((error) => {
      error.message = 'validationErrorTransform'
      return error
    })

    try {
      schema.validate({})
    } catch (e) {
      expect(e.message).toBe('validationErrorTransform')
    }

    // Don't mess up other tests
    SimpleSchema.validationErrorTransform = null
  })

  it('SimpleSchema.addDocValidator', function () {
    const schema = new SimpleSchema({
      string: String
    })

    const errorArray = [
      { name: 'firstName', type: 'TOO_SILLY', value: 'Reepicheep' }
    ]
    const validatedObject = {
      string: 'String'
    }

    SimpleSchema.addDocValidator((obj) => {
      expect(obj).toEqual(validatedObject)
      return errorArray
    })

    const context = schema.newContext()
    context.validate(validatedObject)

    expect(context.validationErrors()).toEqual(errorArray)

    // Don't mess up other tests
    SimpleSchema._docValidators = []
  })

  it('SimpleSchema.constructorOptionDefaults', function () {
    const initialDefaults = SimpleSchema.constructorOptionDefaults()

    // Default defaults
    expect(initialDefaults).toEqual({
      clean: {
        autoConvert: true,
        extendAutoValueContext: {},
        filter: true,
        getAutoValues: true,
        removeEmptyStrings: true,
        removeNullsFromArrays: false,
        trimStrings: true
      },
      humanizeAutoLabels: true,
      requiredByDefault: true
    })

    // Verify they are actually used
    const schema = new SimpleSchema()
    expect(schema._constructorOptions.humanizeAutoLabels).toBe(true)
    expect(schema._cleanOptions.filter).toBe(true)

    // Change some
    SimpleSchema.constructorOptionDefaults({
      humanizeAutoLabels: false,
      clean: {
        filter: false
      }
    })

    // Verify they are changed
    const newDefaults = SimpleSchema.constructorOptionDefaults()
    expect(newDefaults).toEqual({
      clean: {
        autoConvert: true,
        extendAutoValueContext: {},
        filter: false,
        getAutoValues: true,
        removeEmptyStrings: true,
        removeNullsFromArrays: false,
        trimStrings: true
      },
      humanizeAutoLabels: false,
      requiredByDefault: true
    })

    // Verify they are actually used
    const otherSchema = new SimpleSchema()
    expect(otherSchema._constructorOptions.humanizeAutoLabels).toBe(false)
    expect(otherSchema._cleanOptions.filter).toBe(false)

    // Don't mess up other tests
    SimpleSchema.constructorOptionDefaults(initialDefaults)
  })

  it('addDocValidator', function () {
    const schema = new SimpleSchema({
      string: String
    })

    const errorArray = [
      { name: 'firstName', type: 'TOO_SILLY', value: 'Reepicheep' }
    ]
    const validatedObject = {
      string: 'String'
    }

    schema.addDocValidator((obj) => {
      expect(obj).toEqual(validatedObject)
      return errorArray
    })

    const context = schema.newContext()
    context.validate(validatedObject)

    expect(context.validationErrors()).toEqual(errorArray)
  })

  describe('objectKeys', function () {
    it('gets objectKeys', function () {
      const schema = new SimpleSchema({
        a: Object,
        'a.b': Object,
        'a.b.c': Array,
        'a.b.c.$': Object,
        'a.b.c.$.d': Object,
        'a.b.c.$.d.e': String
      })

      expect(schema.objectKeys()).toEqual(['a'])
      expect(schema.objectKeys('a')).toEqual(['b'])
      expect(schema.objectKeys('a.b')).toEqual(['c'])
      expect(schema.objectKeys('a.b.c')).toEqual([])
      expect(schema.objectKeys('a.b.c.$')).toEqual(['d'])
      expect(schema.objectKeys('a.b.c.$.d')).toEqual(['e'])
    })

    it('gets subschema objectKeys', function () {
      const schema = new SimpleSchema({
        a: {
          type: new SimpleSchema({
            b: {
              type: new SimpleSchema({
                c: {
                  type: String
                }
              })
            }
          })
        }
      })

      expect(schema.objectKeys('a')).toEqual(['b'])
      expect(schema.objectKeys('a.b')).toEqual(['c'])
    })

    it('gets correct objectKeys from extended subschemas', function () {
      const itemSchema = new SimpleSchema({
        name: String
      })

      const schema = new SimpleSchema({
        name: String,
        item: itemSchema
      })

      itemSchema.extend({
        other: String
      })

      expect(schema.objectKeys()).toEqual(['name', 'item'])
      expect(schema.objectKeys('item')).toEqual(['name', 'other'])
    })
  })

  it('gets schema property by key', function () {
    const schema = new SimpleSchema({
      a: {
        type: new SimpleSchema({
          b: {
            type: new SimpleSchema({
              c: {
                type: String,
                defaultValue: 'abc'
              }
            }),
            defaultValue: 'ab'
          },
          d: SimpleSchema.oneOf({
            type: Array,
            minCount: 0,
            maxCount: 3
          }, {
            type: SimpleSchema.Integer,
            min: 0
          }),
          'd.$': String
        })
      }
    })

    expect(schema.get('a', 'defaultValue')).toBe(undefined)
    expect(schema.get('a.b', 'defaultValue')).toBe('ab')
    expect(schema.get('a.d', 'maxCount')).toBe(3)
  })

  it('exposes defaultValue for a key', function () {
    const schema = new SimpleSchema({
      a: {
        type: new SimpleSchema({
          b: {
            type: new SimpleSchema({
              c: {
                type: String,
                defaultValue: 'abc'
              }
            }),
            defaultValue: 'ab'
          }
        })
      }
    })

    expect(schema.defaultValue('a')).toBe(undefined)
    expect(schema.defaultValue('a.b')).toBe('ab')
    expect(schema.defaultValue('a.b.c')).toBe('abc')
  })

  it('issue #232', function () {
    let foo

    expect(function () {
      const schema3 = new SimpleSchema({
        foo: String
      })

      const schema2 = new SimpleSchema({
        field2: {
          type: Array,
          optional: true
        },
        'field2.$': schema3
      })

      foo = new SimpleSchema({
        field1: {
          type: schema2,
          defaultValue: {}
        }
      })
    }).toNotThrow()

    expect(foo instanceof SimpleSchema).toBe(true)
  })

  it('issue #390 - Should get null rawDefinition if keepRawDefiniton is false', function () {
    const foo = new SimpleSchema({
      foo: String
    })
    expect(foo instanceof SimpleSchema).toBe(true)
    expect(foo.rawDefinition).toEqual(null)
  })

  it('issue #390 - Should get rawDefinition if keepRawDefiniton is true', function () {
    const foo = new SimpleSchema({
      foo: String
    }, { keepRawDefinition: true })
    expect(foo instanceof SimpleSchema).toBe(true)
    expect(foo.rawDefinition).toEqual({ foo: String })
  })

  it('$currentDate Date validation', function () {
    const schema = new SimpleSchema({
      date: Date
    })
    const context = schema.namedContext()

    let testModifer = {
      $currentDate: {
        date: true
      }
    }
    expect(context.validate(testModifer, { modifier: true })).toBe(true)

    testModifer = {
      $currentDate: {
        date: { $type: 'date' }
      }
    }
    context.validate(testModifer, { modifier: true })
    expect(context.validate(testModifer, { modifier: true })).toBe(true)

    // timestamp fails because it would save a MongoDB.Timestamp value into a Date field
    testModifer = {
      $currentDate: {
        date: { $type: 'timestamp' }
      }
    }
    expect(context.validate(testModifer, { modifier: true })).toBe(false)
  })

  describe('SimpleSchema.Any', function () {
    const schema = new SimpleSchema({
      testAny: SimpleSchema.Any
    })
    describe('can be used to allow a key with type', function () {
      const dataTypes = [
        ["String 'string'", 'string'],
        ['Number 42', 42],
        ['Number 3.1415', 3.1415],
        ['Array []', []],
        ["Array ['string']", ['string']],
        ['Object { }', { }],
        ['Object { test: true }', { test: true }],
        ['Number NaN', NaN],
        ['Date new Date()', new Date()],
        ['Boolean true', true],
        ['Boolean false', false]
      ]

      dataTypes.forEach(([label, type]) => {
        describe(label, function () {
          it("on it's own", function () {
            expectValid(schema, { testAny: type })
          })

          it('as a nested key', function () {
            expectValid(
              new SimpleSchema({ testNested: schema }),
              { testNested: { testAny: { test: type } } }
            )
          })
        })
      })
    })

    describe('with modifiers', function () {
      const shouldBeValidModifiers = [
        '$set',
        '$setOnInsert',
        '$inc',
        '$dec',
        '$min',
        '$max',
        '$mul',
        '$pop',
        '$pull',
        '$pullAll'
      ]
      shouldBeValidModifiers.forEach((mod) => {
        describe(mod, function () {
          it(`can be used for ${mod} modifiers`, function () {
            expectValid(
              schema,
              { [mod]: { testAny: 3.1415 } },
              { modifier: true }
            )
          })
          it(`can be used for nested ${mod} modifiers`, function () {
            const parentSchema = new SimpleSchema({ parent: schema })
            expectValid(
              parentSchema,
              { [mod]: { parent: { testAny: 3.1415 } } },
              { modifier: true }
            )
          })
          it(`can be used for nested ${mod} modifiers with dot notation`, function () {
            const parentSchema = new SimpleSchema({ parent: schema })
            expectValid(
              parentSchema,
              { [mod]: { 'parent.testAny': 3.1415 } },
              { modifier: true }
            )
          })
        })
      })

      // Special cases where we don't expect it to work like the rest:
      describe('$unset', function () {
        it('can be used for $unset modifiers', function () {
          expectErrorOfTypeLength(
            SimpleSchema.ErrorTypes.REQUIRED,
            schema,
            { $unset: { testAny: 1 } },
            { modifier: true }
          ).toEqual(1)
        })
        it('can be used for nested $unset modifiers', function () {
          const parentSchema = new SimpleSchema({ parent: schema })
          expectErrorOfTypeLength(
            SimpleSchema.ErrorTypes.REQUIRED,
            parentSchema,
            { $unset: { parent: 1 } },
            { modifier: true }
          ).toEqual(1)
        })
        it('can be used for nested $unset modifiers with dot notation', function () {
          const parentSchema = new SimpleSchema({ parent: schema })
          expectErrorOfTypeLength(
            SimpleSchema.ErrorTypes.REQUIRED,
            parentSchema,
            { $unset: { 'parent.testAny': 1 } },
            { modifier: true }
          ).toEqual(1)
        })
      })
      describe('$addToSet', function () {
        it('can be used for $addToSet modifiers', function () {
          expectValid(
            schema,
            { $addToSet: { testAny: 1 } },
            { modifier: true }
          )
        })
        it('can be used for nested $addToSet modifiers with dot notation', function () {
          const parentSchema = new SimpleSchema({ parent: schema })
          expectValid(
            parentSchema,
            { $addToSet: { 'parent.testAny': 3.1415 } },
            { modifier: true }
          )
        })
      })
      describe('$push', function () {
        it('can be used for $push modifiers', function () {
          expectValid(
            schema,
            { $push: { testAny: 1 } },
            { modifier: true }
          )
        })
        it('can be used for nested $push modifiers with dot notation', function () {
          const parentSchema = new SimpleSchema({ parent: schema })
          expectValid(
            parentSchema,
            { $push: { 'parent.testAny': 3.1415 } },
            { modifier: true }
          )
        })
      })
    })
  })
})
