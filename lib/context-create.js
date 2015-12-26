SimpleSchema.prototype.newContext = function () {
  return new SimpleSchema.ValidationContext(this);
};

SimpleSchema.prototype.namedContext = function(name) {
  var self = this;
  if (typeof name !== "string") name = "default";
  if (!self._validationContexts[name]) {
    self._validationContexts[name] = new SimpleSchema.ValidationContext(self);

    // In debug mode, log all invalid key errors to the browser console
    if (SimpleSchema.debug && Meteor.isClient) {
      Tracker.nonreactive(function() {
        logValidationErrorsForContext(self._validationContexts[name], name);
      });
    }
  }
  return self._validationContexts[name];
};

function logValidationErrorsForContext(context, name) {
  Meteor.startup(function() {
    Tracker.autorun(function() {
      if (!context.isValid()) {
        console.log('SimpleSchema invalid keys for "' + name + '" context:', context.validationErrors());
      }
    });
  });
}
