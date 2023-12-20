/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai';
import { SimpleSchema } from './SimpleSchema';

describe('SimpleSchema', function () {
  it('omit', function () {
    const schema = new SimpleSchema({
      foo: { type: Object },
      'foo.bar': { type: String },
      fooArray: { type: Array },
      'fooArray.$': { type: Object },
      'fooArray.$.bar': { type: String },
    });

    let newSchema = schema.omit('foo');
    expect(Object.keys(newSchema.schema())).to.deep.equal(['fooArray', 'fooArray.$', 'fooArray.$.bar']);

    newSchema = schema.omit('fooArray');
    expect(Object.keys(newSchema.schema())).to.deep.equal(['foo', 'foo.bar']);

    newSchema = schema.omit('foo', 'fooArray');
    expect(Object.keys(newSchema.schema())).to.deep.equal([]);

    newSchema = schema.omit('blah');
    expect(Object.keys(newSchema.schema())).to.deep.equal(['foo', 'foo.bar', 'fooArray', 'fooArray.$', 'fooArray.$.bar']);
  });
});
