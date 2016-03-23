import { SimpleSchema } from 'meteor/aldeed:simple-schema';

Tinytest.add('SimpleSchema - pick', function (test) {
  var schema = new SimpleSchema({
    foo: {type: Object},
    'foo.bar': {type: String},
    fooArray: {type: Array},
    'fooArray.$': {type: Object},
    'fooArray.$.bar': {type: String}
  });

  var newSchema = schema.pick('foo');
  test.equal(_.keys(newSchema.schema()), ['foo', 'foo.bar']);

  newSchema = schema.pick('fooArray');
  test.equal(_.keys(newSchema.schema()), ['fooArray', 'fooArray.$', 'fooArray.$.bar']);

  newSchema = schema.pick('foo', 'fooArray');
  test.equal(_.keys(newSchema.schema()), ['foo', 'foo.bar', 'fooArray', 'fooArray.$', 'fooArray.$.bar']);

  newSchema = schema.pick('blah');
  test.equal(_.keys(newSchema.schema()), []);
});
