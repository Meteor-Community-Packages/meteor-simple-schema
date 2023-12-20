/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai';
import { SimpleSchema } from './SimpleSchema';

describe('SimpleSchema - namedContext', function () {
  it('returns a named context', function () {
    const schema = new SimpleSchema({});
    const context = schema.namedContext('form');
    expect(context.name).to.equal('form');
    expect(schema._validationContexts.form).to.equal(context);
  });

  it('returns a context named "default" if no name is passed', function () {
    const schema = new SimpleSchema({});
    const context = schema.namedContext();
    expect(context.name).to.equal('default');
    expect(schema._validationContexts.default).to.equal(context);
  });

  it('returns the same context instance when called with the same name', function () {
    const schema = new SimpleSchema({});
    const context1 = schema.namedContext('abc');
    expect(schema._validationContexts.abc).to.equal(context1);
    const context2 = schema.namedContext('abc');
    expect(context2).to.equal(context1);
  });
});
