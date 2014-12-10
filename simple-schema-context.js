/* global SimpleSchema */
/* global SimpleSchemaValidationContext:true */
/* global doValidation1 */
/* global doValidation2 */

function doValidation(obj, isModifier, isUpsert, keyToValidate, ss, extendedCustomContext) {
  var useOld = true; //for now this can be manually changed to try the experimental method, which doesn't yet work properly
  var func = useOld ? doValidation1 : doValidation2;
  return func(obj, isModifier, isUpsert, keyToValidate, ss, extendedCustomContext);
}

/*
 * PUBLIC API
 */

SimpleSchemaValidationContext = function SimpleSchemaValidationContext(ss) {
  var self = this;
  self._simpleSchema = ss;
  self._schema = ss.schema();
  self._schemaKeys = _.keys(self._schema);
  self._invalidKeys = [];
  //set up validation dependencies
  self._deps = {};
  self._depsAny = new Deps.Dependency();
  _.each(self._schemaKeys, function(name) {
    self._deps[name] = new Deps.Dependency();
  });
};

//validates the object against the simple schema and sets a reactive array of error objects
SimpleSchemaValidationContext.prototype.validate = function simpleSchemaValidationContextValidate(doc, options) {
  var self = this;
  options = _.extend({
    modifier: false,
    upsert: false,
    extendedCustomContext: {}
  }, options || {});

  //on the client we can add the userId if not already in the custom context
  if (Meteor.isClient && options.extendedCustomContext.userId === void 0) {
    options.extendedCustomContext.userId = (Meteor.userId && Meteor.userId()) || null;
  }

  var invalidKeys = doValidation(doc, options.modifier, options.upsert, null, self._simpleSchema, options.extendedCustomContext);

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
SimpleSchemaValidationContext.prototype.validateOne = function simpleSchemaValidationContextValidateOne(doc, keyName, options) {
  var self = this, i, ln, k;
  options = _.extend({
    modifier: false,
    upsert: false,
    extendedCustomContext: {}
  }, options || {});

  //on the client we can add the userId if not already in the custom context
  if (Meteor.isClient && options.extendedCustomContext.userId === void 0) {
    options.extendedCustomContext.userId = (Meteor.userId && Meteor.userId()) || null;
  }

  var invalidKeys = doValidation(doc, options.modifier, options.upsert, keyName, self._simpleSchema, options.extendedCustomContext);

  //now update self._invalidKeys and dependencies

  //remove objects from self._invalidKeys where name = keyName
  var newInvalidKeys = [];
  for (i = 0, ln = self._invalidKeys.length; i < ln; i++) {
    k = self._invalidKeys[i];
    if (k.name !== keyName) {
      newInvalidKeys.push(k);
    }
  }
  self._invalidKeys = newInvalidKeys;

  //merge invalidKeys into self._invalidKeys
  for (i = 0, ln = invalidKeys.length; i < ln; i++) {
    k = invalidKeys[i];
    self._invalidKeys.push(k);
  }

  //mark key as changed due to new validation (they may be valid now, or invalid in a different way)
  self._markKeysChanged([keyName]);

  // Return true if it was valid; otherwise, return false
  return !self._keyIsInvalid(keyName);
};

//reset the invalidKeys array
SimpleSchemaValidationContext.prototype.resetValidation = function simpleSchemaValidationContextResetValidation() {
  var self = this;
  var removedKeys = _.pluck(self._invalidKeys, "name");
  self._invalidKeys = [];
  self._markKeysChanged(removedKeys);
};

SimpleSchemaValidationContext.prototype.isValid = function simpleSchemaValidationContextIsValid() {
  var self = this;
  self._depsAny.depend();
  return !self._invalidKeys.length;
};

SimpleSchemaValidationContext.prototype.invalidKeys = function simpleSchemaValidationContextInvalidKeys() {
  var self = this;
  self._depsAny.depend();
  return self._invalidKeys;
};

SimpleSchemaValidationContext.prototype.addInvalidKeys = function simpleSchemaValidationContextAddInvalidKeys(errors) {
  var self = this;

  if (!errors || !errors.length) {
    return;
  }

  var changedKeys = [];
  _.each(errors, function (errorObject) {
    changedKeys.push(errorObject.name);
    self._invalidKeys.push(errorObject);
  });

  self._markKeysChanged(changedKeys);
};

SimpleSchemaValidationContext.prototype._markKeysChanged = function simpleSchemaValidationContextMarkKeysChanged(keys) {
  var self = this;

  if (!keys || !keys.length) {
    return;
  }

  _.each(keys, function(name) {
    var genericName = SimpleSchema._makeGeneric(name);
    if (genericName in self._deps) {
      self._deps[genericName].changed();
    }
  });
  self._depsAny.changed();
};

SimpleSchemaValidationContext.prototype._getInvalidKeyObject = function simpleSchemaValidationContextGetInvalidKeyObject(name, genericName) {
  var self = this;
  genericName = genericName || SimpleSchema._makeGeneric(name);

  var errorObj = _.findWhere(self._invalidKeys, {name: name});
  if (!errorObj) {
    errorObj = _.findWhere(self._invalidKeys, {name: genericName});
  }
  return errorObj;
};

SimpleSchemaValidationContext.prototype._keyIsInvalid = function simpleSchemaValidationContextKeyIsInvalid(name, genericName) {
  return !!this._getInvalidKeyObject(name, genericName);
};

// Like the internal one, but with deps
SimpleSchemaValidationContext.prototype.keyIsInvalid = function simpleSchemaValidationContextKeyIsInvalid(name) {
  var self = this, genericName = SimpleSchema._makeGeneric(name);
  self._deps[genericName] && self._deps[genericName].depend();

  return self._keyIsInvalid(name, genericName);
};

SimpleSchemaValidationContext.prototype.keyErrorMessage = function simpleSchemaValidationContextKeyErrorMessage(name) {
  var self = this, genericName = SimpleSchema._makeGeneric(name);
  self._deps[genericName] && self._deps[genericName].depend();
  
  var errorObj = self._getInvalidKeyObject(name, genericName);
  if (!errorObj) {
    return "";
  }
  
  return self._simpleSchema.messageForError(errorObj.type, errorObj.name, null, errorObj.value);
};

SimpleSchemaValidationContext.prototype.getErrorObject = function simpleSchemaValidationContextGetErrorObject() {
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
