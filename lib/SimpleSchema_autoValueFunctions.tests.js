/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai';
import { SimpleSchema } from './SimpleSchema';

describe('SimpleSchema - autoValueFunctions', function () {
  it('simple', function () {
    const schema = new SimpleSchema({
      a: {
        type: String,
        autoValue() {},
      },
    });

    const autoValueFunctions = schema.autoValueFunctions();
    expect(autoValueFunctions.length).to.equal(1);
    expect(!!autoValueFunctions[0].func).to.equal(true);
    expect(autoValueFunctions[0].fieldName).to.equal('a');
    expect(autoValueFunctions[0].closestSubschemaFieldName).to.equal('');
  });

  it('one level of subschema', function () {
    const subschema = new SimpleSchema({
      z: {
        type: Object,
        autoValue() {},
      },
    });

    const schema = new SimpleSchema({
      a: {
        type: Object,
        autoValue() {},
      },
      'a.b': {
        type: String,
        autoValue() {},
      },
      c: {
        type: subschema,
      },
    });

    const autoValueFunctions = schema.autoValueFunctions();
    expect(autoValueFunctions.length).to.equal(3);

    expect(!!autoValueFunctions[0].func).to.equal(true);
    expect(autoValueFunctions[0].fieldName).to.equal('a');
    expect(autoValueFunctions[0].closestSubschemaFieldName).to.equal('');

    expect(!!autoValueFunctions[1].func).to.equal(true);
    expect(autoValueFunctions[1].fieldName).to.equal('a.b');
    expect(autoValueFunctions[1].closestSubschemaFieldName).to.equal('');

    expect(!!autoValueFunctions[2].func).to.equal(true);
    expect(autoValueFunctions[2].fieldName).to.equal('c.z');
    expect(autoValueFunctions[2].closestSubschemaFieldName).to.equal('c');
  });

  it('two levels of subschemas', function () {
    const subschema1 = new SimpleSchema({
      x: {
        type: Object,
        autoValue() {},
      },
      'x.m': {
        type: Array,
        autoValue() {},
      },
      'x.m.$': {
        type: String,
      },
    });

    const subschema2 = new SimpleSchema({
      z: {
        type: Object,
        autoValue() {},
      },
      'z.y': {
        type: subschema1,
      },
    });

    const schema = new SimpleSchema({
      a: {
        type: Object,
        autoValue() {},
      },
      'a.b': {
        type: String,
        autoValue() {},
      },
      c: {
        type: subschema2,
      },
    });

    const autoValueFunctions = schema.autoValueFunctions();
    expect(autoValueFunctions.length).to.equal(5);

    expect(!!autoValueFunctions[0].func).to.equal(true);
    expect(autoValueFunctions[0].fieldName).to.equal('a');
    expect(autoValueFunctions[0].closestSubschemaFieldName).to.equal('');

    expect(!!autoValueFunctions[1].func).to.equal(true);
    expect(autoValueFunctions[1].fieldName).to.equal('a.b');
    expect(autoValueFunctions[1].closestSubschemaFieldName).to.equal('');

    expect(!!autoValueFunctions[2].func).to.equal(true);
    expect(autoValueFunctions[2].fieldName).to.equal('c.z');
    expect(autoValueFunctions[2].closestSubschemaFieldName).to.equal('c');

    expect(!!autoValueFunctions[3].func).to.equal(true);
    expect(autoValueFunctions[3].fieldName).to.equal('c.z.y.x');
    expect(autoValueFunctions[3].closestSubschemaFieldName).to.equal('c.z.y');

    expect(!!autoValueFunctions[4].func).to.equal(true);
    expect(autoValueFunctions[4].fieldName).to.equal('c.z.y.x.m');
    expect(autoValueFunctions[4].closestSubschemaFieldName).to.equal('c.z.y');
  });

  it('array of objects', function () {
    const subschema = new SimpleSchema({
      z: {
        type: String,
        autoValue() {},
      },
    });

    const schema = new SimpleSchema({
      a: {
        type: Object,
        autoValue() {},
      },
      'a.b': {
        type: Array,
      },
      'a.b.$': {
        type: subschema,
      },
    });

    const autoValueFunctions = schema.autoValueFunctions();
    expect(autoValueFunctions.length).to.equal(2);

    expect(!!autoValueFunctions[0].func).to.equal(true);
    expect(autoValueFunctions[0].fieldName).to.equal('a');
    expect(autoValueFunctions[0].closestSubschemaFieldName).to.equal('');

    expect(!!autoValueFunctions[1].func).to.equal(true);
    expect(autoValueFunctions[1].fieldName).to.equal('a.b.$.z');
    expect(autoValueFunctions[1].closestSubschemaFieldName).to.equal('a.b.$');
  });

  it('async functions', async function () {
    const schema = new SimpleSchema({
      a: {
        type: String,
        autoValue() {
          return new Promise((resolve) => {
            resolve('a');
          });
        },
      },
    });
    const b = await schema.clean({});
    expect(b).to.deep.equal({ a: 'a' });
  });
});
