/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai'
import { SimpleSchema } from './SimpleSchema'
import Address from './testHelpers/Address'

const ss = new SimpleSchema({
  string: {
    type: String,
    optional: true
  },
  minMaxString: {
    type: String,
    optional: true,
    min: 10,
    max: 20,
    regEx: /^[a-z0-9_]+$/
  },
  minMaxStringArray: {
    type: Array,
    optional: true,
    minCount: 1,
    maxCount: 2
  },
  'minMaxStringArray.$': {
    type: String,
    min: 10,
    max: 20
  },
  allowedStrings: {
    type: String,
    optional: true,
    allowedValues: ['tuna', 'fish', 'salad']
  },
  allowedStringsArray: {
    type: Array,
    optional: true
  },
  'allowedStringsArray.$': {
    type: String,
    allowedValues: ['tuna', 'fish', 'salad']
  },
  boolean: {
    type: Boolean,
    optional: true
  },
  booleanArray: {
    type: Array,
    optional: true
  },
  'booleanArray.$': {
    type: Boolean
  },
  objectArray: {
    type: Array,
    optional: true
  },
  'objectArray.$': {
    type: Object
  },
  'objectArray.$.boolean': {
    type: Boolean,
    defaultValue: false
  },
  number: {
    type: SimpleSchema.Integer,
    optional: true
  },
  sub: {
    type: Object,
    optional: true
  },
  'sub.number': {
    type: SimpleSchema.Integer,
    optional: true
  },
  minMaxNumber: {
    type: SimpleSchema.Integer,
    optional: true,
    min: 10,
    max: 20
  },
  minZero: {
    type: SimpleSchema.Integer,
    optional: true,
    min: 0
  },
  maxZero: {
    type: SimpleSchema.Integer,
    optional: true,
    max: 0
  },
  minMaxNumberCalculated: {
    type: SimpleSchema.Integer,
    optional: true,
    min () {
      return 10
    },
    max () {
      return 20
    }
  },
  minMaxNumberExclusive: {
    type: SimpleSchema.Integer,
    optional: true,
    min: 10,
    max: 20,
    exclusiveMax: true,
    exclusiveMin: true
  },
  minMaxNumberInclusive: {
    type: SimpleSchema.Integer,
    optional: true,
    min: 10,
    max: 20,
    exclusiveMax: false,
    exclusiveMin: false
  },
  allowedNumbers: {
    type: SimpleSchema.Integer,
    optional: true,
    allowedValues: [1, 2, 3]
  },
  allowedNumbersArray: {
    type: Array,
    optional: true
  },
  'allowedNumbersArray.$': {
    type: SimpleSchema.Integer,
    allowedValues: [1, 2, 3]
  },
  decimal: {
    type: Number,
    optional: true
  },
  date: {
    type: Date,
    optional: true
  },
  dateArray: {
    type: Array,
    optional: true
  },
  'dateArray.$': {
    type: Date
  },
  minMaxDate: {
    type: Date,
    optional: true,
    min: new Date(Date.UTC(2013, 0, 1)),
    max: new Date(Date.UTC(2013, 11, 31))
  },
  minMaxDateCalculated: {
    type: Date,
    optional: true,
    min () {
      return new Date(Date.UTC(2013, 0, 1))
    },
    max () {
      return new Date(Date.UTC(2013, 11, 31))
    }
  },
  email: {
    type: String,
    regEx: SimpleSchema.RegEx.Email,
    optional: true
  },
  url: {
    type: String,
    regEx: SimpleSchema.RegEx.Url,
    optional: true
  },
  customObject: {
    type: Address,
    optional: true,
    blackbox: true
  },
  blackBoxObject: {
    type: Object,
    optional: true,
    blackbox: true
  },
  noTrimString: {
    type: String,
    optional: true,
    trim: false
  }
})

function getTest (given, expected, isModifier) {
  return async function () {
    await ss.clean(given, { isModifier, mutate: true })
    expect(given).to.deep.equal(expected)
  }
}

