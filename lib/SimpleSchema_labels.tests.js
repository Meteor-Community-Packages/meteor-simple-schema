/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai';
import { SimpleSchema } from './SimpleSchema';

describe('SimpleSchema - label', function () {
  it('inflection', function () {
    const schema = new SimpleSchema({
      minMaxNumber: { type: SimpleSchema.Integer },
      obj: { type: Object },
      'obj.someString': { type: String },
    });

    expect(schema.label('minMaxNumber')).to.equal('Min max number');
    expect(schema.label('obj.someString')).to.equal('Some string');
  });

  it('dynamic', function () {
    const schema = new SimpleSchema({
      minMaxNumber: { type: SimpleSchema.Integer },
      obj: { type: Object },
      'obj.someString': { type: String },
    });

    expect(schema.label('obj.someString')).to.equal('Some string');

    schema.labels({
      'obj.someString': 'A different label',
    });

    expect(schema.label('obj.someString')).to.equal('A different label');
  });

  it('callback', function () {
    const schema = new SimpleSchema({
      minMaxNumber: { type: SimpleSchema.Integer },
      obj: { type: Object },
      'obj.someString': { type: String },
    });

    expect(schema.label('obj.someString')).to.equal('Some string');

    schema.labels({
      'obj.someString': () => 'A callback label',
    });

    expect(schema.label('obj.someString')).to.equal('A callback label');
  });

  it('should allow apostrophes ("\'") in labels', () => {
    const schema = new SimpleSchema({
      foo: {
        type: String,
        label: 'Manager/supervisor\'s name',
      },
    });
    expect(schema.label('foo')).to.equal('Manager/supervisor\'s name');
  });

  it('can set label of field in nested schema', function () {
    const objSchema = new SimpleSchema({
      someString: String,
    });

    const schema = new SimpleSchema({
      obj: objSchema,
    });

    expect(schema.label('obj.someString')).to.equal('Some string');

    schema.labels({
      'obj.someString': 'New label',
    });

    expect(schema.label('obj.someString')).to.equal('New label');
  });
});
