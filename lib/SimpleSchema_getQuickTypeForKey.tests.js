/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai';
import { SimpleSchema } from './SimpleSchema';

describe('SimpleSchema', function () {
  describe('getQuickTypeForKey', function () {
    it('string', function () {
      const schema = new SimpleSchema({
        foo: String,
      });

      const type = schema.getQuickTypeForKey('foo');
      expect(type).to.equal('string');
    });

    it('number', function () {
      const schema = new SimpleSchema({
        foo: Number,
      });

      const type = schema.getQuickTypeForKey('foo');
      expect(type).to.equal('number');
    });

    it('int', function () {
      const schema = new SimpleSchema({
        foo: SimpleSchema.Integer,
      });

      const type = schema.getQuickTypeForKey('foo');
      expect(type).to.equal('number');
    });

    it('boolean', function () {
      const schema = new SimpleSchema({
        foo: Boolean,
      });

      const type = schema.getQuickTypeForKey('foo');
      expect(type).to.equal('boolean');
    });

    it('date', function () {
      const schema = new SimpleSchema({
        foo: Date,
      });

      const type = schema.getQuickTypeForKey('foo');
      expect(type).to.equal('date');
    });

    it('object', function () {
      const schema = new SimpleSchema({
        foo: Object,
      });

      const type = schema.getQuickTypeForKey('foo');
      expect(type).to.equal('object');
    });

    it('stringArray', function () {
      const schema = new SimpleSchema({
        foo: [String],
      });

      const type = schema.getQuickTypeForKey('foo');
      expect(type).to.equal('stringArray');
    });

    it('numberArray', function () {
      const schema = new SimpleSchema({
        foo: [Number],
      });

      const type = schema.getQuickTypeForKey('foo');
      expect(type).to.equal('numberArray');
    });

    it('int array', function () {
      const schema = new SimpleSchema({
        foo: [SimpleSchema.Integer],
      });

      const type = schema.getQuickTypeForKey('foo');
      expect(type).to.equal('numberArray');
    });

    it('booleanArray', function () {
      const schema = new SimpleSchema({
        foo: [Boolean],
      });

      const type = schema.getQuickTypeForKey('foo');
      expect(type).to.equal('booleanArray');
    });

    it('dateArray', function () {
      const schema = new SimpleSchema({
        foo: [Date],
      });

      const type = schema.getQuickTypeForKey('foo');
      expect(type).to.equal('dateArray');
    });

    it('objectArray', function () {
      const schema = new SimpleSchema({
        foo: [Object],
      });

      const type = schema.getQuickTypeForKey('foo');
      expect(type).to.equal('objectArray');
    });

    it('objectArray (subschema)', function () {
      const subschema = new SimpleSchema({
        bar: String,
      });

      const schema = new SimpleSchema({
        foo: [subschema],
      });

      const type = schema.getQuickTypeForKey('foo');
      expect(type).to.equal('objectArray');
    });
  });
});
