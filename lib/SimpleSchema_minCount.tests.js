/* eslint-env mocha */
import friendsSchema from './testHelpers/friendsSchema'
import expectErrorLength from './testHelpers/expectErrorLength'

describe('SimpleSchema - minCount', function () {
  it('ensures array count is at least the minimum', function () {
    expectErrorLength(friendsSchema, {
      friends: [],
      enemies: []
    }).toEqual(1)

    expectErrorLength(friendsSchema, {
      $set: {
        friends: []
      }
    }, { modifier: true }).toEqual(1)

    expectErrorLength(friendsSchema, {
      $setOnInsert: {
        friends: [],
        enemies: []
      }
    }, { modifier: true, upsert: true }).toEqual(1)
  })
})
