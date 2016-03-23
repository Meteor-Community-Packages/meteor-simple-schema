import { SimpleSchema } from 'meteor/aldeed:simple-schema';

Tinytest.add('SimpleSchema - ValidationErrors', function (test) {
  const schema = new SimpleSchema({
    int: SimpleSchema.Integer,
    string: String,
  });

  function verify(error) {
    test.equal(error.errorType, 'Meteor.Error');
    test.equal(error.error, 'validation-error');
    test.equal(error.details.length, 2);
    test.equal(error.details[0].name, 'int');
    test.equal(error.details[0].type, SimpleSchema.ErrorTypes.EXPECTED_TYPE);
    test.equal(error.details[1].name, 'string');
    test.equal(error.details[1].type, SimpleSchema.ErrorTypes.REQUIRED);

    // In order for the message at the top of the stack trace to be useful,
    // we set it to the first validation error message.
    test.equal(error.reason, 'Int must be of type Integer');
    test.equal(error.message, 'Int must be of type Integer [validation-error]');
  }

  try {
    schema.validate({int: '5'});
  } catch (error) {
    verify(error);
  }

  try {
    SimpleSchema.validate({int: '5'}, schema);
  } catch (error) {
    verify(error);
  }

  try {
    SimpleSchema.validate({int: '5'}, {
      int: SimpleSchema.Integer,
      string: String,
    });
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
