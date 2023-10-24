/* eslint-env mocha */
import expect from 'expect'
import { SimpleSchema } from './SimpleSchema'
import { Tracker } from 'meteor/tracker'

describe('Tracker reactivity', function () {
  it('works for labels', function (done) {
    const schema = new SimpleSchema({
      foo: {
        type: String,
        label: 'First'
      }
    }, { tracker: Tracker })

    const labelResults = []

    function checkResults () {
      expect(labelResults).toEqual([
        'First',
        'Second'
      ])
      done()
    }

    Tracker.autorun(function autorun () {
      labelResults.push(schema.label('foo'))
      if (labelResults.length === 2) checkResults()
    })

    schema.labels({ foo: 'Second' })
  })

  it('works for labels in subschemas', function (done) {
    const subSchema = new SimpleSchema({
      foo: {
        type: String,
        label: 'First'
      }
    })

    const schema = new SimpleSchema({
      sub: subSchema
    }, { tracker: Tracker })

    const labelResults = []

    function checkResults () {
      expect(labelResults).toEqual([
        'First',
        'Second'
      ])
      done()
    }

    Tracker.autorun(function autorun () {
      labelResults.push(schema.label('sub.foo'))
      if (labelResults.length === 2) checkResults()
    })

    subSchema.labels({ foo: 'Second' })
  })

  it('works for error messages', function (done) {
    const schema = new SimpleSchema({
      foo: {
        type: String,
        label: 'First'
      }
    }, { tracker: Tracker })

    const errorResults = []

    function checkResults () {
      expect(errorResults).toEqual([
        [],
        [
          {
            name: 'foo',
            type: 'required',
            value: undefined
          }
        ]
      ])
      done()
    }

    Tracker.autorun(function autorun () {
      errorResults.push(schema.namedContext().validationErrors())
      if (errorResults.length === 2) checkResults()
    })

    schema.namedContext().validate({})
  })

  it('works for error messages in subschemas', function (done) {
    const subSchema = new SimpleSchema({
      foo: {
        type: String,
        label: 'First'
      }
    })

    const schema = new SimpleSchema({
      sub: subSchema
    }, { tracker: Tracker })

    const errorResults = []

    function checkResults () {
      expect(errorResults).toEqual([
        [],
        [
          {
            name: 'sub',
            type: 'required',
            value: undefined
          },
          {
            name: 'sub.foo',
            type: 'required',
            value: undefined
          }
        ]
      ])
      done()
    }

    Tracker.autorun(function autorun () {
      errorResults.push(schema.namedContext().validationErrors())
      if (errorResults.length === 2) checkResults()
    })

    schema.namedContext().validate({})
  })
})
