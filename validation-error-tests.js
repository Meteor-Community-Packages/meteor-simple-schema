Tinytest.add('SimpleSchema - ValidationErrors', function (test) {
  var schema = new SimpleSchema({
    int: { type: Number },
    string: { type: String },
  });

  function verify(error) {
    test.equal(error.errorType, 'Meteor.Error');
    test.equal(error.error, 'validation-error');
    test.equal(error.details.length, 2);
    test.equal(error.details[0].name, 'int');
    test.equal(error.details[0].type, 'expectedNumber');
    test.equal(error.details[1].name, 'string');
    test.equal(error.details[1].type, 'required');

    // In order for the message at the top of the stack trace to be useful,
    // we set it to the first validation error message.
    test.equal(error.reason, 'Int must be a number');
    test.equal(error.message, 'Int must be a number [validation-error]');
  }

  try {
    schema.validate({int: '5'});
  } catch (error) {
    verify(error);
  }

  try {
    schema.validator()({int: '5'});
  } catch (error) {
    verify(error);
  }

  try {
    schema.validator({clean: true})({int: '5'});
  } catch (error) {
    test.ok();
  }
});
