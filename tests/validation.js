Tinytest.add('SimpleSchema - validation - issue 314', function (test) {
  var arraySchema = new SimpleSchema({
    names: { type: [String] },
    testField: { type: String, optional: true }
  });

  var validationContext = arraySchema.newContext();

  var validObject = { names: ["String"] };
  test.isTrue(validationContext.validate(validObject));

  var validEmptyObject = { names: [] };
  test.isTrue(validationContext.validate(validEmptyObject));

  var invalidObject = { names: [{hello:"world"}] };
  test.isFalse(validationContext.validate(invalidObject));

  var certainlyInvalidObject = { zebra:"striped" };
  test.isFalse(validationContext.validate(certainlyInvalidObject));

  var evilObject = { names: [null] };
  test.isFalse(validationContext.validate(evilObject));

  var cleanMe = { names: [], testField: null };
  test.isTrue(validationContext.validate(cleanMe));

  arraySchema.clean(validObject);
  test.equal(validObject, {"names":["String"]});

  arraySchema.clean(validEmptyObject);
  test.equal(validEmptyObject, {"names":[]});

  arraySchema.clean(invalidObject);
  test.equal(invalidObject, {"names":[]});

  arraySchema.clean(certainlyInvalidObject);
  test.equal(certainlyInvalidObject, {});

  arraySchema.clean(evilObject, {removeNullsFromArrays: true});
  test.equal(evilObject, {"names":[]});

  arraySchema.clean(cleanMe);
  test.equal(cleanMe, { names: [], testField: null });

});
