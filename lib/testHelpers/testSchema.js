import { SimpleSchema } from '../SimpleSchema'
import Address from './Address'

const refSchema = new SimpleSchema({
  string: {
    type: String,
    optional: true
  },
  number: {
    type: Number,
    optional: true
  }
})

const testSchema = new SimpleSchema({
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
  allowedStringsSet: {
    type: Array,
    optional: true
  },
  'allowedStringsSet.$': {
    type: String,
    allowedValues: new Set(['tuna', 'fish', 'salad'])
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
  allowedNumbersSet: {
    type: Array,
    optional: true
  },
  'allowedNumbersSet.$': {
    type: SimpleSchema.Integer,
    allowedValues: new Set([1, 2, 3])
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
    min: (new Date(Date.UTC(2013, 0, 1))),
    max: (new Date(Date.UTC(2013, 11, 31)))
  },
  minMaxDateCalculated: {
    type: Date,
    optional: true,
    min () {
      return (new Date(Date.UTC(2013, 0, 1)))
    },
    max () {
      return (new Date(Date.UTC(2013, 11, 31)))
    }
  },
  email: {
    type: String,
    regEx: SimpleSchema.RegEx.Email,
    optional: true
  },
  url: {
    type: String,
    optional: true,
    custom () {
      if (!this.isSet) return
      try {
        new URL(this.value); // eslint-disable-line
      } catch (err) {
        return 'badUrl'
      }
    }
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
  objectArray: {
    type: Array,
    optional: true
  },
  'objectArray.$': {
    type: Object,
    optional: true
  },
  refObject: {
    type: refSchema,
    optional: true
  },
  refSchemaArray: {
    type: Array,
    optional: true
  },
  'refSchemaArray.$': {
    type: refSchema,
    optional: true
  }
})

testSchema.messageBox.messages({
  minCount: 'blah',
  'regEx email': '[label] is not a valid email address',
  'badUrl url': '[label] is not a valid URL'
})

export default testSchema
