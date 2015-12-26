SimpleSchema.prototype.validate = function (obj, options) {
  if (typeof check === 'function' && Package['audit-argument-checks']) {
    // Call check but ignore the error to silence audit-argument-checks
    try { check(obj); } catch (e) { /* ignore error */ }
  }

  var validationContext = this.newContext();
  var isValid = validationContext.validate(obj, options);

  if (isValid) return;

  var errors = validationContext.validationErrors().map(function (error) {
    return {
      name: error.name,
      type: error.type,
      details: {
        value: error.value
      }
    };
  });

  // In order for the message at the top of the stack trace to be useful,
  // we set it to the first validation error message.
  var message = validationContext.keyErrorMessage(errors[0].name);

  throw new Package['mdg:validation-error'].ValidationError(errors, message);
};

SimpleSchema.prototype.validator = function (options) {
  var self = this;
  options = options || {};
  return function (obj) {
    if (options.clean === true) self.clean(obj, options);
    self.validate(obj);
  };
};
