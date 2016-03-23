import { SimpleSchema } from 'meteor/aldeed:simple-schema';

Tinytest.add('SimpleSchema - regEx - issue 409', function (test) {
  // Make sure no regEx errors for optional
  var schema = new SimpleSchema({
    foo: {
      type: String,
      optional: true,
      regEx: /bar/
    }
  });

  test.isTrue(schema.newContext().validate({}));
  test.isTrue(schema.newContext().validate({foo: null}));
  test.isFalse(schema.newContext().validate({foo: ''}));
});
