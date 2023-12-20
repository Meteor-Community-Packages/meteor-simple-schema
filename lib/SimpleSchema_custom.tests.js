/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai';
import { SimpleSchema, ValidationContext } from './SimpleSchema';
import expectErrorLength from './testHelpers/expectErrorLength';
import expectErrorOfTypeLength from './testHelpers/expectErrorOfTypeLength';

const schema = new SimpleSchema({
  password: {
    type: String,
  },
  confirmPassword: {
    type: String,
    custom() {
      if (this.value !== this.field('password').value) {
        return 'passwordMismatch';
      }
    },
  },
});

const requiredCustomSchema = new SimpleSchema({
  a: {
    type: Array,
    custom() {
      // Just adding custom to trigger extra validation
    },
  },
  'a.$': {
    type: Object,
    custom() {
      // Just adding custom to trigger extra validation
    },
  },
  b: {
    type: Array,
    custom() {
      // Just adding custom to trigger extra validation
    },
  },
  'b.$': {
    type: Object,
    custom() {
      // Just adding custom to trigger extra validation
    },
  },
});

describe('SimpleSchema - Validation Against Another Key', function () {
  describe('normal', function () {
    it('valid', function () {
      expectErrorLength(schema, {
        password: 'password',
        confirmPassword: 'password',
      }).to.deep.equal(0);
    });

    it('invalid', function () {
      expectErrorOfTypeLength('passwordMismatch', schema, {
        password: 'password',
        confirmPassword: 'password1',
      }).to.deep.equal(1);
    });
  });

  describe('modifier with $setOnInsert', function () {
    it('valid', function () {
      expectErrorLength(schema, {
        $setOnInsert: {
          password: 'password',
          confirmPassword: 'password',
        },
      }, { modifier: true, upsert: true }).to.deep.equal(0);
    });

    it('invalid', function () {
      expectErrorOfTypeLength('passwordMismatch', schema, {
        $setOnInsert: {
          password: 'password',
          confirmPassword: 'password1',
        },
      }, { modifier: true, upsert: true }).to.deep.equal(1);
    });
  });

  describe('modifier with $set', function () {
    it('valid', function () {
      expectErrorLength(schema, {
        $set: {
          password: 'password',
          confirmPassword: 'password',
        },
      }, { modifier: true }).to.deep.equal(0);
    });

    it('invalid', function () {
      expectErrorOfTypeLength('passwordMismatch', schema, {
        $set: {
          password: 'password',
          confirmPassword: 'password1',
        },
      }, { modifier: true }).to.deep.equal(1);
    });
  });
});

describe('custom', function () {
  it('custom validator has this.validationContext set', function () {
    let ok = false;

    const customSchema = new SimpleSchema({
      foo: {
        type: String,
        optional: true,
        custom() {
          if (this.validationContext instanceof ValidationContext) ok = true;
        },
      },
    });

    customSchema.namedContext().validate({});
    expect(ok).to.equal(true);
  });

  it('custom validation runs even when the optional field is undefined', function () {
    const customSchema = new SimpleSchema({
      foo: {
        type: String,
        optional: true,
        custom: () => 'custom',
      },
    });

    const context = customSchema.namedContext();
    context.validate({});
    expect(context.validationErrors().length).to.deep.equal(1);
    expect(context.validationErrors()[0]).to.deep.equal({ name: 'foo', type: 'custom', value: undefined });
  });

  it('custom validation runs when string is unset', function () {
    const customSchema = new SimpleSchema({
      foo: {
        type: String,
        optional: true,
        custom: () => 'custom',
      },
    });

    const context = customSchema.namedContext();
    context.validate({
      $unset: {
        foo: '',
      },
    }, { modifier: true });
    expect(context.validationErrors().length).to.deep.equal(1);
    expect(context.validationErrors()[0]).to.deep.equal({ name: 'foo', type: 'custom', value: '' });
  });

  it('we do not get required errors for a required field that has a `custom` function when we are $setting', function () {
    const context = requiredCustomSchema.namedContext();

    expect(context.validate({
      $set: {
        a: [{}],
      },
    }, { modifier: true })).to.deep.equal(true);

    expect(context.validate({
      $set: {
        'a.0': {},
      },
    }, { modifier: true })).to.deep.equal(true);
  });

  it('we do not get required errors for a required field that has a `custom` function when we are $pushing', function () {
    const context = requiredCustomSchema.namedContext();
    expect(context.validate({
      $push: {
        a: {},
      },
    }, { modifier: true })).to.deep.equal(true);
  });
});
