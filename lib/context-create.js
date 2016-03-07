SimpleSchema.prototype.newContext = function () {
  return new SimpleSchema.ValidationContext(this);
};

SimpleSchema.prototype.namedContext = function(name) {
  if (typeof name !== "string") name = "default";
  if (!this._validationContexts[name]) {
    this._validationContexts[name] = new SimpleSchema.ValidationContext(this);

    // In debug mode, log all invalid key errors to the browser console
    if (SimpleSchema.debug && Meteor.isClient) {
      Tracker.nonreactive(() => {
        logValidationErrorsForContext(this._validationContexts[name], name);
      });
    }
  }
  return this._validationContexts[name];
};

function logValidationErrorsForContext(context, name) {
  Meteor.startup(() => {
    Tracker.autorun(() => {
      if (!context.isValid()) {
        console.log(`SimpleSchema invalid keys for "${name}" context:`, context.validationErrors());
      }
    });
  });
}
