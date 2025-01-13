/* eslint-disable func-names, prefer-arrow-callback, class-methods-use-this */

import { expect } from 'chai';
import { SimpleSchema } from './SimpleSchema';
import testSchema from './testHelpers/testSchema';
import expectValid from './testHelpers/expectValid';
import expectErrorOfTypeLength from './testHelpers/expectErrorOfTypeLength';

class CustomObject {
  constructor(obj) {
    Object.assign(this, obj);
  }

  bar() {
    return 20;
  }
}

describe('SimpleSchema', function () {
  it('throws error if first argument is an array', function () {
    expect(function () {
      return new SimpleSchema([]);
    }).to.throw('You may not pass an array of schemas to the SimpleSchema constructor or to extend()');
  });

  it('throws error if a key is missing type', function () {
    expect(function () {
      return new SimpleSchema({
        foo: {},
      });
    }).to.throw('Invalid definition for foo field: "type" option is required');
  });

  it('throws an explicit error if you define fields that override object methods', function () {
    expect(function () {
      return new SimpleSchema({
        valueOf: {
          type: String,
        },
      });
    }).to.throw('valueOf key is actually the name of a method on Object');
  });

  it('throws a error if array item definition is missing', function () {
    expect(function () {
      return new SimpleSchema({
        someArray: Array,
      });
    }).to.throw('"someArray" is Array type but the schema does not include a "someArray.$" definition for the array items');
  });

  it('does not allow prototype pollution', function () {
    const obj = {};
    expect(obj.polluted).to.equal(undefined);
    const badObj = JSON.parse('{"__proto__":{"polluted":"yes"}}');
    SimpleSchema.setDefaultMessages(badObj);
    expect(obj.polluted).to.equal(undefined);
  });

  describe('nesting', function () {
    it('throws an error if a nested schema defines a field that its parent also defines', function () {
      expect(function () {
        return new SimpleSchema({
          foo: new SimpleSchema({
            bar: String,
          }),
          'foo.bar': String,
        });
      }).to.throw();
    });

    it('expects a field with SimpleSchema type to be an object', function () {
      const schema = new SimpleSchema({
        foo: new SimpleSchema({
          bar: String,
        }),
      });

      const context = schema.newContext();
      context.validate({
        foo: 'string',
      });

      expect(context.validationErrors()).to.deep.equal([
        {
          dataType: 'Object',
          name: 'foo',
          type: SimpleSchema.ErrorTypes.EXPECTED_TYPE,
          value: 'string',
        },
      ]);
    });

    it('includes type validation errors from nested schemas', function () {
      const schema = new SimpleSchema({
        foo: new SimpleSchema({
          bar: String,
        }),
      });

      const context = schema.newContext();
      context.validate({
        foo: {
          bar: 12345,
        },
      });

      expect(context.validationErrors()).to.deep.equal([
        {
          dataType: 'String',
          name: 'foo.bar',
          type: SimpleSchema.ErrorTypes.EXPECTED_TYPE,
          value: 12345,
        },
      ]);
    });

    it('includes allowed value validation errors from nested schemas', function () {
      const schema = new SimpleSchema({
        foo: new SimpleSchema({
          bar: {
            type: String,
            allowedValues: ['hot'],
          },
        }),
      });

      const context = schema.newContext();
      context.validate({
        foo: {
          bar: 'cold',
        },
      });

      expect(context.validationErrors()).to.deep.equal([
        {
          name: 'foo.bar',
          type: SimpleSchema.ErrorTypes.VALUE_NOT_ALLOWED,
          value: 'cold',
        },
      ]);
    });

    it('includes validation errors from nested schemas when validating modifiers', function () {
      const schema = new SimpleSchema({
        foo: new SimpleSchema({
          bar: String,
        }),
      });

      const context = schema.newContext();
      context.validate({
        $set: {
          'foo.bar': 12345,
        },
      }, { modifier: true });

      expect(context.validationErrors()).to.deep.equal([
        {
          dataType: 'String',
          name: 'foo.bar',
          type: SimpleSchema.ErrorTypes.EXPECTED_TYPE,
          value: 12345,
        },
      ]);
    });

    it('validates nested requiredness', function () {
      const schema = new SimpleSchema({
        a: {
          type: new SimpleSchema({
            b: {
              type: new SimpleSchema({
                c: {
                  type: String,
                },
              }),
            },
          }),
        },
      });

      let context = schema.newContext();
      context.validate({ a: {} });

      expect(context.validationErrors()).to.deep.equal([
        {
          name: 'a.b',
          type: SimpleSchema.ErrorTypes.REQUIRED,
          value: undefined,
        },
        {
          name: 'a.b.c',
          type: SimpleSchema.ErrorTypes.REQUIRED,
          value: undefined,
        },
      ]);

      context = schema.newContext();
      context.validate({ a: { b: {} } });

      expect(context.validationErrors()).to.deep.equal([
        {
          name: 'a.b.c',
          type: SimpleSchema.ErrorTypes.REQUIRED,
          value: undefined,
        },
      ]);
    });

    it('issue #307 - throws an error if incorrect import results in empty object', function () {
      expect(function () {
        // Assume that default import of a file with no default export returns an empty object
        const Place = {};

        // eslint-disable-next-line no-new
        new SimpleSchema({
          places: {
            type: Array,
            label: 'Places',
            optional: true,
          },
          'places.$': { type: Place },
        });
      }).to.throw('Invalid definition for places.$ field: "type" may not be an object. Change it to Object');
    });
  });

  it('Safely sets defaultValues on subschemas nested in arrays', async function () {
    const nestedSchema = new SimpleSchema({
      nested: {
        type: Array,
      },
      'nested.$': {
        type: new SimpleSchema({
          somethingOptional: {
            type: String,
            optional: true,
          },
          somethingAutovalued: {
            type: String,
            optional: false,
            defaultValue: 'x',
          },
        }),
      },
    });

    const context = nestedSchema.newContext();
    const cleaned = await context.clean(
      {
        $set: {
          nested: [{ somethingOptional: 'q' }, { somethingOptional: 'z' }],
        },
      },
      { modifier: true },
    );

    expect(cleaned).to.deep.equal({
      $set: {
        nested: [
          { somethingAutovalued: 'x', somethingOptional: 'q' },
          { somethingAutovalued: 'x', somethingOptional: 'z' },
        ],
      },
    });
  });

  it('Issue #123', function () {
    // With $set
    const userSchema = new SimpleSchema({
      profile: {
        type: Object,
      },
      'profile.name': {
        type: String,
      },
    });

    const context = userSchema.namedContext();

    expect(context.validate({
      $set: {
        profile: {},
      },
    }, { modifier: true })).to.equal(false);

    // With $push
    const userSchema2 = new SimpleSchema({
      profile: {
        type: Array,
      },
      'profile.$': {
        type: Object,
      },
      'profile.$.name': {
        type: String,
      },
    });

    const context2 = userSchema2.namedContext();

    expect(context2.validate({
      $push: {
        profile: {},
      },
    }, { modifier: true })).to.equal(false);
  });

  it('validate object with prototype', function () {
    const schema = new SimpleSchema({
      foo: { type: SimpleSchema.Integer },
    });

    const testObj = new CustomObject({ foo: 1 });

    const context = schema.namedContext();
    expect(context.validate(testObj)).to.equal(true);
    expect(testObj instanceof CustomObject).to.equal(true);

    testObj.foo = 'not a number';
    expect(context.validate(testObj)).to.equal(false);
  });

  it('validate object with prototype within normal object', function () {
    const schema = new SimpleSchema({
      customObject: Object,
      'customObject.foo': SimpleSchema.Integer,
    });

    const customObject = new CustomObject({ foo: 1 });
    const testObj = {
      customObject,
    };

    const context = schema.namedContext();
    expect(context.validate(testObj)).to.equal(true);
    expect(testObj.customObject instanceof CustomObject).to.equal(true);

    testObj.customObject.foo = 'not a number';
    expect(context.validate(testObj)).to.equal(false);
  });

  it('allowsKey', function () {
    function run(key, allowed) {
      expect(testSchema.allowsKey(key)).to.equal(allowed);
    }

    run('minMaxString', true);
    run('minMaxString.$', false);
    run('minMaxString.$.foo', false);
    run('minMaxString.$foo', false);
    run('minMaxString.foo', false);
    run('sub', true);
    run('sub.number', true);
    run('sub.number.$', false);
    run('sub.number.$.foo', false);
    run('sub.number.$foo', false);
    run('sub.number.foo', false);
    run('minMaxStringArray', true);
    run('minMaxStringArray.$', true);
    run('minMaxStringArray.$.foo', false);
    run('minMaxStringArray.foo', false);
    run('customObject', true);
    run('customObject.$', false);
    run('customObject.foo', true);
    run('customObject.foo.$', true);
    run('customObject.foo.$foo', true);
    run('customObject.foo.$.$foo', true);
    run('blackBoxObject', true);
    run('blackBoxObject.$', false);
    run('blackBoxObject.foo', true);
    run('blackBoxObject.foo.$', true);
    run('blackBoxObject.foo.$foo', true);
    run('blackBoxObject.foo.$.$foo', true);
    run('blackBoxObject.foo.bar.$.baz', true);
  });

  it('allowsKey in subschema', function () {
    const schema = new SimpleSchema({
      foo: new SimpleSchema({
        bar: Object,
        'bar.baz': String,
      }),
    });

    expect(schema.allowsKey('foo.bar')).to.equal(true);
    expect(schema.allowsKey('foo.bar.baz')).to.equal(true);
    expect(schema.allowsKey('foo.bar.bum')).to.equal(false);
    expect(schema.allowsKey('foo.bar.baz.bum')).to.equal(false);
  });

  it('validating an object with a "length" property should not error', function () {
    const schema = new SimpleSchema({
      length: {
        type: Number,
        optional: true,
      },
    });

    expect(() => {
      schema.validate({
        length: 10,
      });

      schema.validate({
        $set: {
          length: 10,
        },
      }, { modifier: true });
    }).not.to.throw();
  });

  it('this.key in label function context', function () {
    const schema = new SimpleSchema({
      items: Array,
      'items.$': {
        type: String,
        label() {
          const { key } = this;
          if (!key) return 'Item';
          return `Item ${key.slice(key.lastIndexOf('.') + 1)}`;
        },
      },
    });

    expect(schema.label('items.0')).to.equal('Item 0');
    expect(schema.label('items.1')).to.equal('Item 1');
  });

  it('keyIsInBlackBox in subschema', function () {
    const schema = new SimpleSchema({
      foo: new SimpleSchema({
        bar: {
          type: Object,
          blackbox: true,
        },
      }),
    });

    expect(schema.keyIsInBlackBox('foo.bar')).to.equal(false);
    expect(schema.keyIsInBlackBox('foo.bar.baz')).to.equal(true);
    expect(schema.keyIsInBlackBox('foo.bar.baz.$.bum')).to.equal(true);
  });

  describe('blackboxKeys from subschema', function () {
    it('are correct', function () {
      const schema = new SimpleSchema({
        apple: {
          type: Object,
          blackbox: true,
        },
        pear: new SimpleSchema({
          info: {
            type: Object,
            blackbox: true,
          },
        }),
      });

      expect(schema.blackboxKeys()).to.deep.equal(['apple', 'pear.info']);
    });
  });

  it('empty required array is valid', function () {
    const schema = new SimpleSchema({
      names: { type: Array },
      'names.$': { type: String },
    });

    expectValid(schema, {
      names: [],
    });
  });

  it('null in array is not valid', function () {
    const schema = new SimpleSchema({
      names: { type: Array },
      'names.$': { type: String },
    });

    expectErrorOfTypeLength(SimpleSchema.ErrorTypes.EXPECTED_TYPE, schema, {
      names: [null],
    });
  });

  it('null is valid for optional', function () {
    const schema = new SimpleSchema({
      test: { type: String, optional: true },
    });

    expectValid(schema, {
      test: null,
    });
  });

  it('issue 360', function () {
    const schema = new SimpleSchema({
      emails: {
        type: Array,
      },
      'emails.$': {
        type: Object,
      },
      'emails.$.address': {
        type: String,
        regEx: SimpleSchema.RegEx.Email,
      },
      'emails.$.verified': {
        type: Boolean,
      },
    });

    expectErrorOfTypeLength(SimpleSchema.ErrorTypes.EXPECTED_TYPE, schema, {
      emails: [
        {
          address: 12321,
          verified: 'asdasd',
        },
      ],
    }, { keys: ['emails'] }).to.equal(2);

    expectErrorOfTypeLength(SimpleSchema.ErrorTypes.EXPECTED_TYPE, schema, {
      emails: [
        {
          address: 12321,
          verified: 'asdasd',
        },
      ],
    }, { keys: ['emails.0'] }).to.equal(2);
  });

  it('ignore option', function () {
    const schema = new SimpleSchema({
      foo: { type: String, optional: true },
    });

    expectValid(schema, {
      foo: 'bar',
    });

    expectValid(schema, {
      foo: 'bar',
    }, {
      ignore: [SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA],
    });

    expectValid(schema, {
      foo: 'bar',
    }, {
      keys: ['foo'],
      ignore: [SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA],
    });

    expectErrorOfTypeLength(SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA, schema, {
      bar: 'foo',
    });

    expectValid(schema, {
      bar: 'foo',
    }, {
      ignore: [SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA],
    });

    expectValid(schema, {
      bar: 'foo',
    }, {
      keys: ['bar'],
      ignore: [SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA],
    });
  });

  it('ClientError', function () {
    const schema = new SimpleSchema({
      int: SimpleSchema.Integer,
      string: String,
    });

    function verify(error) {
      expect(error.name).to.equal('ClientError');
      expect(error.errorType).to.equal('ClientError');
      expect(error.error).to.equal('validation-error');
      expect(error.details.length).to.equal(2);
      expect(error.details[0].name).to.equal('int');
      expect(error.details[0].type).to.equal(SimpleSchema.ErrorTypes.EXPECTED_TYPE);
      expect(error.details[0].message).to.equal('Int must be of type Integer');
      expect(error.details[1].name).to.equal('string');
      expect(error.details[1].type).to.equal(SimpleSchema.ErrorTypes.REQUIRED);
      expect(error.details[1].message).to.equal('String is required');

      // In order for the message at the top of the stack trace to be useful,
      // we set it to the first validation error message.
      expect(error.message).to.equal('Int must be of type Integer');
    }

    try {
      schema.validate({ int: '5' });
    } catch (error) {
      verify(error);
    }

    try {
      SimpleSchema.validate({ int: '5' }, schema);
    } catch (error) {
      verify(error);
    }

    try {
      SimpleSchema.validate({ int: '5' }, {
        int: SimpleSchema.Integer,
        string: String,
      });
    } catch (error) {
      verify(error);
    }

    try {
      schema.validator()({ int: '5' });
    } catch (error) {
      verify(error);
    }

    expect(function () {
      schema.validator({ clean: true })({ int: '5', string: 'test' });
    }).not.to.throw();
  });

  it('getFormValidator', function () {
    const schema = new SimpleSchema({
      int: SimpleSchema.Integer,
      string: String,
    });

    return Promise.all([
      schema.getFormValidator()({ int: '5' }).then((errors) => {
        expect(errors).to.deep.equal([
          {
            dataType: 'Integer',
            message: 'Int must be of type Integer',
            name: 'int',
            type: 'expectedType',
            value: '5',
          },
          {
            message: 'String is required',
            name: 'string',
            type: 'required',
            value: undefined,
          },
        ]);
      }),
      schema.getFormValidator({ clean: true })({ int: '5', string: 'test' }).then((errors) => {
        expect(errors).to.deep.equal([]);
      }),
    ]);
  });

  it('validate takes an array', function () {
    const schema = new SimpleSchema({
      int: SimpleSchema.Integer,
      string: String,
    });

    function verify(error) {
      expect(error.name).to.equal('ClientError');
      expect(error.errorType).to.equal('ClientError');
      expect(error.error).to.equal('validation-error');
      expect(error.details.length).to.equal(2);
      expect(error.details[0].name).to.equal('int');
      expect(error.details[0].type).to.equal(SimpleSchema.ErrorTypes.EXPECTED_TYPE);
      expect(error.details[1].name).to.equal('string');
      expect(error.details[1].type).to.equal(SimpleSchema.ErrorTypes.REQUIRED);

      // In order for the message at the top of the stack trace to be useful,
      // we set it to the first validation error message.
      //expect(error.reason).to.equal('Int must be of type Integer');
      expect(error.message).to.equal('Int must be of type Integer');
    }

    try {
      schema.validate([{ int: 5, string: 'test' }, { int: '5' }]);
    } catch (error) {
      verify(error);
    }

    try {
      SimpleSchema.validate([{ int: 5, string: 'test' }, { int: '5' }], schema);
    } catch (error) {
      verify(error);
    }

    try {
      SimpleSchema.validate([{ int: 5, string: 'test' }, { int: '5' }], {
        int: SimpleSchema.Integer,
        string: String,
      });
    } catch (error) {
      verify(error);
    }

    try {
      schema.validator()([{ int: 5, string: 'test' }, { int: '5' }]);
    } catch (error) {
      verify(error);
    }
  });

  it('validationErrorTransform', function () {
    const schema = new SimpleSchema({
      string: String,
    });

    SimpleSchema.defineValidationErrorTransform((error) => {
      error.message = 'validationErrorTransform';
      return error;
    });

    try {
      schema.validate({});
    } catch (e) {
      expect(e.message).to.equal('validationErrorTransform');
    }

    // Don't mess up other tests
    SimpleSchema.validationErrorTransform = null;
  });

  it('SimpleSchema.addDocValidator', function () {
    const schema = new SimpleSchema({
      string: String,
    });

    const errorArray = [
      { name: 'firstName', type: 'TOO_SILLY', value: 'Reepicheep' },
    ];
    const validatedObject = {
      string: 'String',
    };

    SimpleSchema.addDocValidator((obj) => {
      expect(obj).to.deep.equal(validatedObject);
      return errorArray;
    });

    const context = schema.newContext();
    context.validate(validatedObject);

    expect(context.validationErrors()).to.deep.equal(errorArray);

    // Don't mess up other tests
    SimpleSchema._docValidators = [];
  });

  it('SimpleSchema.constructorOptionDefaults', function () {
    const initialDefaults = SimpleSchema.constructorOptionDefaults();

    // Default defaults
    expect(initialDefaults).to.deep.equal({
      clean: {
        autoConvert: true,
        extendAutoValueContext: {},
        filter: true,
        getAutoValues: true,
        removeEmptyStrings: true,
        removeNullsFromArrays: false,
        trimStrings: true,
      },
      humanizeAutoLabels: true,
      requiredByDefault: true,
    });

    // Verify they are actually used
    const schema = new SimpleSchema();
    expect(schema._constructorOptions.humanizeAutoLabels).to.equal(true);
    expect(schema._cleanOptions.filter).to.equal(true);

    // Change some
    SimpleSchema.constructorOptionDefaults({
      humanizeAutoLabels: false,
      clean: {
        filter: false,
      },
    });

    // Verify they are changed
    const newDefaults = SimpleSchema.constructorOptionDefaults();
    expect(newDefaults).to.deep.equal({
      clean: {
        autoConvert: true,
        extendAutoValueContext: {},
        filter: false,
        getAutoValues: true,
        removeEmptyStrings: true,
        removeNullsFromArrays: false,
        trimStrings: true,
      },
      humanizeAutoLabels: false,
      requiredByDefault: true,
    });

    // Verify they are actually used
    const otherSchema = new SimpleSchema();
    expect(otherSchema._constructorOptions.humanizeAutoLabels).to.equal(false);
    expect(otherSchema._cleanOptions.filter).to.equal(false);

    // Don't mess up other tests
    SimpleSchema.constructorOptionDefaults(initialDefaults);
  });

  it('addDocValidator', function () {
    const schema = new SimpleSchema({
      string: String,
    });

    const errorArray = [
      { name: 'firstName', type: 'TOO_SILLY', value: 'Reepicheep' },
    ];
    const validatedObject = {
      string: 'String',
    };

    schema.addDocValidator((obj) => {
      expect(obj).to.deep.equal(validatedObject);
      return errorArray;
    });

    const context = schema.newContext();
    context.validate(validatedObject);

    expect(context.validationErrors()).to.deep.equal(errorArray);
  });

  describe('objectKeys', function () {
    it('gets objectKeys', function () {
      const schema = new SimpleSchema({
        a: Object,
        'a.b': Object,
        'a.b.c': Array,
        'a.b.c.$': Object,
        'a.b.c.$.d': Object,
        'a.b.c.$.d.e': String,
      });

      expect(schema.objectKeys()).to.deep.equal(['a']);
      expect(schema.objectKeys('a')).to.deep.equal(['b']);
      expect(schema.objectKeys('a.b')).to.deep.equal(['c']);
      expect(schema.objectKeys('a.b.c')).to.deep.equal([]);
      expect(schema.objectKeys('a.b.c.$')).to.deep.equal(['d']);
      expect(schema.objectKeys('a.b.c.$.d')).to.deep.equal(['e']);
    });

    it('gets subschema objectKeys', function () {
      const schema = new SimpleSchema({
        a: {
          type: new SimpleSchema({
            b: {
              type: new SimpleSchema({
                c: {
                  type: String,
                },
              }),
            },
          }),
        },
      });

      expect(schema.objectKeys('a')).to.deep.equal(['b']);
      expect(schema.objectKeys('a.b')).to.deep.equal(['c']);
    });
  });

  it('gets schema property by key', function () {
    const schema = new SimpleSchema({
      a: {
        type: new SimpleSchema({
          b: {
            type: new SimpleSchema({
              c: {
                type: String,
                defaultValue: 'abc',
              },
            }),
            defaultValue: 'ab',
          },
          d: SimpleSchema.oneOf({
            type: Array,
            minCount: 0,
            maxCount: 3,
          }, {
            type: SimpleSchema.Integer,
            min: 0,
          }),
          'd.$': String,
        }),
      },
    });

    expect(schema.get('a', 'defaultValue')).to.equal(undefined);
    expect(schema.get('a.b', 'defaultValue')).to.equal('ab');
    expect(schema.get('a.d', 'maxCount')).to.equal(3);
  });

  it('exposes defaultValue for a key', function () {
    const schema = new SimpleSchema({
      a: {
        type: new SimpleSchema({
          b: {
            type: new SimpleSchema({
              c: {
                type: String,
                defaultValue: 'abc',
              },
            }),
            defaultValue: 'ab',
          },
        }),
      },
    });

    expect(schema.defaultValue('a')).to.equal(undefined);
    expect(schema.defaultValue('a.b')).to.equal('ab');
    expect(schema.defaultValue('a.b.c')).to.equal('abc');
  });

  it('issue #232', function () {
    let foo;

    expect(function () {
      const schema3 = new SimpleSchema({
        foo: String,
      });

      const schema2 = new SimpleSchema({
        field2: {
          type: Array,
          optional: true,
        },
        'field2.$': schema3,
      });

      foo = new SimpleSchema({
        field1: {
          type: schema2,
          defaultValue: {},
        },
      });
    }).not.to.throw();

    expect(foo instanceof SimpleSchema).to.equal(true);
  });

  it('issue #390 - Should get null rawDefinition if keepRawDefiniton is false', function () {
    const foo = new SimpleSchema({
      foo: String,
    });
    expect(foo instanceof SimpleSchema).to.equal(true);
    expect(foo.rawDefinition).to.deep.equal(null);
  });

  it('issue #390 - Should get rawDefinition if keepRawDefiniton is true', function () {
    const foo = new SimpleSchema({
      foo: String,
    }, { keepRawDefinition: true });
    expect(foo instanceof SimpleSchema).to.equal(true);
    expect(foo.rawDefinition).to.deep.equal({ foo: String });
  });

  it('$currentDate Date validation', function () {
    const schema = new SimpleSchema({
      date: Date,
    });
    const context = schema.namedContext();

    let testModifer = {
      $currentDate: {
        date: true,
      },
    };
    expect(context.validate(testModifer, { modifier: true })).to.equal(true);

    testModifer = {
      $currentDate: {
        date: { $type: 'date' },
      },
    };
    context.validate(testModifer, { modifier: true });
    expect(context.validate(testModifer, { modifier: true })).to.equal(true);

    // timestamp fails because it would save a MongoDB.Timestamp value into a Date field
    testModifer = {
      $currentDate: {
        date: { $type: 'timestamp' },
      },
    };
    expect(context.validate(testModifer, { modifier: true })).to.equal(false);
  });

  describe('SimpleSchema.Any', function () {
    const schema = new SimpleSchema({
      testAny: SimpleSchema.Any,
    });
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
        ['Boolean false', false],
      ];

      dataTypes.forEach(([label, type]) => {
        describe(label, function () {
          it("on it's own", function () {
            expectValid(schema, { testAny: type });
          });

          it('as a nested key', function () {
            expectValid(
              new SimpleSchema({ testNested: schema }),
              { testNested: { testAny: { test: type } } },
            );
          });
        });
      });
    });

    describe('with modifiers', function() {
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
        '$pullAll',
      ];
      shouldBeValidModifiers.forEach((mod) => {
        describe(mod, function () {
          it(`can be used for ${mod} modifiers`, function() {
            expectValid(
              schema,
              { [mod]: { testAny: 3.1415 } },
              { modifier: true },
            );
          });
          it(`can be used for nested ${mod} modifiers`, function() {
            const parentSchema = new SimpleSchema({ parent: schema });
            expectValid(
              parentSchema,
              { [mod]: { parent: { testAny: 3.1415 } } },
              { modifier: true },
            );
          });
          it(`can be used for nested ${mod} modifiers with dot notation`, function() {
            const parentSchema = new SimpleSchema({ parent: schema });
            expectValid(
              parentSchema,
              { [mod]: { 'parent.testAny': 3.1415 } },
              { modifier: true },
            );
          });
        });
      });

      // Special cases where we don't expect it to work like the rest:
      describe('$unset', function () {
        it('can be used for $unset modifiers', function() {
          expectErrorOfTypeLength(
            SimpleSchema.ErrorTypes.REQUIRED,
            schema,
            { $unset: { testAny: 1 } },
            { modifier: true },
          ).to.deep.equal(1);
        });
        it('can be used for nested $unset modifiers', function() {
          const parentSchema = new SimpleSchema({ parent: schema });
          expectErrorOfTypeLength(
            SimpleSchema.ErrorTypes.REQUIRED,
            parentSchema,
            { $unset: { parent: 1 } },
            { modifier: true },
          ).to.deep.equal(1);
        });
        it('can be used for nested $unset modifiers with dot notation', function() {
          const parentSchema = new SimpleSchema({ parent: schema });
          expectErrorOfTypeLength(
            SimpleSchema.ErrorTypes.REQUIRED,
            parentSchema,
            { $unset: { 'parent.testAny': 1 } },
            { modifier: true },
          ).to.deep.equal(1);
        });
      });
      describe('$addToSet', function () {
        it('can be used for $addToSet modifiers', function() {
          expectValid(
            schema,
            { $addToSet: { testAny: 1 } },
            { modifier: true },
          );
        });
        it('can be used for nested $addToSet modifiers with dot notation', function() {
          const parentSchema = new SimpleSchema({ parent: schema });
          expectValid(
            parentSchema,
            { $addToSet: { 'parent.testAny': 3.1415 } },
            { modifier: true },
          );
        });
      });
      describe('$push', function () {
        it('can be used for $push modifiers', function() {
          expectValid(
            schema,
            { $push: { testAny: 1 } },
            { modifier: true },
          );
        });
        it('can be used for nested $push modifiers with dot notation', function() {
          const parentSchema = new SimpleSchema({ parent: schema });
          expectValid(
            parentSchema,
            { $push: { 'parent.testAny': 3.1415 } },
            { modifier: true },
          );
        });
      });
    });
  });
});
