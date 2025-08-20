import { expect } from 'chai'
import { SimpleSchema } from './SimpleSchema'
import { Tracker } from 'meteor/tracker'

it('Tracker reactivity works for labels', function (done) {
  const schema = new SimpleSchema({
    foo: {
      type: String,
      label: 'First'
    }
  }, { tracker: Tracker })

  const labelResults = []
  function checkResults () {
    expect(labelResults).to.deep.equal([
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

it('Tracker reactivity works for labels in subschemas', function (done) {
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
    expect(labelResults).to.deep.equal([
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

it('Tracker reactivity works for error messages', function (done) {
  const schema = new SimpleSchema({
    foo: {
      type: String,
      label: 'First'
    }
  }, { tracker: Tracker })

  const errorResults = []
  function checkResults () {
    expect(errorResults).to.deep.equal([
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

it('Tracker reactivity works for error messages in subschemas', function (done) {
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
    expect(errorResults).to.deep.equal([
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
