/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai';
import { SimpleSchema } from '../SimpleSchema';

describe('autoValue', function () {
  describe('has correct information in function context', function () {
    it('empty', function () {
      const schema = new SimpleSchema({
        foo: {
          type: String,
          optional: true,
        },
        bar: {
          type: Boolean,
          optional: true,
          autoValue() {
            expect(this.key).to.equal('bar');
            expect(this.closestSubschemaFieldName).to.equal(null);
            expect(this.isSet).to.equal(false);
            expect(this.value).to.equal(undefined);
            expect(this.operator).to.equal(null);

            const foo = this.field('foo');
            expect(foo).to.deep.equal({
              isSet: false,
              operator: null,
              value: undefined,
            });

            const fooSibling = this.siblingField('foo');
            expect(fooSibling).to.deep.equal({
              isSet: false,
              operator: null,
              value: undefined,
            });

            const fooParent = this.parentField();
            expect(fooParent).to.deep.equal({
              isSet: false,
              operator: null,
              value: undefined,
            });
          },
        },
      });
      schema.clean({});
    });

    it('normal other key', function () {
      const schema = new SimpleSchema({
        foo: {
          type: String,
          optional: true,
        },
        bar: {
          type: Boolean,
          optional: true,
          autoValue() {
            expect(this.isSet).to.equal(false);
            expect(this.value).to.equal(undefined);
            expect(this.operator).to.equal(null);

            const foo = this.field('foo');
            expect(foo).to.deep.equal({
              isSet: true,
              operator: null,
              value: 'clown',
            });

            const fooSibling = this.siblingField('foo');
            expect(fooSibling).to.deep.equal({
              isSet: true,
              operator: null,
              value: 'clown',
            });

            const fooParent = this.parentField();
            expect(fooParent).to.deep.equal({
              isSet: false,
              operator: null,
              value: undefined,
            });
          },
        },
      });
      schema.clean({
        foo: 'clown',
      });
    });

    it('normal self and other key', function () {
      const schema = new SimpleSchema({
        foo: {
          type: String,
          optional: true,
        },
        bar: {
          type: Boolean,
          optional: true,
          autoValue() {
            expect(this.isSet).to.equal(true);
            expect(this.value).to.equal(true);
            expect(this.operator).to.equal(null);

            const foo = this.field('foo');
            expect(foo).to.deep.equal({
              isSet: true,
              operator: null,
              value: 'clown',
            });

            const fooSibling = this.siblingField('foo');
            expect(fooSibling).to.deep.equal({
              isSet: true,
              operator: null,
              value: 'clown',
            });

            const fooParent = this.parentField();
            expect(fooParent).to.deep.equal({
              isSet: false,
              operator: null,
              value: undefined,
            });
          },
        },
      });
      schema.clean({
        foo: 'clown',
        bar: true,
      });
    });

    it('parentField', function () {
      const schema = new SimpleSchema({
        foo: {
          type: Object,
          optional: true,
        },
        'foo.bar': {
          type: Boolean,
          optional: true,
          autoValue() {
            expect(this.parentField()).to.deep.equal({
              isSet: true,
              operator: null,
              value: {},
            });
          },
        },
      });
      schema.clean({
        foo: {},
      });
    });

    it('closestSubschemaFieldName set', function () {
      const schema1 = new SimpleSchema({
        dug: {
          type: Boolean,
          optional: true,
          autoValue() {
            expect(this.key).to.equal('dig.dug');
            expect(this.closestSubschemaFieldName).to.equal('dig');
          },
        },
      });
      const schema2 = new SimpleSchema({
        dig: {
          type: schema1,
          optional: true,
        },
      });
      schema2.clean({
        dig: {},
      });
    });

    it('normal self and no other key with unset', function () {
      const schema = new SimpleSchema({
        foo: {
          type: String,
          optional: true,
        },
        bar: {
          type: Boolean,
          optional: true,
          autoValue() {
            expect(this.isSet).to.equal(true);
            expect(this.value).to.equal(false);
            expect(this.operator).to.equal(null);

            const foo = this.field('foo');
            expect(foo).to.deep.equal({
              isSet: false,
              operator: null,
              value: undefined,
            });

            const fooSibling = this.siblingField('foo');
            expect(fooSibling).to.deep.equal({
              isSet: false,
              operator: null,
              value: undefined,
            });

            const fooParent = this.parentField();
            expect(fooParent).to.deep.equal({
              isSet: false,
              operator: null,
              value: undefined,
            });

            this.unset();
          },
        },
      });
      const doc = {
        bar: false,
      };
      expect(schema.clean(doc)).to.deep.equal({});
    });

    it('$set self and no other key', function () {
      const schema = new SimpleSchema({
        foo: {
          type: String,
          optional: true,
        },
        bar: {
          type: Boolean,
          optional: true,
          autoValue() {
            expect(this.isSet).to.equal(true);
            expect(this.value).to.equal(false);
            expect(this.operator).to.equal('$set');

            const foo = this.field('foo');
            expect(foo).to.deep.equal({
              isSet: false,
              operator: null,
              value: undefined,
            });

            const fooSibling = this.siblingField('foo');
            expect(fooSibling).to.deep.equal({
              isSet: false,
              operator: null,
              value: undefined,
            });

            const fooParent = this.parentField();
            expect(fooParent).to.deep.equal({
              isSet: false,
              operator: null,
              value: undefined,
            });
          },
        },
      });

      const doc = {
        $set: {
          bar: false,
        },
      };
      schema.clean(doc);
      expect(doc).to.deep.equal({
        $set: {
          bar: false,
        },
      });
    });

    it('$set self and another key and change self', function () {
      const schema = new SimpleSchema({
        foo: {
          type: String,
          optional: true,
        },
        bar: {
          type: Boolean,
          optional: true,
          autoValue() {
            expect(this.isSet).to.equal(true);
            expect(this.value).to.equal(false);
            expect(this.operator).to.equal('$set');

            const foo = this.field('foo');
            expect(foo).to.deep.equal({
              isSet: true,
              operator: '$set',
              value: 'clown',
            });

            const fooSibling = this.siblingField('foo');
            expect(fooSibling).to.deep.equal({
              isSet: true,
              operator: '$set',
              value: 'clown',
            });

            const fooParent = this.parentField();
            expect(fooParent).to.deep.equal({
              isSet: false,
              operator: null,
              value: undefined,
            });

            return true;
          },
        },
      });

      const doc = {
        $set: {
          foo: 'clown',
          bar: false,
        },
      };
      expect(schema.clean(doc)).to.deep.equal({
        $set: {
          foo: 'clown',
          bar: true,
        },
      });
    });

    it('adds $set when missing', function () {
      const schema = new SimpleSchema({
        foo: {
          type: String,
          optional: true,
        },
        bar: {
          type: Boolean,
          optional: true,
          autoValue() {
            expect(this.isSet).to.equal(false);
            expect(this.value).to.equal(undefined);
            expect(this.operator).to.equal('$set');

            const foo = this.field('foo');
            expect(foo).to.deep.equal({
              isSet: false,
              operator: null,
              value: undefined,
            });

            const fooSibling = this.siblingField('foo');
            expect(fooSibling).to.deep.equal({
              isSet: false,
              operator: null,
              value: undefined,
            });

            const fooParent = this.parentField();
            expect(fooParent).to.deep.equal({
              isSet: false,
              operator: null,
              value: undefined,
            });

            return {
              $set: true,
            };
          },
        },
      });

      expect(schema.clean({}, { isModifier: true })).to.deep.equal({
        $set: {
          bar: true,
        },
      });
    });
  });

  it('content autoValues', function () {
    const schema = new SimpleSchema({
      content: {
        type: String,
        optional: true,
      },
      updatesHistory: {
        type: Array,
        optional: true,
        autoValue() {
          const content = this.field('content');
          if (content.isSet) {
            if (!this.operator) {
              return [{
                date: new Date('2017-01-01T00:00:00.000Z'),
                content: content.value,
              }];
            }
            return {
              $push: {
                date: new Date('2017-01-01T00:00:00.000Z'),
                content: content.value,
              },
            };
          }
        },
      },
      'updatesHistory.$': {
        type: Object,
      },
      'updatesHistory.$.content': {
        type: String,
        optional: true,
      },
    });

    // Normal object
    let result = schema.clean({ content: 'foo' });
    expect(result).to.deep.equal({
      content: 'foo',
      updatesHistory: [
        {
          date: new Date('2017-01-01T00:00:00.000Z'),
          content: 'foo',
        },
      ],
    });

    // $set
    result = schema.clean({ $set: { content: 'foo' } });
    expect(result).to.deep.equal({
      $set: {
        content: 'foo',
      },
      $push: {
        updatesHistory: {
          date: new Date('2017-01-01T00:00:00.000Z'),
          content: 'foo',
        },
      },
    });
  });

  it('async content');

  it('array of objects autoValues', function () {
    const schema = new SimpleSchema({
      avArrayOfObjects: {
        type: Array,
        optional: true,
      },
      'avArrayOfObjects.$': {
        type: Object,
      },
      'avArrayOfObjects.$.a': {
        type: String,
      },
      'avArrayOfObjects.$.foo': {
        type: String,
        autoValue() {
          return 'bar';
        },
      },
    });

    let result = schema.clean({
      $push: {
        avArrayOfObjects: {
          a: 'b',
        },
      },
    });

    expect(result).to.deep.equal({
      $push: {
        avArrayOfObjects: {
          a: 'b',
          foo: 'bar',
        },
      },
    });

    result = schema.clean({
      $set: {
        avArrayOfObjects: [{
          a: 'b',
        }, {
          a: 'c',
        }],
      },
    });

    expect(result).to.deep.equal({
      $set: {
        avArrayOfObjects: [{
          a: 'b',
          foo: 'bar',
        }, {
          a: 'c',
          foo: 'bar',
        }],
      },
    });
  });

  it('async array of objects autoValues');

  it('$each in autoValue pseudo modifier', function () {
    const schema = new SimpleSchema({
      psuedoEach: {
        type: Array,
        optional: true,
        autoValue() {
          if (this.isSet && this.operator === '$set') {
            return {
              $push: {
                $each: this.value,
              },
            };
          }
        },
      },
      'psuedoEach.$': {
        type: String,
      },
    });

    const result = schema.clean({
      $set: {
        psuedoEach: ['foo', 'bar'],
      },
    });

    expect(result).to.deep.equal({
      $push: {
        psuedoEach: {
          $each: ['foo', 'bar'],
        },
      },
    });
  });

  it('async $each in autoValue pseudo modifier');

  it('simple autoValues', function () {
    const schema = new SimpleSchema({
      name: {
        type: String,
      },
      someDefault: {
        type: SimpleSchema.Integer,
        autoValue() {
          if (!this.isSet) return 5;
        },
      },
      updateCount: {
        type: SimpleSchema.Integer,
        autoValue() {
          if (!this.operator) return 0;
          return { $inc: 1 };
        },
      },
      firstWord: {
        type: String,
        optional: true,
        autoValue() {
          const content = this.field('content');
          if (content.isSet) return content.value.split(' ')[0];
          this.unset();
        },
      },
    });

    let result = schema.clean({
      name: 'Test',
      firstWord: 'Illegal to manually set value',
    });

    expect(result).to.deep.equal({
      name: 'Test',
      someDefault: 5,
      updateCount: 0,
    });

    result = schema.clean({
      name: 'Test',
      someDefault: 20,
    });

    expect(result).to.deep.equal({
      name: 'Test',
      someDefault: 20,
      updateCount: 0,
    });

    result = schema.clean({
      $set: {
        name: 'Test',
        someDefault: 20,
      },
    });

    expect(result).to.deep.equal({
      $set: {
        name: 'Test',
        someDefault: 20,
      },
      $inc: { updateCount: 1 },
    });
  });

  it('async simple autoValues');

  it('objects in arrays', function () {
    const subSchema = new SimpleSchema({
      value: {
        type: String,
        autoValue() {
          expect(this.isSet).to.equal(true);
          expect(this.operator).to.deep.equal('$set');
          expect(this.value).to.deep.equal('should be overridden by autovalue');
          return 'autovalue';
        },
      },
    });

    const schema = new SimpleSchema({
      children: {
        type: Array,
      },
      'children.$': {
        type: subSchema,
      },
    });

    const result = schema.clean({
      $set: {
        'children.$.value': 'should be overridden by autovalue',
      },
    }, { isModifier: true });

    expect(result.$set['children.$.value']).to.equal('autovalue');
  });

  it('operator correct for $pull', function () {
    let called = false;

    const schema = new SimpleSchema({
      foo: {
        type: Array,
        autoValue() {
          called = true;
          expect(this.operator).to.deep.equal('$pull');
        },
      },
      'foo.$': {
        type: String,
      },
    });

    schema.clean({
      $pull: {
        foo: 'bar',
      },
    });

    expect(called).to.equal(true);
  });

  it('issue 340', function () {
    let called = 0;

    const schema = new SimpleSchema({
      field1: {
        type: SimpleSchema.Integer,
      },
      field2: {
        type: String,
        autoValue() {
          called++;
          expect(this.field('field1').value).to.equal(1);
          expect(this.siblingField('field1').value).to.equal(1);
          return 'foo';
        },
      },
    });

    schema.clean({
      field1: 1,
    });
    schema.clean({
      $set: {
        field1: 1,
      },
    });

    expect(called).to.equal(2);
  });

  it('should allow getting previous autoValue in later autoValue', function () {
    const schema = new SimpleSchema({
      amount: Number,
      tax: {
        type: Number,
        optional: true,
        autoValue() {
          return 0.5;
        },
      },
      total: {
        type: Number,
        optional: true,
        autoValue() {
          const amount = this.field('amount').value || 0;
          const tax = this.field('tax').value || 0;
          return amount * (1 + tax);
        },
      },
    }, {
      clean: {
        filter: false,
        autoConvert: false,
      },
    });

    expect(schema.clean({ amount: 1 })).to.deep.equal({
      amount: 1,
      tax: 0.5,
      total: 1.5,
    });
  });

  it('clean options should be merged when extending', function () {
    const schema1 = new SimpleSchema({
      a: String,
    }, {
      clean: {
        filter: false,
        autoConvert: false,
      },
    });

    const schema2 = new SimpleSchema({});
    schema2.extend(schema1);

    expect(schema2.clean({ a: 1 })).to.deep.equal({ a: 1 });
  });

  it('array items', function () {
    const schema = new SimpleSchema({
      tags: {
        type: Array,
        optional: true,
      },
      'tags.$': {
        type: String,
        autoValue() {
          if (this.isSet) return this.value.toLowerCase();
        },
      },
    });

    const obj = {
      tags: [],
    };
    expect(schema.clean(obj)).to.deep.equal({
      tags: [],
    });

    const obj2 = {
      tags: ['FOO', 'BAR'],
    };
    expect(schema.clean(obj2)).to.deep.equal({
      tags: ['foo', 'bar'],
    });
  });

  it('updates existing objects when deeply nested (plain)', function () {
    const schema = new SimpleSchema({
      nested: Array,
      'nested.$': Object,
      'nested.$.doubleNested': Object,
      'nested.$.doubleNested.integer': {
        type: SimpleSchema.Integer,
        autoValue() {
          if (!this.value) {
            return 5;
          }
        },
      },
    });

    const cleanedObject = schema.clean({
      nested: [
        {
          doubleNested: {},
        },
        {
          doubleNested: {
            integer: '8',
          },
        },
      ],
    });

    expect(cleanedObject).to.deep.equal({
      nested: [
        {
          doubleNested: {
            integer: 5,
          },
        },
        {
          doubleNested: {
            integer: 8,
          },
        },
      ],
    });
  });

  it('updates existing objects when deeply nested (modifier)', function () {
    const schema = new SimpleSchema({
      nested: Array,
      'nested.$': Object,
      'nested.$.doubleNested': Object,
      'nested.$.doubleNested.integer': {
        type: SimpleSchema.Integer,
        autoValue() {
          if (!this.value) {
            return 5;
          }
        },
      },
    });

    const cleanedObject = schema.clean({
      $push: {
        nested: {
          doubleNested: {},
        },
      },
    });

    expect(cleanedObject).to.deep.equal({
      $push: {
        nested: {
          doubleNested: {
            integer: 5,
          },
        },
      },
    });
  });

  it('updates deeply nested with empty $set', function () {
    const schema = new SimpleSchema({
      nested: Array,
      'nested.$': Object,
      'nested.$.doubleNested': {
        type: Object,
        autoValue() {
          if (!this.value) {
            return {};
          }
        },
      },
      'nested.$.doubleNested.integer': {
        type: SimpleSchema.Integer,
        autoValue() {
          if (!this.value) {
            return 5;
          }
        },
      },
    });

    const cleanedObject = schema.clean({
      $set: {
        nested: [{}],
      },
    });

    expect(cleanedObject).to.deep.equal({
      $set: {
        nested: [{
          doubleNested: {
            integer: 5,
          },
        }],
      },
    });
  });

  it('updates deeply nested with $set having dotted array key', function () {
    const schema = new SimpleSchema({
      nested: Array,
      'nested.$': Object,
      'nested.$.doubleNested': Object,
      'nested.$.doubleNested.integer': {
        type: SimpleSchema.Integer,
        autoValue() {
          if (!this.value) {
            return 5;
          }
        },
      },
    });

    const cleanedObject = schema.clean({
      $set: {
        'nested.0.doubleNested': {},
      },
    });

    expect(cleanedObject).to.deep.equal({
      $set: {
        'nested.0.doubleNested': {
          integer: 5,
        },
      },
    });
  });

  it('should add auto values to sub schemas for plain objects', function () {
    const doubleNestedSchema = new SimpleSchema({
      integer: {
        type: SimpleSchema.Integer,
        autoValue() {
          if (!this.value) {
            return 5;
          }
        },
      },
    });

    const nestedSchema = new SimpleSchema({
      doubleNested: doubleNestedSchema,
    });

    const schema = new SimpleSchema({
      nested: Array,
      'nested.$': nestedSchema,
    });

    const cleanedObject = schema.clean({
      nested: [
        {
          doubleNested: {},
        },
        {
          doubleNested: {
            integer: '8',
          },
        },
      ],
    });

    expect(cleanedObject).to.deep.equal({
      nested: [
        {
          doubleNested: {
            integer: 5,
          },
        },
        {
          doubleNested: {
            integer: 8,
          },
        },
      ],
    });
  });

  it('should add auto values to sub schemas for modifiers objects', function () {
    const doubleNestedSchema = new SimpleSchema({
      integer: {
        type: SimpleSchema.Integer,
        autoValue() {
          if (!this.value) {
            return 5;
          }
        },
      },
    });

    const nestedSchema = new SimpleSchema({
      doubleNested: doubleNestedSchema,
    });

    const schema = new SimpleSchema({
      nested: Array,
      'nested.$': nestedSchema,
    });

    const cleanedObject = schema.clean({
      $push: {
        nested: {
          doubleNested: {},
        },
      },
    });

    expect(cleanedObject).to.deep.equal({
      $push: {
        nested: {
          doubleNested: {
            integer: 5,
          },
        },
      },
    });
  });

  it('after cleaning with one extended, autoValues do not bleed over', function () {
    const schema1 = new SimpleSchema({
      n: Number,
      obj: {
        type: Object,
        defaultValue: {},
      },
    });

    const schema2 = schema1.clone().extend({
      'obj.b': {
        type: SimpleSchema.Integer,
        defaultValue: 1,
      },
    });

    // This is a bug where after you've run autoValues with schema2, which
    // is cloned from schema1, the schema2 autoValues are not set while
    // cleaning with schema1. So we need these duplicate expects here to
    // verify it is fixed. The issue happened when a `defaultValue` was a
    // {} because additional default values within that object would actually
    // be mutated onto the original object. We now clone autoValues in
    // AutoValueRunner to fix this.
    expect(schema1.clean({})).to.deep.equal({ obj: {} });
    expect(schema2.clean({})).to.deep.equal({ obj: { b: 1 } });
    expect(schema1.clean({})).to.deep.equal({ obj: {} });
    expect(schema2.clean({})).to.deep.equal({ obj: { b: 1 } });
  });
});
