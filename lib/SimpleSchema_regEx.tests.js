/* eslint-env mocha */
import expect from 'expect'
import { SimpleSchema } from './SimpleSchema'

describe('SimpleSchema', function () {
  it('regEx - issue 409', function () {
    // Make sure no regEx errors for optional
    const schema = new SimpleSchema({
      foo: {
        type: String,
        optional: true,
        regEx: /bar/
      }
    })

    expect(schema.newContext().validate({})).toEqual(true)
    expect(schema.newContext().validate({ foo: null })).toEqual(true)
    expect(schema.newContext().validate({ foo: '' })).toEqual(false)
  })

  it('no regEx errors for empty strings when `skipRegExCheckForEmptyStrings` field option is true', function () {
    const schema = new SimpleSchema({
      foo: {
        type: String,
        optional: true,
        regEx: /bar/,
        skipRegExCheckForEmptyStrings: true
      }
    })

    expect(schema.newContext().validate({ foo: '' })).toBe(true)

    // still fails when not empty string, though
    expect(schema.newContext().validate({ foo: 'bad' })).toBe(false)
  })

  it('Built-In RegEx and Messages', function () {
    SimpleSchema.defineRegExp('Email', /^thisisnevervalid1$/)
    SimpleSchema.defineRegExp('EmailWithTLD', /^thisisnevervalid2$/)
    SimpleSchema.defineRegExp('Domain', /^thisisnevervalid3$/)
    SimpleSchema.defineRegExp('WeakDomain', /^thisisnevervalid4$/)
    SimpleSchema.defineRegExp('IP', /^thisisnevervalid5$/)
    SimpleSchema.defineRegExp('IPv4', /^thisisnevervalid6$/)
    SimpleSchema.defineRegExp('IPv6', /^thisisnevervalid7$/)
    SimpleSchema.defineRegExp('Url', /^thisisnevervalid8$/)

    const schema = new SimpleSchema({
      email: {
        type: String,
        regEx: SimpleSchema.RegEx.Email,
        optional: true
      },
      emailWithTLD: {
        type: String,
        regEx: SimpleSchema.RegEx.EmailWithTLD,
        optional: true
      },
      domain: {
        type: String,
        regEx: SimpleSchema.RegEx.Domain,
        optional: true
      },
      weakDomain: {
        type: String,
        regEx: SimpleSchema.RegEx.WeakDomain,
        optional: true
      },
      ip: {
        type: String,
        regEx: SimpleSchema.RegEx.IP,
        optional: true
      },
      ip4: {
        type: String,
        regEx: SimpleSchema.RegEx.IPv4,
        optional: true
      },
      ip6: {
        type: String,
        regEx: SimpleSchema.RegEx.IPv6,
        optional: true
      },
      url: {
        type: String,
        regEx: SimpleSchema.RegEx.Url,
        optional: true
      },
      id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
      },
      longId: {
        type: String,
        regEx: SimpleSchema.RegEx.idOfLength(32),
        optional: true
      }
    })

    const c1 = schema.newContext()
    c1.validate({
      email: 'foo'
    })
    expect(c1.validationErrors().length).toEqual(1)
    expect(c1.keyErrorMessage('email')).toEqual('Email must be a valid email address')

    c1.validate({
      emailWithTLD: 'foo'
    })
    expect(c1.validationErrors().length).toEqual(1)
    expect(c1.keyErrorMessage('emailWithTLD')).toEqual('Email with tld must be a valid email address')

    c1.validate({
      domain: 'foo'
    })
    expect(c1.validationErrors().length).toEqual(1)
    expect(c1.keyErrorMessage('domain')).toEqual('Domain must be a valid domain')

    c1.validate({
      weakDomain: '///jioh779&%'
    })
    expect(c1.validationErrors().length).toEqual(1)
    expect(c1.keyErrorMessage('weakDomain')).toEqual('Weak domain must be a valid domain')

    c1.validate({
      ip: 'foo'
    })
    expect(c1.validationErrors().length).toEqual(1)
    expect(c1.keyErrorMessage('ip')).toEqual('Ip must be a valid IPv4 or IPv6 address')

    c1.validate({
      ip4: 'foo'
    })
    expect(c1.validationErrors().length).toEqual(1)
    expect(c1.keyErrorMessage('ip4')).toEqual('Ip4 must be a valid IPv4 address')

    c1.validate({
      ip6: 'foo'
    })
    expect(c1.validationErrors().length).toEqual(1)
    expect(c1.keyErrorMessage('ip6')).toEqual('Ip6 must be a valid IPv6 address')

    c1.validate({
      url: 'foo'
    })
    expect(c1.validationErrors().length).toEqual(1)
    expect(c1.keyErrorMessage('url')).toEqual('Url must be a valid URL')

    c1.validate({
      id: '%#$%'
    })
    expect(c1.validationErrors().length).toEqual(1)
    expect(c1.keyErrorMessage('id')).toEqual('ID must be a valid alphanumeric ID')

    c1.validate({
      longId: '%#$%'
    })
    expect(c1.validationErrors().length).toEqual(1)
    expect(c1.keyErrorMessage('longId')).toEqual('Long ID failed regular expression validation')
  })

  it('Optional regEx in subobject', function () {
    const schema = new SimpleSchema({
      foo: {
        type: Object,
        optional: true
      },
      'foo.url': {
        type: String,
        regEx: SimpleSchema.RegEx.Url,
        optional: true
      }
    })

    const context = schema.namedContext()

    expect(context.validate({})).toEqual(true)

    expect(context.validate({
      foo: {}
    })).toEqual(true)

    expect(context.validate({
      foo: {
        url: null
      }
    })).toEqual(true)

    expect(context.validate({
      $set: {
        foo: {}
      }
    }, { modifier: true })).toEqual(true)

    expect(context.validate({
      $set: {
        'foo.url': null
      }
    }, { modifier: true })).toEqual(true)

    expect(context.validate({
      $unset: {
        'foo.url': ''
      }
    }, { modifier: true })).toEqual(true)
  })

  // this is a simple fake-random id generator that generates the
  // ids with numbers that are expected to be valid for the Id and IdOf regexp
  const Random = {
    UNMISTAKABLE_CHARS: '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz',
    id (charsCount = 17) {
      let id = ''
      const len = Random.UNMISTAKABLE_CHARS.length
      for (let i = 0; i < charsCount; i++) {
        const index = Math.floor(Math.random() * len)
        id += Random.UNMISTAKABLE_CHARS[index]
      }
      return id
    }
  }

  it('SimpleSchema.RegEx.Id', function () {
    const idExpr = SimpleSchema.RegEx.Id
    const isTrue = (s) => expect(idExpr.test(s)).toBe(true)
    const isFalse = (s) => expect(idExpr.test(s)).toBe(false)

    isTrue(Random.id())
    isFalse(Random.id(16)) // less
    isFalse(Random.id(18)) // greater
    isFalse('01234567891011123') // invalid chars
  })

  it('SimpleSchema.RegEx.idOfLength', function () {
    const { idOfLength } = SimpleSchema.RegEx
    const expectThrows = (min, max) => expect(() => idOfLength(min, max)).toThrow(/Expected a non-negative safe integer/)

    // lets add some fuzzing to see if there are some unexpected edge cases
    // when generating the id RegExp pattern using SimpleSchema.RegEx.IdOf
    const randomMinValues = (fn, times) => (new Array(times)).forEach(() => expectThrows(fn()))
    const randomMaxValues = (min, fn, times) => (new Array(times)).forEach(() => expectThrows(min, fn()))

    // unexpected min values

    // no negatives
    randomMinValues(() => -1 * Math.floor(Math.random() * 100), 100)
    // no floating point numbers
    randomMinValues(() => Math.random(), 100)
    // only Number.MAX_SAFE_INTEGER
    expectThrows(9007199254740992)

    // unexpected max values

    // not less than min
    expectThrows(10, 9)
    // no negatives
    randomMaxValues(10, () => -1 * Math.floor(Math.random() * 100), 100)
    // no negatives
    randomMaxValues(10, () => -1 * Math.floor(Math.random() * 100), 100)
    // no floating point numbers
    randomMaxValues(10, () => Math.random(), 100)
    // only Number.MAX_SAFE_INTEGER
    expectThrows(10, 9007199254740992)

    const isTrue = (expr, s) => expect(expr.test(s)).toBe(true)
    const isFalse = (expr, s) => expect(expr.test(s)).toBe(false)

    // arbitrary length ids
    const anyLen = idOfLength(0, null)
    for (let i = 1; i < 100; i++) {
      isTrue(anyLen, Random.id(i))
    }

    // fixed length ids
    isTrue(idOfLength(17), Random.id())
    isTrue(idOfLength(32), Random.id(32))
    isFalse(idOfLength(16), Random.id()) // greater
    isFalse(idOfLength(32), Random.id()) // less

    // range of length ids with fixed upper bound
    isTrue(idOfLength(8, 128), '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz')
    isFalse(idOfLength(8, 128), '1234567890abcdefghijklmnopqrstuvwxyz') // invalid chars
    isFalse(idOfLength(8, 128), '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz%$/(=') // invalid chars 2

    // range of length ids with arbitrary upper bound
    isTrue(idOfLength(8, null), '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz')
    isFalse(idOfLength(8, null), '1234567890abcdefghijklmnopqrstuvwxyz') // invalid chars
    isFalse(idOfLength(8, null), '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz%$/(=') // invalid chars 2
  })
})
