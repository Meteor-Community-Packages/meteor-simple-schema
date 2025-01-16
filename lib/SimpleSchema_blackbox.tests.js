/* eslint-disable func-names, prefer-arrow-callback */

import expectErrorLength from './testHelpers/expectErrorLength'
import { SimpleSchema } from './SimpleSchema'

const schema = new SimpleSchema({
  blackBoxObject: {
    type: Object,
    optional: true,
    blackbox: true
  }
})

describe('SimpleSchema - blackbox', function () {
  it('allows an empty object', function () {
    expectErrorLength(schema, {
      blackBoxObject: {}
    }).to.deep.equal(0)
  })

  it('allows any properties', function () {
    expectErrorLength(schema, {
      blackBoxObject: {
        foo: 'bar'
      }
    }).to.deep.equal(0)
  })

  it('allows any properties on $set object', function () {
    expectErrorLength(schema, {
      $set: {
        blackBoxObject: {
          foo: 'bar'
        }
      }
    }, { modifier: true }).to.deep.equal(0)
  })

  it('allows to $set any subobject', function () {
    expectErrorLength(schema, {
      $set: {
        'blackBoxObject.foo': 'bar'
      }
    }, { modifier: true }).to.deep.equal(0)

    expectErrorLength(schema, {
      $set: {
        'blackBoxObject.1': 'bar'
      }
    }, { modifier: true }).to.deep.equal(0)
  })

  it('allows to $push into any subobject', function () {
    expectErrorLength(schema, {
      $push: {
        'blackBoxObject.foo': 'bar'
      }
    }, { modifier: true }).to.deep.equal(0)
  })
})
