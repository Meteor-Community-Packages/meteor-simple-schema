/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai';
import { SimpleSchema } from './SimpleSchema';

describe('SimpleSchema', function () {
  it('regEx - issue 409', function () {
    // Make sure no regEx errors for optional
    const schema = new SimpleSchema({
      foo: {
        type: String,
        optional: true,
        regEx: /bar/,
      },
    });

    expect(schema.newContext().validate({})).to.deep.equal(true);
    expect(schema.newContext().validate({ foo: null })).to.deep.equal(true);
    expect(schema.newContext().validate({ foo: '' })).to.deep.equal(false);
  });

  it('no regEx errors for empty strings when `skipRegExCheckForEmptyStrings` field option is true', function () {
    const schema = new SimpleSchema({
      foo: {
        type: String,
        optional: true,
        regEx: /bar/,
        skipRegExCheckForEmptyStrings: true,
      },
    });

    expect(schema.newContext().validate({ foo: '' })).to.equal(true);

    // still fails when not empty string, though
    expect(schema.newContext().validate({ foo: 'bad' })).to.equal(false);
  });

  it('Built-In RegEx and Messages', function () {
    const schema = new SimpleSchema({
      email: {
        type: String,
        regEx: SimpleSchema.RegEx.Email,
        optional: true,
      },
      emailWithTLD: {
        type: String,
        regEx: SimpleSchema.RegEx.EmailWithTLD,
        optional: true,
      },
      domain: {
        type: String,
        regEx: SimpleSchema.RegEx.Domain,
        optional: true,
      },
      weakDomain: {
        type: String,
        regEx: SimpleSchema.RegEx.WeakDomain,
        optional: true,
      },
      ip: {
        type: String,
        regEx: SimpleSchema.RegEx.IP,
        optional: true,
      },
      ip4: {
        type: String,
        regEx: SimpleSchema.RegEx.IPv4,
        optional: true,
      },
      ip6: {
        type: String,
        regEx: SimpleSchema.RegEx.IPv6,
        optional: true,
      },
      url: {
        type: String,
        regEx: SimpleSchema.RegEx.Url,
        optional: true,
      },
      id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true,
      },
      longId: {
        type: String,
        regEx: SimpleSchema.RegEx.idOfLength(32),
        optional: true,
      },
    });

    const c1 = schema.newContext();
    c1.validate({
      email: 'foo',
    });
    expect(c1.validationErrors().length).to.deep.equal(1);
    expect(c1.keyErrorMessage('email')).to.deep.equal('Email must be a valid email address');

    c1.validate({
      emailWithTLD: 'foo',
    });
    expect(c1.validationErrors().length).to.deep.equal(1);
    expect(c1.keyErrorMessage('emailWithTLD')).to.deep.equal('Email with tld must be a valid email address');

    c1.validate({
      domain: 'foo',
    });
    expect(c1.validationErrors().length).to.deep.equal(1);
    expect(c1.keyErrorMessage('domain')).to.deep.equal('Domain must be a valid domain');

    c1.validate({
      weakDomain: '///jioh779&%',
    });
    expect(c1.validationErrors().length).to.deep.equal(1);
    expect(c1.keyErrorMessage('weakDomain')).to.deep.equal('Weak domain must be a valid domain');

    c1.validate({
      ip: 'foo',
    });
    expect(c1.validationErrors().length).to.deep.equal(1);
    expect(c1.keyErrorMessage('ip')).to.deep.equal('Ip must be a valid IPv4 or IPv6 address');

    c1.validate({
      ip4: 'foo',
    });
    expect(c1.validationErrors().length).to.deep.equal(1);
    expect(c1.keyErrorMessage('ip4')).to.deep.equal('Ip4 must be a valid IPv4 address');

    c1.validate({
      ip6: 'foo',
    });
    expect(c1.validationErrors().length).to.deep.equal(1);
    expect(c1.keyErrorMessage('ip6')).to.deep.equal('Ip6 must be a valid IPv6 address');

    c1.validate({
      url: 'foo',
    });
    expect(c1.validationErrors().length).to.deep.equal(1);
    expect(c1.keyErrorMessage('url')).to.deep.equal('Url must be a valid URL');

    c1.validate({
      id: '%#$%',
    });
    expect(c1.validationErrors().length).to.deep.equal(1);
    expect(c1.keyErrorMessage('id')).to.deep.equal('ID must be a valid alphanumeric ID');

    c1.validate({
      longId: '%#$%',
    });
    expect(c1.validationErrors().length).to.deep.equal(1);
    expect(c1.keyErrorMessage('longId')).to.deep.equal('Long ID failed regular expression validation');
  });

  it('Optional regEx in subobject', function () {
    const schema = new SimpleSchema({
      foo: {
        type: Object,
        optional: true,
      },
      'foo.url': {
        type: String,
        regEx: SimpleSchema.RegEx.Url,
        optional: true,
      },
    });

    const context = schema.namedContext();

    expect(context.validate({})).to.deep.equal(true);

    expect(context.validate({
      foo: {},
    })).to.deep.equal(true);

    expect(context.validate({
      foo: {
        url: null,
      },
    })).to.deep.equal(true);

    expect(context.validate({
      $set: {
        foo: {},
      },
    }, { modifier: true })).to.deep.equal(true);

    expect(context.validate({
      $set: {
        'foo.url': null,
      },
    }, { modifier: true })).to.deep.equal(true);

    expect(context.validate({
      $unset: {
        'foo.url': '',
      },
    }, { modifier: true })).to.deep.equal(true);
  });

  it('SimpleSchema.RegEx.Email', function () {
    const expr = SimpleSchema.RegEx.Email;

    function isTrue(s) {
      expect(expr.test(s)).to.equal(true);
    }

    function isFalse(s) {
      expect(expr.test(s)).to.equal(false);
    }

    isTrue('name@web.de');
    isTrue('name+addition@web.de');
    isTrue('st#r~ange.e+mail@web.de');
    isTrue('name@localhost');
    isTrue('name@192.168.200.5');
    isFalse('name@BCDF:45AB:1245:75B9:0987:1562:4567:1234');
    isFalse('name@BCDF:45AB:1245:75B9::0987:1234:1324');
    isFalse('name@BCDF:45AB:1245:75B9:0987:1234:1324');
    isFalse('name@::1');
  });

  it('SimpleSchema.RegEx.EmailWithTLD', function () {
    const expr = SimpleSchema.RegEx.EmailWithTLD;

    function isTrue(s) {
      expect(expr.test(s)).to.equal(true);
    }

    function isFalse(s) {
      expect(expr.test(s)).to.equal(false);
    }

    isTrue('name@web.de');
    isTrue('name+addition@web.de');
    isTrue('st#r~ange.e+mail@web.de');
    isFalse('name@localhost');
    isFalse('name@192.168.200.5');
    isFalse('name@BCDF:45AB:1245:75B9:0987:1562:4567:1234');
    isFalse('name@BCDF:45AB:1245:75B9::0987:1234:1324');
    isFalse('name@BCDF:45AB:1245:75B9:0987:1234:1324');
    isFalse('name@::1');
  });

  it('SimpleSchema.RegEx.Domain', function () {
    const expr = SimpleSchema.RegEx.Domain;

    function isTrue(s) {
      expect(expr.test(s)).to.equal(true);
    }

    function isFalse(s) {
      expect(expr.test(s)).to.equal(false);
    }

    isTrue('domain.com');
    isFalse('localhost');
    isFalse('192.168.200.5');
    isFalse('BCDF:45AB:1245:75B9:0987:1562:4567:1234:AB36');
  });

  it('SimpleSchema.RegEx.WeakDomain', function () {
    const expr = SimpleSchema.RegEx.WeakDomain;

    function isTrue(s) {
      expect(expr.test(s)).to.equal(true);
    }

    isTrue('domain.com');
    isTrue('localhost');
    isTrue('192.168.200.5');
    isTrue('BCDF:45AB:1245:75B9:0987:1562:4567:1234');
  });

  it('SimpleSchema.RegEx.IP', function () {
    const expr = SimpleSchema.RegEx.IP;

    function isTrue(s) {
      expect(expr.test(s)).to.equal(true);
    }

    function isFalse(s) {
      expect(expr.test(s)).to.equal(false);
    }

    isFalse('localhost');
    isTrue('192.168.200.5');
    isFalse('320.168.200.5');
    isFalse('192.168.5');
    isTrue('BCDF:45AB:1245:75B9:0987:1562:4567:1234');
    isFalse('BCDF:45AB:1245:75B9:0987:1562:4567:1234:AB36');
    isTrue('BCDF:45AB:1245:75B9::0987:1234:1324');
    isFalse('BCDF:45AB:1245:75B9:0987:1234:1324');
    isTrue('::1');
  });

  it('SimpleSchema.RegEx.IPv4', function () {
    const expr = SimpleSchema.RegEx.IPv4;

    function isTrue(s) {
      expect(expr.test(s)).to.equal(true);
    }

    function isFalse(s) {
      expect(expr.test(s)).to.equal(false);
    }

    isFalse('localhost');
    isTrue('192.168.200.5');
    isFalse('320.168.200.5');
    isFalse('192.168.5');
    isFalse('BCDF:45AB:1245:75B9:0987:1562:4567:1234');
    isFalse('BCDF:45AB:1245:75B9:0987:1562:4567:1234:AB36');
    isFalse('BCDF:45AB:1245:75B9::0987:1234:1324');
    isFalse('BCDF:45AB:1245:75B9:0987:1234:1324');
    isFalse('::1');
  });

  it('SimpleSchema.RegEx.IPv6', function () {
    const expr = SimpleSchema.RegEx.IPv6;

    function isTrue(s) {
      expect(expr.test(s)).to.equal(true);
    }

    function isFalse(s) {
      expect(expr.test(s)).to.equal(false);
    }

    isFalse('localhost');
    isFalse('192.168.200.5');
    isFalse('320.168.200.5');
    isFalse('192.168.5');
    isTrue('BCDF:45AB:1245:75B9:0987:1562:4567:1234');
    isFalse('BCDF:45AB:1245:75B9:0987:1562:4567:1234:AB36');
    isTrue('BCDF:45AB:1245:75B9::0987:1234:1324');
    isFalse('BCDF:45AB:1245:75B9:0987:1234:1324');
    isTrue('::1');
  });

  // this is a simple fake-random id generator that generates the
  // ids with numbers that are expected to be valid for the Id and IdOf regexp
  const Random = {
    UNMISTAKABLE_CHARS: '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz',
    id (charsCount = 17) {
      let id = '';
      const len = Random.UNMISTAKABLE_CHARS.length;
      for (let i = 0; i < charsCount; i++) {
        const index = Math.floor(Math.random() * len);
        id += Random.UNMISTAKABLE_CHARS[index];
      }
      return id;
    },
  };

  it('SimpleSchema.RegEx.Id', function () {
    const idExpr = SimpleSchema.RegEx.Id;
    const isTrue = (s) => expect(idExpr.test(s)).to.equal(true);
    const isFalse = (s) => expect(idExpr.test(s)).to.equal(false);

    isTrue(Random.id());
    isFalse(Random.id(16)); // less
    isFalse(Random.id(18)); // greater
    isFalse('01234567891011123'); // invalid chars
  });

  it('SimpleSchema.RegEx.idOfLength', function () {
    const { idOfLength } = SimpleSchema.RegEx;
    const expectThrows = (min, max) => expect(() => idOfLength(min, max)).to.throw(/Expected a non-negative safe integer/);

    // lets add some fuzzing to see if there are some unexpected edge cases
    // when generating the id RegExp pattern using SimpleSchema.RegEx.IdOf
    const randomMinValues = (fn, times) => (new Array(times)).forEach(() => expectThrows(fn()));
    const randomMaxValues = (min, fn, times) => (new Array(times)).forEach(() => expectThrows(min, fn()));

    // unexpected min values

    // no negatives
    randomMinValues(() => -1 * Math.floor(Math.random() * 100), 100);
    // no floating point numbers
    randomMinValues(() => Math.random(), 100);
    // only Number.MAX_SAFE_INTEGER
    expectThrows(9007199254740992);

    // unexpected max values

    // not less than min
    expectThrows(10, 9);
    // no negatives
    randomMaxValues(10, () => -1 * Math.floor(Math.random() * 100), 100);
    // no negatives
    randomMaxValues(10, () => -1 * Math.floor(Math.random() * 100), 100);
    // no floating point numbers
    randomMaxValues(10, () => Math.random(), 100);
    // only Number.MAX_SAFE_INTEGER
    expectThrows(10, 9007199254740992);

    const isTrue = (expr, s) => expect(expr.test(s)).to.equal(true);
    const isFalse = (expr, s) => expect(expr.test(s)).to.equal(false);

    // arbitrary length ids
    const anyLen = idOfLength(0, null);
    for (let i = 1; i < 100; i++) {
      isTrue(anyLen, Random.id(i));
    }

    // fixed length ids
    isTrue(idOfLength(17), Random.id());
    isTrue(idOfLength(32), Random.id(32));
    isFalse(idOfLength(16), Random.id()); // greater
    isFalse(idOfLength(32), Random.id()); // less

    // range of length ids with fixed upper bound
    isTrue(idOfLength(8, 128), '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz');
    isFalse(idOfLength(8, 128), '1234567890abcdefghijklmnopqrstuvwxyz'); // invalid chars
    isFalse(idOfLength(8, 128), '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz%$/(='); // invalid chars 2

    // range of length ids with arbitrary upper bound
    isTrue(idOfLength(8, null), '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz');
    isFalse(idOfLength(8, null), '1234567890abcdefghijklmnopqrstuvwxyz'); // invalid chars
    isFalse(idOfLength(8, null), '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz%$/(='); // invalid chars 2
  });
});
