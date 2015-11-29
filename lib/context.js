/*
 * PUBLIC API
 */

SimpleSchema.ValidationContext = function SimpleSchemaValidationContext(ss) {
  var self = this;
  self._simpleSchema = ss;
  self._schema = ss.schema();
  self._schemaKeys = _.keys(self._schema);
  self._invalidKeys = [];
  //set up validation dependencies
  self._deps = {};
  self._depsAny = new Tracker.Dependency();
  _.each(self._schemaKeys, function(name) {
    self._deps[name] = new Tracker.Dependency();
  });
};

//validates the object against the simple schema and sets a reactive array of error objects
SimpleSchema.ValidationContext.prototype.validate = function simpleSchemaValidationContextValidate(doc, options) {
  var self = this;
  options = _.extend({
    modifier: false,
    upsert: false,
    extendedCustomContext: {},
    ignore: [],
  }, options || {});

  //on the client we can add the userId if not already in the custom context
  if (Meteor.isClient && options.extendedCustomContext.userId === void 0) {
    options.extendedCustomContext.userId = (Meteor.userId && Meteor.userId()) || null;
  }

  var invalidKeys = doValidation(doc, options.modifier, options.upsert, null, self._simpleSchema, options.extendedCustomContext, options.ignore);

  //now update self._invalidKeys and dependencies

  //note any currently invalid keys so that we can mark them as changed
  //due to new validation (they may be valid now, or invalid in a different way)
  var removedKeys = _.pluck(self._invalidKeys, "name");

  //update
  self._invalidKeys = invalidKeys;

  //add newly invalid keys to changedKeys
  var addedKeys = _.pluck(self._invalidKeys, "name");

  //mark all changed keys as changed
  var changedKeys = _.union(addedKeys, removedKeys);
  self._markKeysChanged(changedKeys);

  // Return true if it was valid; otherwise, return false
  return self._invalidKeys.length === 0;
};

//validates doc against self._schema for one key and sets a reactive array of error objects
SimpleSchema.ValidationContext.prototype.validateOne = function simpleSchemaValidationContextValidateOne(doc, keyName, options) {
  var self = this, i, ln, k;
  options = _.extend({
    modifier: false,
    upsert: false,
    extendedCustomContext: {},
    ignore: [],
  }, options || {});

  //on the client we can add the userId if not already in the custom context
  if (Meteor.isClient && options.extendedCustomContext.userId === void 0) {
    options.extendedCustomContext.userId = (Meteor.userId && Meteor.userId()) || null;
  }

  var invalidKeys = doValidation(doc, options.modifier, options.upsert, keyName, self._simpleSchema, options.extendedCustomContext, options.ignore);

  //now update self._invalidKeys and dependencies

  // Remove existing objects from self._invalidKeys where name = keyName
  var newInvalidKeys = [];
  for (i = 0, ln = self._invalidKeys.length; i < ln; i++) {
    k = self._invalidKeys[i];
    if (k.name !== keyName) {
      newInvalidKeys.push(k);
    }
  }
  self._invalidKeys = newInvalidKeys;

  //merge invalidKeys into self._invalidKeys
  var changedKeys = [];
  for (i = 0, ln = invalidKeys.length; i < ln; i++) {
    k = invalidKeys[i];
    self._invalidKeys.push(k);
    changedKeys.push(k.name);
  }

  // Mark key as changed due to new validation (they may be valid now, or invalid in a different way)
  self._markKeysChanged(changedKeys);

  // Return true if it was valid; otherwise, return false
  return !invalidKeys.length;
};

//reset the invalidKeys array
SimpleSchema.ValidationContext.prototype.resetValidation = function simpleSchemaValidationContextResetValidation() {
  var self = this;
  var removedKeys = _.pluck(self._invalidKeys, "name");
  self._invalidKeys = [];
  self._markKeysChanged(removedKeys);
};

SimpleSchema.ValidationContext.prototype.isValid = function simpleSchemaValidationContextIsValid() {
  var self = this;
  self._depsAny.depend();
  return !self._invalidKeys.length;
};

