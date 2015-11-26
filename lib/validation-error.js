SimpleSchema.prototype.validate = function (obj) {
  var validationContext = this.newContext();
  var isValid = validationContext.validate(obj);

  if (isValid) return;

  var errors = validationContext.invalidKeys().map(function (error) {
    return {
      name: error.name,
      type: error.type,
      details: {
        value: error.value
      }
    };
  });

  throw new Package['mdg:validation-error'].ValidationError(errors);
};

SimpleSchema.prototype.validator = function () {
  var self = this;
  // XXX Could eventually accept options and customize/filter the validation a bit
  // or allow automatic cleaning
  return function (obj) {
    self.validate(obj);
  };
};
