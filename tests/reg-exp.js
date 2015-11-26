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
});
