SimpleSchema.prototype.validate = function (obj, options) {
  if (typeof check === 'function' && Package['audit-argument-checks']) {
    // Call check but ignore the error to silence audit-argument-checks
    try { check(obj); } catch (e) { /* ignore error */ }
  }

  let validationContext = this.newContext();
  let isValid = validationContext.validate(obj, options);

  if (isValid) return;

  let errors = validationContext.validationErrors().map(function (error) {
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
  let message = validationContext.keyErrorMessage(errors[0].name);

  throw new Package['mdg:validation-error'].ValidationError(errors, message);
};

SimpleSchema.prototype.validator = function (options = {}) {
  return (obj) => {
    if (options.clean === true) this.clean(obj, options);
    this.validate(obj);
  };
};