SimpleSchema.ValidationContext.prototype.invalidKeys = function simpleSchemaValidationContextInvalidKeys() {
  var self = this;
  self._depsAny.depend();
  return self._invalidKeys;
};

SimpleSchema.ValidationContext.prototype.addInvalidKeys = function simpleSchemaValidationContextAddInvalidKeys(errors) {
  var self = this;

  if (!errors || !errors.length) return;

  var changedKeys = [];
  _.each(errors, function (errorObject) {
    changedKeys.push(errorObject.name);
    self._invalidKeys.push(errorObject);
  });

  self._markKeysChanged(changedKeys);
};

SimpleSchema.ValidationContext.prototype.removeInvalidKeys = function simpleSchemaValidationContextRemoveInvalidKeys() {
  var self = this;

  if (!self._invalidKeys || !self._invalidKeys.length) return;

  var changedKeys = [];
  _.each(self._invalidKeys, function (errorObject) {
    changedKeys.push(errorObject.name);
  });

  self._invalidKeys = [];

  self._markKeysChanged(changedKeys);
};

SimpleSchema.ValidationContext.prototype._markKeysChanged = function simpleSchemaValidationContextMarkKeysChanged(keys) {
  var self = this;

  if (!keys || !keys.length) {
    return;
  }

  _.each(keys, function(name) {
    var genericName = MongoObject.makeKeyGeneric(name);
    if (genericName in self._deps) {
      self._deps[genericName].changed();
    }
  });
  self._depsAny.changed();
};

SimpleSchema.ValidationContext.prototype._getInvalidKeyObject = function simpleSchemaValidationContextGetInvalidKeyObject(name, genericName) {
  var self = this;
  genericName = genericName || MongoObject.makeKeyGeneric(name);

  var errorObj = _.findWhere(self._invalidKeys, {name: name});
  if (!errorObj) errorObj = _.findWhere(self._invalidKeys, {name: genericName});
  return errorObj;
};

SimpleSchema.ValidationContext.prototype._keyIsInvalid = function simpleSchemaValidationContextKeyIsInvalid(name, genericName) {
  return !!this._getInvalidKeyObject(name, genericName);
};

// Like the internal one, but with deps
SimpleSchema.ValidationContext.prototype.keyIsInvalid = function simpleSchemaValidationContextKeyIsInvalid(name) {
  var self = this, genericName = MongoObject.makeKeyGeneric(name);
  self._deps[genericName] && self._deps[genericName].depend();

  return self._keyIsInvalid(name, genericName);
};

SimpleSchema.ValidationContext.prototype.keyErrorMessage = function simpleSchemaValidationContextKeyErrorMessage(name) {
  var self = this, genericName = MongoObject.makeKeyGeneric(name);
  self._deps[genericName] && self._deps[genericName].depend();

  var errorObj = self._getInvalidKeyObject(name, genericName);
  if (!errorObj) return "";

  return self._simpleSchema.messageForError(errorObj.type, errorObj.name, null, errorObj.value, errorObj.message);
};

SimpleSchema.ValidationContext.prototype.getErrorObject = function simpleSchemaValidationContextGetErrorObject() {
  var self = this, message, invalidKeys = this._invalidKeys;
  if (invalidKeys.length) {
    message = self.keyErrorMessage(invalidKeys[0].name);
    // We add `message` prop to the invalidKeys.
    invalidKeys = _.map(invalidKeys, function (o) {
      return _.extend({message: self.keyErrorMessage(o.name)}, o);
    });
  } else {
    message = "Failed validation";
  }
  var error = new Error(message);
  error.invalidKeys = invalidKeys;
  // If on the server, we add a sanitized error, too, in case we're
  // called from a method.
  if (Meteor.isServer) {
    error.sanitizedError = new Meteor.Error(400, message);
  }
  return error;
};

SimpleSchema.ValidationContext.prototype.clean = function simpleSchemaValidationContextClean() {
  return this._simpleSchema.clean.apply(this._simpleSchema, arguments);
};
