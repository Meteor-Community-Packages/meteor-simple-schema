/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai'
import { SimpleSchema } from './SimpleSchema'
import friendsSchema from './testHelpers/friendsSchema'
import testSchema from './testHelpers/testSchema'
import expectErrorLength from './testHelpers/expectErrorLength'

describe('SimpleSchema - allowedValues', function () {
  describe('normal', function () {
    it('valid string', function () {
      expectErrorLength(testSchema, {
        allowedStrings: 'tuna'
      }).to.deep.equal(0)

      expectErrorLength(testSchema, {
        allowedStringsArray: ['tuna', 'fish', 'salad']
      }).to.deep.equal(0)

      expectErrorLength(testSchema, {
        allowedStringsSet: ['tuna', 'fish', 'salad']
      }).to.deep.equal(0)

      // Array of objects
      expectErrorLength(friendsSchema, {
        friends: [{
          name: 'Bob',
          type: 'best'
        }],
        enemies: []
      }).to.deep.equal(0)
    })

    it('invalid string', function () {
      expectErrorLength(testSchema, {
        allowedStrings: 'tunas'
      }).to.deep.equal(1)

      // Array
      expectErrorLength(testSchema, {
        allowedStringsArray: ['tuna', 'fish', 'sandwich']
      }).to.deep.equal(1)

      // Set Or Array
      expectErrorLength(testSchema, {
        allowedStringsSet: ['tuna', 'fish', 'sandwich']
      }).to.deep.equal(1)

      // Array of objects
      expectErrorLength(friendsSchema, {
        friends: [{
          name: 'Bob',
          type: 'smelly'
        }],
        enemies: []
      }).to.deep.equal(1)
    })

    it('valid number', function () {
      expectErrorLength(testSchema, {
        allowedNumbers: 1
      }).to.deep.equal(0)

      expectErrorLength(testSchema, {
        allowedNumbersArray: [1, 2, 3]
      }).to.deep.equal(0)

      expectErrorLength(testSchema, {
        allowedNumbersSet: [1, 2, 3]
      }).to.deep.equal(0)

      // Array of objects
      expectErrorLength(friendsSchema, {
        friends: [{
          name: 'Bob',
          type: 'best',
          a: {
            b: 5000
          }
        }],
        enemies: []
      }).to.deep.equal(0)
    })

    it('invalid number', function () {
      expectErrorLength(testSchema, {
        allowedNumbers: 4
      }).to.deep.equal(1)

      // Array
      expectErrorLength(testSchema, {
        allowedNumbersArray: [1, 2, 3, 4]
      }).to.deep.equal(1)

      // Set or Array
      expectErrorLength(testSchema, {
        allowedNumbersSet: [1, 2, 3, 4]
      }).to.deep.equal(1)

      // Array of objects
      expectErrorLength(friendsSchema, {
        friends: [{
          name: 'Bob',
          type: 'best',
          a: {
            b: 'wrong'
          }
        }],
        enemies: []
      }).to.deep.equal(1)
    })
  })

  describe('modifier with $setOnInsert', function () {
    it('valid string', function () {
      expectErrorLength(testSchema, {
        $setOnInsert: {
          allowedStrings: 'tuna'
        }
      }, { modifier: true, upsert: true }).to.deep.equal(0)

      // Array
      expectErrorLength(testSchema, {
        $setOnInsert: {
          allowedStringsArray: ['tuna', 'fish', 'salad']
        }
      }, { modifier: true, upsert: true }).to.deep.equal(0)

      // Set or Array
      expectErrorLength(testSchema, {
        $setOnInsert: {
          allowedStringsSet: ['tuna', 'fish', 'salad']
        }
      }, { modifier: true, upsert: true }).to.deep.equal(0)

      // Array of objects
      expectErrorLength(friendsSchema, {
        $setOnInsert: {
          friends: [{
            name: 'Bob',
            type: 'best'
          }],
          enemies: []
        }
      }, { modifier: true, upsert: true }).to.deep.equal(0)
    })

    it('invalid string', function () {
      expectErrorLength(testSchema, {
        $setOnInsert: {
          allowedStrings: 'tunas'
        }
      }, { modifier: true, upsert: true }).to.deep.equal(1)

      // Array
      expectErrorLength(testSchema, {
        $setOnInsert: {
          allowedStringsArray: ['tuna', 'fish', 'sandwich']
        }
      }, { modifier: true, upsert: true }).to.deep.equal(1)

      // Set or Array
      expectErrorLength(testSchema, {
        $setOnInsert: {
          allowedStringsSet: ['tuna', 'fish', 'sandwich']
        }
      }, { modifier: true, upsert: true }).to.deep.equal(1)

      // Array of objects
      expectErrorLength(friendsSchema, {
        $setOnInsert: {
          friends: [{
            name: 'Bob',
            type: 'smelly'
          }],
          enemies: []
        }
      }, { modifier: true, upsert: true }).to.deep.equal(1)
    })

    it('valid number', function () {
      expectErrorLength(testSchema, {
        $setOnInsert: {
          allowedNumbers: 1
        }
      }, { modifier: true, upsert: true }).to.deep.equal(0)

      // Array
      expectErrorLength(testSchema, {
        $setOnInsert: {
          allowedNumbersArray: [1, 2, 3]
        }
      }, { modifier: true, upsert: true }).to.deep.equal(0)

      // Set or Array
      expectErrorLength(testSchema, {
        $setOnInsert: {
          allowedNumbersSet: [1, 2, 3]
        }
      }, { modifier: true, upsert: true }).to.deep.equal(0)

      // Array of objects
      expectErrorLength(friendsSchema, {
        $setOnInsert: {
          friends: [{
            name: 'Bob',
            type: 'best',
            a: {
              b: 5000
            }
          }],
          enemies: []
        }
      }, { modifier: true, upsert: true }).to.deep.equal(0)
    })

    it('invalid number', function () {
      expectErrorLength(testSchema, {
        $setOnInsert: {
          allowedNumbers: 4
        }
      }, { modifier: true, upsert: true }).to.deep.equal(1)

      // Array
      expectErrorLength(testSchema, {
        $setOnInsert: {
          allowedNumbersArray: [1, 2, 3, 4]
        }
      }, { modifier: true, upsert: true }).to.deep.equal(1)

      // Set or Array
      expectErrorLength(testSchema, {
        $setOnInsert: {
          allowedNumbersSet: [1, 2, 3, 4]
        }
      }, { modifier: true, upsert: true }).to.deep.equal(1)

      // Array of objects
      expectErrorLength(friendsSchema, {
        $setOnInsert: {
          friends: [{
            name: 'Bob',
            type: 'best',
            a: {
              b: 'wrong'
            }
          }],
          enemies: []
        }
      }, { modifier: true, upsert: true }).to.deep.equal(1)
    })
  })

  describe('modifier with $set', function () {
    it('valid string', function () {
      expectErrorLength(testSchema, {
        $set: {
          allowedStrings: 'tuna'
        }
      }, { modifier: true }).to.deep.equal(0)

      // Array
      expectErrorLength(testSchema, {
        $set: {
          allowedStringsArray: ['tuna', 'fish', 'salad']
        }
      }, { modifier: true }).to.deep.equal(0)

      // Set or Array
      expectErrorLength(testSchema, {
        $set: {
          allowedStringsSet: ['tuna', 'fish', 'salad']
        }
      }, { modifier: true }).to.deep.equal(0)

      // Array of objects
      expectErrorLength(friendsSchema, {
        $set: {
          'friends.$.name': 'Bob'
        }
      }, { modifier: true }).to.deep.equal(0)

      expectErrorLength(friendsSchema, {
        $set: {
          'friends.1.name': 'Bob'
        }
      }, { modifier: true }).to.deep.equal(0)
    })

    it('invalid string', function () {
      expectErrorLength(testSchema, {
        $set: {
          allowedStrings: 'tunas'
        }
      }, { modifier: true }).to.deep.equal(1)

      // Array
      expectErrorLength(testSchema, {
        $set: {
          allowedStringsArray: ['tuna', 'fish', 'sandwich']
        }
      }, { modifier: true }).to.deep.equal(1)

      // Set or Array
      expectErrorLength(testSchema, {
        $set: {
          allowedStringsSet: ['tuna', 'fish', 'sandwich']
        }
      }, { modifier: true }).to.deep.equal(1)

      // Array of objects
      expectErrorLength(friendsSchema, {
        $set: {
          'friends.$.name': 'Bobby'
        }
      }, { modifier: true }).to.deep.equal(1)

      expectErrorLength(friendsSchema, {
        $set: {
          'friends.1.name': 'Bobby'
        }
      }, { modifier: true }).to.deep.equal(1)
    })

    it('valid number', function () {
      expectErrorLength(testSchema, {
        $set: {
          allowedNumbers: 1
        }
      }, { modifier: true }).to.deep.equal(0)

      expectErrorLength(testSchema, {
        $set: {
          allowedNumbersArray: [1, 2, 3]
        }
      }, { modifier: true }).to.deep.equal(0)

      expectErrorLength(testSchema, {
        $set: {
          allowedNumbersSet: [1, 2, 3]
        }
      }, { modifier: true }).to.deep.equal(0)
    })

    it('invalid number', function () {
      expectErrorLength(testSchema, {
        $set: {
          allowedNumbers: 4
        }
      }, { modifier: true }).to.deep.equal(1)

      expectErrorLength(testSchema, {
        $set: {
          allowedNumbersArray: [1, 2, 3, 4]
        }
      }, { modifier: true }).to.deep.equal(1)

      expectErrorLength(testSchema, {
        $set: {
          allowedNumbersSet: [1, 2, 3, 4]
        }
      }, { modifier: true }).to.deep.equal(1)
    })
  })

  describe('getAllowedValuesForKey', function () {
    it('works', function () {
      const allowedValues = ['a', 'b']
      const schema = new SimpleSchema({
        foo: Array,
        'foo.$': {
          type: String,
          allowedValues
        }
      })
      expect(schema.getAllowedValuesForKey('foo')).to.deep.equal(allowedValues)
    })

    it('works with set, convert to array', function () {
      const allowedValues = new Set(['a', 'b'])
      const schema = new SimpleSchema({
        foo: Array,
        'foo.$': {
          type: String,
          allowedValues
        }
      })
      const fetchedAllowedValues = schema.getAllowedValuesForKey('foo')
      expect(fetchedAllowedValues.includes('a')).to.equal(true)
      expect(fetchedAllowedValues.includes('b')).to.equal(true)
      expect(fetchedAllowedValues.length).to.deep.equal(2)
    })

    it('returns null when allowedValues key is empty', function () {
      const schema = new SimpleSchema({
        foo: Array,
        'foo.$': {
          type: String
        }
      })
      expect(schema.getAllowedValuesForKey('foo')).to.deep.equal(null)
    })
  })
})
