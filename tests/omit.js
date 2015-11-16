Tinytest.add('SimpleSchema - omit', function (test) {
  var schema = new SimpleSchema({
    foo: {type: Object},
    'foo.bar': {type: String},
    fooArray: {type: Array},
    'fooArray.$': {type: Object},
    'fooArray.$.bar': {type: String}
  });

  var newSchema = schema.omit('foo');
  test.equal(_.keys(newSchema.schema()), ['fooArray', 'fooArray.$', 'fooArray.$.bar']);

  newSchema = schema.omit('fooArray');
  test.equal(_.keys(newSchema.schema()), ['foo', 'foo.bar']);

  newSchema = schema.omit('foo', 'fooArray');
  test.equal(_.keys(newSchema.schema()), []);

  newSchema = schema.omit('blah');
  test.equal(_.keys(newSchema.schema()), ['foo', 'foo.bar', 'fooArray', 'fooArray.$', 'fooArray.$.bar']);
});
