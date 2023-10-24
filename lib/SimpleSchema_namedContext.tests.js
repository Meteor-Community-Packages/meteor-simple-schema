/* eslint-env mocha */
import expect from 'expect'
import { SimpleSchema } from './SimpleSchema'

describe('SimpleSchema - namedContext', function () {
  it('returns a named context', function () {
    const schema = new SimpleSchema({})
    const context = schema.namedContext('form')
    expect(context.name).toBe('form')
    expect(schema._validationContexts.form).toBe(context)
  })

  it('returns a context named "default" if no name is passed', function () {
    const schema = new SimpleSchema({})
    const context = schema.namedContext()
    expect(context.name).toBe('default')
    expect(schema._validationContexts.default).toBe(context)
  })

  it('returns the same context instance when called with the same name', function () {
    const schema = new SimpleSchema({})
    const context1 = schema.namedContext('abc')
    expect(schema._validationContexts.abc).toBe(context1)
    const context2 = schema.namedContext('abc')
    expect(context2).toBe(context1)
  })
})