describe('clean', function () {
  describe('normal doc', function () {
    it(
      'when you clean a good object it is still good',
      getTest(
        { string: 'This is a string' },
        { string: 'This is a string' },
        false
      )
    )
    it(
      'when you clean a bad object it is now good',
      getTest(
        { string: 'This is a string', admin: true },
        { string: 'This is a string' },
        false
      )
    )
    it('type conversion works', getTest({ string: 1 }, { string: '1' }, false))
    it('remove empty strings', getTest({ string: '' }, {}, false))
    it(
      'remove whitespace only strings (trimmed to empty strings)',
      getTest({ string: '    ' }, {}, false)
    )

    const myObj = new Address('New York', 'NY')
    it(
      'when you clean a good custom object it is still good',
      getTest({ customObject: myObj }, { customObject: myObj }, false)
    )

    const myObj2 = {
      foo: 'bar',
      'foobar.foobar': 10000
    }
    it(
      'when you clean a good blackbox object it is still good',
      getTest({ blackBoxObject: myObj2 }, { blackBoxObject: myObj2 }, false)
    )

    const myObj3 = {
      string: 't',
      length: 5
    }
    it(
      'when you clean an object with a length property, the length property should be removed',
      getTest(myObj3, { string: 't' }, false)
    )

    const myObj4 = {
      string: 't',
      length: null
    }
    it(
      'when you clean an object with a length null, the length property should be removed',
      getTest(myObj4, { string: 't' }, false)
    )
  })

  describe('$set', function () {
    it(
      'when you clean a good object it is still good',
      getTest(
        { $set: { string: 'This is a string' } },
        { $set: { string: 'This is a string' } },
        true
      )
    )
    it(
      'when you clean a bad object it is now good',
      getTest(
        { $set: { string: 'This is a string', admin: true } },
        { $set: { string: 'This is a string' } },
        true
      )
    )
    it(
      'type conversion works',
      getTest({ $set: { string: 1 } }, { $set: { string: '1' } }, true)
    )

    // $set must be removed, too, because Mongo 2.6+ throws errors when operator object is empty
    it(
      'move empty strings to $unset',
      getTest({ $set: { string: '' } }, { $unset: { string: '' } }, true)
    )
  })

  describe('$unset', function () {
    // We don't want the filter option to apply to $unset operator because it should be fine
    // to unset anything. For example, the schema might have changed and now we're running some
    // server conversion to unset properties that are no longer part of the schema.

    it(
      'when you clean a good object it is still good',
      getTest({ $unset: { string: null } }, { $unset: { string: null } }, true)
    )
    it(
      'when you clean an object with extra unset keys, they stay there',
      getTest(
        { $unset: { string: null, admin: null } },
        { $unset: { string: null, admin: null } },
        true
      )
    )
    it(
      'cleaning does not type convert the $unset value because it is a meaningless value',
      getTest({ $unset: { string: 1 } }, { $unset: { string: 1 } }, true)
    )
  })

  describe('$setOnInsert', function () {
    it(
      'when you clean a good object it is still good',
      getTest(
        { $setOnInsert: { string: 'This is a string' } },
        { $setOnInsert: { string: 'This is a string' } },
        true
      )
    )
    it(
      'when you clean a bad object it is now good',
      getTest(
        { $setOnInsert: { string: 'This is a string', admin: true } },
        { $setOnInsert: { string: 'This is a string' } },
        true
      )
    )
    it(
      'type conversion works',
      getTest(
        { $setOnInsert: { string: 1 } },
        { $setOnInsert: { string: '1' } },
        true
      )
    )
  })

  describe('$inc', function () {
    it(
      'when you clean a good object it is still good',
      getTest({ $inc: { number: 1 } }, { $inc: { number: 1 } }, true)
    )
    it(
      'when you clean a bad object it is now good',
      getTest({ $inc: { number: 1, admin: 1 } }, { $inc: { number: 1 } }, true)
    )
    it(
      'type conversion works',
      getTest({ $inc: { number: '1' } }, { $inc: { number: 1 } }, true)
    )
  })

  describe('$currentDate', function () {
    it(
      'should not convert a $currentDate modifier with true value',
      getTest(
        { $currentDate: { date: true } },
        { $currentDate: { date: true } },
        true
      )
    )

    it(
      'should not convert a $currentDate modifier with timestamp value',
      getTest(
        { $currentDate: { date: { $type: 'timestamp' } } },
        { $currentDate: { date: { $type: 'timestamp' } } },
        true
      )
    )

    it(
      'should not convert a $currentDate modifier with date value',
      getTest(
        { $currentDate: { date: { $type: 'date' } } },
        { $currentDate: { date: { $type: 'date' } } },
        true
      )
    )
  })

  describe('$addToSet', function () {
    it(
      'when you clean a good object it is still good',
      getTest(
        { $addToSet: { allowedNumbersArray: 1 } },
        { $addToSet: { allowedNumbersArray: 1 } },
        true
      )
    )
    it(
      'when you clean a bad object it is now good',
      getTest(
        { $addToSet: { allowedNumbersArray: 1, admin: 1 } },
        { $addToSet: { allowedNumbersArray: 1 } },
        true
      )
    )
    it(
      'type conversion works',
      getTest(
        { $addToSet: { allowedNumbersArray: '1' } },
        { $addToSet: { allowedNumbersArray: 1 } },
        true
      )
    )
  })

  describe('$addToSet with $each', function () {
    it(
      'when you clean a good object it is still good',
      getTest(
        { $addToSet: { allowedNumbersArray: { $each: [1, 2, 3] } } },
        { $addToSet: { allowedNumbersArray: { $each: [1, 2, 3] } } },
        true
      )
    )
    it(
      'when you clean a bad object it is now good',
      getTest(
        {
          $addToSet: {
            allowedNumbersArray: { $each: [1, 2, 3] },
            admin: { $each: [1, 2, 3] }
          }
        },
        { $addToSet: { allowedNumbersArray: { $each: [1, 2, 3] } } },
        true
      )
    )
    it(
      'type conversion works',
      getTest(
        { $addToSet: { allowedNumbersArray: { $each: ['1', 2, 3] } } },
        { $addToSet: { allowedNumbersArray: { $each: [1, 2, 3] } } },
        true
      )
    )
  })

  describe('$push', function () {
    it(
      'when you clean a good object it is still good',
      getTest(
        { $push: { allowedNumbersArray: 1 } },
        { $push: { allowedNumbersArray: 1 } },
        true
      )
    )
    it(
      'when you clean a bad object it is now good',
      getTest(
        { $push: { allowedNumbersArray: 1, admin: 1 } },
        { $push: { allowedNumbersArray: 1 } },
        true
      )
    )
    it(
      'type conversion works',
      getTest(
        { $push: { allowedNumbersArray: '1' } },
        { $push: { allowedNumbersArray: 1 } },
        true
      )
    )
  })

  describe('$push with $each', function () {
    it(
      'when you clean a good object it is still good',
      getTest(
        { $push: { allowedNumbersArray: { $each: [1, 2, 3] } } },
        { $push: { allowedNumbersArray: { $each: [1, 2, 3] } } },
        true
      )
    )
    it(
      'when you clean a bad object it is now good',
      getTest(
        {
          $push: {
            allowedNumbersArray: { $each: [1, 2, 3] },
            admin: { $each: [1, 2, 3] }
          }
        },
        { $push: { allowedNumbersArray: { $each: [1, 2, 3] } } },
        true
      )
    )
    it(
      'type conversion works',
      getTest(
        { $push: { allowedNumbersArray: { $each: ['1', 2, 3] } } },
        { $push: { allowedNumbersArray: { $each: [1, 2, 3] } } },
        true
      )
    )
  })

  describe('$pull', function () {
    it(
      'when you clean a good object it is still good',
      getTest(
        { $pull: { allowedNumbersArray: 1 } },
        { $pull: { allowedNumbersArray: 1 } },
        true
      )
    )
    it(
      'when you clean a good object with defaultValue it is still good',
      getTest(
        { $pull: { objectArray: { boolean: true } } },
        { $pull: { objectArray: { boolean: true } } },
        true
      )
    )
    it(
      'when you clean a bad object it is now good',
      getTest(
        { $pull: { allowedNumbersArray: 1, admin: 1 } },
        { $pull: { allowedNumbersArray: 1 } },
        true
      )
    )
    it(
      'type conversion works',
      getTest(
        { $pull: { allowedNumbersArray: '1' } },
        { $pull: { allowedNumbersArray: 1 } },
        true
      )
    )
  })

  describe('$pull with query2', function () {
    it(
      'when you clean a good object it is still good',
      getTest(
        { $pull: { allowedNumbersArray: { $in: [1] } } },
        { $pull: { allowedNumbersArray: { $in: [1] } } },
        true
      )
    )
    it(
      'when you clean a bad object it is now good',
      getTest(
        { $pull: { allowedNumbersArray: { $in: [1] }, admin: { $in: [1] } } },
        { $pull: { allowedNumbersArray: { $in: [1] } } },
        true
      )
    )
    it(
      'type conversion does not work within query2',
      getTest(
        { $pull: { allowedNumbersArray: { $in: ['1'] } } },
        { $pull: { allowedNumbersArray: { $in: ['1'] } } },
        true
      )
    )
    it(
      'more tests',
      getTest(
        { $pull: { allowedNumbersArray: { foo: { $in: [1] } } } },
        { $pull: { allowedNumbersArray: { foo: { $in: [1] } } } },
        true
      )
    )
  })

  describe('$pop', function () {
    it(
      'when you clean a good object it is still good',
      getTest(
        { $pop: { allowedNumbersArray: 1 } },
        { $pop: { allowedNumbersArray: 1 } },
        true
      )
    )
    it(
      'when you clean a bad object it is now good',
      getTest(
        { $pop: { allowedNumbersArray: 1, admin: 1 } },
        { $pop: { allowedNumbersArray: 1 } },
        true
      )
    )
    it(
      'type conversion works',
      getTest(
        { $pop: { allowedNumbersArray: '1' } },
        { $pop: { allowedNumbersArray: 1 } },
        true
      )
    )
  })

  describe('$pullAll', function () {
    it(
      'when you clean a good object it is still good',
      getTest(
        { $pullAll: { allowedNumbersArray: [1, 2, 3] } },
        { $pullAll: { allowedNumbersArray: [1, 2, 3] } },
        true
      )
    )
    it(
      'type conversion works',
      getTest(
        { $pullAll: { allowedNumbersArray: ['1', 2, 3] } },
        { $pullAll: { allowedNumbersArray: [1, 2, 3] } },
        true
      )
    )
  })

  describe('blackbox', function () {
    // Cleaning shouldn't remove anything within blackbox
    it(
      '1',
      getTest({ blackBoxObject: { foo: 1 } }, { blackBoxObject: { foo: 1 } })
    )
    it(
      '2',
      getTest(
        { blackBoxObject: { foo: [1] } },
        { blackBoxObject: { foo: [1] } }
      )
    )
    it(
      '3',
      getTest(
        { blackBoxObject: { foo: [{ bar: 1 }] } },
        { blackBoxObject: { foo: [{ bar: 1 }] } }
      )
    )
    it(
      '4',
      getTest(
        { $set: { blackBoxObject: { foo: 1 } } },
        { $set: { blackBoxObject: { foo: 1 } } },
        true
      )
    )
    it(
      '5',
      getTest(
        { $set: { blackBoxObject: { foo: [1] } } },
        { $set: { blackBoxObject: { foo: [1] } } },
        true
      )
    )
    it(
      '6',
      getTest(
        { $set: { blackBoxObject: { foo: [{ bar: 1 }] } } },
        { $set: { blackBoxObject: { foo: [{ bar: 1 }] } } },
        true
      )
    )
    it(
      '7',
      getTest(
        {
          $set: {
            'blackBoxObject.email.verificationTokens.$': { token: 'Hi' }
          }
        },
        {
          $set: {
            'blackBoxObject.email.verificationTokens.$': { token: 'Hi' }
          }
        },
        true
      )
    )
    it(
      '8',
      getTest(
        { $set: { 'blackBoxObject.email.verificationTokens.$.token': 'Hi' } },
        { $set: { 'blackBoxObject.email.verificationTokens.$.token': 'Hi' } },
        true
      )
    )
    it(
      '9',
      getTest(
        {
          $push: { 'blackBoxObject.email.verificationTokens': { token: 'Hi' } }
        },
        {
          $push: { 'blackBoxObject.email.verificationTokens': { token: 'Hi' } }
        },
        true
      )
    )
  })

  it('trim strings', async function () {
    async function doTest (isModifier, given, expected) {
      const cleanObj = await ss.clean(given, {
        mutate: true,
        filter: false,
        autoConvert: false,
        removeEmptyStrings: false,
        trimStrings: true,
        getAutoValues: false,
        isModifier
      })
      expect(cleanObj).to.deep.equal(expected)
    }

    // DOC
    await doTest(false, { string: '    This is a string    ' }, { string: 'This is a string' })

    // $SET
    await doTest(true, { $set: { string: '    This is a string    ' } }, { $set: { string: 'This is a string' } })

    // $UNSET is ignored
    await doTest(true, { $unset: { string: '    This is a string    ' } }, { $unset: { string: '    This is a string    ' } })

    // $SETONINSERT
    await doTest(true, { $setOnInsert: { string: '    This is a string    ' } }, { $setOnInsert: { string: 'This is a string' } })

    // $ADDTOSET
    await doTest(
      true,
      { $addToSet: { minMaxStringArray: '    This is a string    ' } },
      { $addToSet: { minMaxStringArray: 'This is a string' } }
    )

    // $ADDTOSET WITH EACH
    await doTest(
      true,
      {
        $addToSet: {
          minMaxStringArray: { $each: ['    This is a string    '] }
        }
      },
      { $addToSet: { minMaxStringArray: { $each: ['This is a string'] } } }
    )

    // $PUSH
    await doTest(true, { $push: { minMaxStringArray: '    This is a string    ' } }, { $push: { minMaxStringArray: 'This is a string' } })

    // $PUSH WITH EACH
    await doTest(
      true,
      { $push: { minMaxStringArray: { $each: ['    This is a string    '] } } },
      { $push: { minMaxStringArray: { $each: ['This is a string'] } } }
    )

    // $PULL
    await doTest(true, { $pull: { minMaxStringArray: '    This is a string    ' } }, { $pull: { minMaxStringArray: 'This is a string' } })

    // $POP
    await doTest(true, { $pop: { minMaxStringArray: '    This is a string    ' } }, { $pop: { minMaxStringArray: 'This is a string' } })

    // $PULLALL
    await doTest(
      true,
      { $pullAll: { minMaxStringArray: ['    This is a string    '] } },
      { $pullAll: { minMaxStringArray: ['This is a string'] } }
    )

    // Trim false
    await doTest(false, { noTrimString: '    This is a string    ' }, { noTrimString: '    This is a string    ' })

    // Trim false with autoConvert
    const cleanObj = await ss.clean(
      { noTrimString: '    This is a string    ' },
      {
        filter: false,
        autoConvert: true,
        removeEmptyStrings: false,
        trimStrings: true,
        getAutoValues: false,
        isModifier: false
      }
    )
    expect(cleanObj).to.deep.equal({ noTrimString: '    This is a string    ' })
  })

  describe('miscellaneous', function () {
    it('does not $unset when the prop is within an object that is already being $set', async function () {
      const optionalInObject = new SimpleSchema({
        requiredObj: {
          type: Object
        },
        'requiredObj.optionalProp': {
          type: String,
          optional: true
        },
        'requiredObj.requiredProp': {
          type: String
        }
      })

      const myObj = {
        $set: { requiredObj: { requiredProp: 'blah', optionalProp: '' } }
      }
      await optionalInObject.clean(myObj, { isModifier: true, mutate: true })

      expect(myObj).to.deep.equal({
        $set: { requiredObj: { requiredProp: 'blah' } }
      })
    })

    it('type convert to array', async function () {
      const myObj1 = { allowedStringsArray: 'tuna' }
      await ss.clean(myObj1, { mutate: true })
      expect(myObj1).to.deep.equal({ allowedStringsArray: ['tuna'] })

      const myObj2 = { $set: { allowedStringsArray: 'tuna' } }
      await ss.clean(myObj2, { isModifier: true, mutate: true })
      expect(myObj2).to.deep.equal({ $set: { allowedStringsArray: ['tuna'] } })
    })

    it('multi-dimensional arrays', async function () {
      const schema = new SimpleSchema({
        geometry: {
          type: Object,
          optional: true
        },
        'geometry.coordinates': {
          type: Array
        },
        'geometry.coordinates.$': {
          type: Array
        },
        'geometry.coordinates.$.$': {
          type: Array
        },
        'geometry.coordinates.$.$.$': {
          type: SimpleSchema.Integer
        }
      })

      const doc = {
        geometry: {
          coordinates: [[[30, 50]]]
        }
      }

      const expected = JSON.stringify(doc)
      expect(JSON.stringify(await schema.clean(doc))).to.deep.equal(expected)
    })

    it('removeNullsFromArrays removes nulls from arrays', async function () {
      const schema = new SimpleSchema({
        names: Array,
        'names.$': String
      })

      const cleanedObject = await schema.clean(
        {
          names: [null, 'foo', null]
        },
        { removeNullsFromArrays: true }
      )

      expect(cleanedObject).to.deep.equal({
        names: ['foo']
      })
    })

    it('removeNullsFromArrays does not remove non-null objects from arrays', async function () {
      const schema = new SimpleSchema({
        a: Array,
        'a.$': Object,
        'a.$.b': Number
      })

      const cleanedObject = await schema.clean(
        {
          $set: {
            a: [{ b: 1 }]
          }
        },
        { removeNullsFromArrays: true }
      )

      // Should be unchanged
      expect(cleanedObject).to.deep.equal({
        $set: {
          a: [{ b: 1 }]
        }
      })
    })

    it('remove object', async function () {
      const schema = new SimpleSchema({
        names: { type: Array },
        'names.$': { type: String }
      })

      const doc = {
        names: [{ hello: 'world' }]
      }
      await schema.clean(doc, { mutate: true })
      expect(doc).to.deep.equal({
        names: []
      })
    })
  })

  it('should clean sub schemas', async function () {
    const doubleNestedSchema = new SimpleSchema({
      integer: SimpleSchema.Integer
    })

    const nestedSchema = new SimpleSchema({
      doubleNested: doubleNestedSchema
    })

    const schema = new SimpleSchema({
      nested: Array,
      'nested.$': nestedSchema
    })

    const cleanedObject = await schema.clean({
      nested: [
        {
          doubleNested: {
            integer: '1'
          }
        }
      ]
    })

    expect(cleanedObject).to.deep.equal({
      nested: [
        {
          doubleNested: {
            integer: 1
          }
        }
      ]
    })
  })

  describe('with SimpleSchema.oneOf(String, Number, Date)', async function () {
    const oneOfSchema = new SimpleSchema({
      field: {
        type: SimpleSchema.oneOf(String, Number, Date)
      },
      nested: {
        type: Object
      },
      'nested.field': SimpleSchema.oneOf(String, Number, Date)
    })

    async function doTest (given, expected) {
      const cleanObj = await oneOfSchema.clean(given, { mutate: true })
      expect(cleanObj).to.deep.equal(expected)
    }

    it('should not convert a string', async function () {
      await doTest({ field: 'I am a string' }, { field: 'I am a string' })
    })
    it('should not convert a number', async function () {
      await doTest({ field: 12345 }, { field: 12345 })
    })
    it('should not convert a Date', async function () {
      await doTest({ field: new Date(12345) }, { field: new Date(12345) })
    })
    it('should convert a Date if no Date in oneOf', async function () {
      const schemaNoDate = new SimpleSchema({
        field: {
          type: SimpleSchema.oneOf(String, Number)
        }
      })
      const date = new Date(12345)
      const dateStrng = date.toString()

      const cleanObj = await schemaNoDate.clean({ field: date }, { mutate: true })
      expect(cleanObj).to.deep.equal({ field: dateStrng })
    })
    it('should convert a String if no String in oneOf', async function () {
      const schemaNoDate = new SimpleSchema({
        field: {
          type: SimpleSchema.oneOf(Number, Date)
        }
      })

      const cleanObj = await schemaNoDate.clean({ field: '12345' }, { mutate: true })
      expect(cleanObj).to.deep.equal({ field: 12345 })
    })

    it('should convert a Number if no Number in oneOf', async function () {
      const schemaNoDate = new SimpleSchema({
        field: {
          type: SimpleSchema.oneOf(String, Date)
        }
      })

      const cleanObj = await schemaNoDate.clean({ field: 12345 }, { mutate: true })
      expect(cleanObj).to.deep.equal({ field: '12345' })
    })

    describe('with modifiers', function () {
      it('should not convert a string', async function () {
        await doTest({ $set: { field: 'I am a string' } }, { $set: { field: 'I am a string' } })
      })

      it('should not convert a nested string', async function () {
        await doTest({ $set: { field: 'I am a string' } }, { $set: { field: 'I am a string' } })
      })

      it('should not convert a number', async function () {
        await doTest({ $set: { field: 12345 } }, { $set: { field: 12345 } })
      })

      it('should not convert a Date', async function () {
        await doTest({ $set: { field: new Date(12345) } }, { $set: { field: new Date(12345) } })
      })

      describe('nested operator', function () {
        it('should not convert a string', async function () {
          await doTest({ $set: { 'nested.field': 'I am a string' } }, { $set: { 'nested.field': 'I am a string' } })
        })
        it('should not convert a nested string', async function () {
          await doTest({ $set: { 'nested.field': 'I am a string' } }, { $set: { 'nested.field': 'I am a string' } })
        })
        it('should not convert a number', async function () {
          await doTest({ $set: { 'nested.field': 12345 } }, { $set: { 'nested.field': 12345 } })
        })
        it('should not convert a Date', async function () {
          await doTest({ $set: { 'nested.field': new Date(12345) } }, { $set: { 'nested.field': new Date(12345) } })
        })
      })

      it('should convert a Date if no Date in oneOf', async function () {
        const schemaNoDate = new SimpleSchema({
          field: {
            type: SimpleSchema.oneOf(String, Number)
          }
        })
        const date = new Date(12345)
        const dateString = date.toString()

        const cleanObj = await schemaNoDate.clean({ $set: { field: date } }, { mutate: true })
        expect(cleanObj).to.deep.equal({ $set: { field: dateString } })
      })

      it('should convert a String if no String in oneOf', async function () {
        const schemaNoDate = new SimpleSchema({
          field: {
            type: SimpleSchema.oneOf(Number, Date)
          }
        })

        const cleanObj = await schemaNoDate.clean({ $set: { field: '12345' } }, { mutate: true })
        expect(cleanObj).to.deep.equal({ $set: { field: 12345 } })
      })

      it('should convert a Number if no Number in oneOf', async function () {
        const schemaNoDate = new SimpleSchema({
          field: {
            type: SimpleSchema.oneOf(String, Date)
          }
        })

        const cleanObj = await schemaNoDate.clean({ $set: { field: 12345 } }, { mutate: true })
        expect(cleanObj).to.deep.equal({ $set: { field: '12345' } })
      })
    })
  })
})
