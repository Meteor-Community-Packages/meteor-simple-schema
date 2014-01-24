/*
 * PUBLIC API
 */

SimpleSchemaValidationContext = function(ss) {
  var self = this;
  self._simpleSchema = ss;
  self._schema = ss.schema();
  self._schemaKeys = _.keys(self._schema);
  self._invalidKeys = [];
  //set up validation dependencies
  self._deps = {};
  self._depsAny = new Deps.Dependency;
  _.each(self._schemaKeys, function(name) {
    self._deps[name] = new Deps.Dependency;
  });
};

//validates the object against the simple schema and sets a reactive array of error objects
SimpleSchemaValidationContext.prototype.validate = function(doc, options) {
  var self = this;
  options = _.extend({
    modifier: false,
    upsert: false
  }, options || {});

  var invalidKeys = doValidation(doc, options.modifier, options.upsert, null, self._simpleSchema);

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
  _.each(changedKeys, function(name) {
    var genericName = makeGeneric(name);
    if (genericName in self._deps) {
      self._deps[genericName].changed();
    }
  });
  if (changedKeys.length) {
    self._depsAny.changed();
  }

  // Return true if it was valid; otherwise, return false
  return self._invalidKeys.length === 0;
};

//validates doc against self._schema for one key and sets a reactive array of error objects
SimpleSchemaValidationContext.prototype.validateOne = function(doc, keyName, options) {
  var self = this;
  options = _.extend({
    modifier: false
  }, options || {});

  var invalidKeys = doValidation(doc, options.modifier, options.upsert, keyName, self._simpleSchema);

  //now update self._invalidKeys and dependencies

  //remove objects from self._invalidKeys where name = keyName
  var newInvalidKeys = [];
  for (var i = 0, ln = self._invalidKeys.length, k; i < ln; i++) {
    k = self._invalidKeys[i];
    if (k.name !== keyName) {
      newInvalidKeys.push(k);
    }
  }
  self._invalidKeys = newInvalidKeys;

  //merge invalidKeys into self._invalidKeys
  for (var i = 0, ln = invalidKeys.length, k; i < ln; i++) {
    k = invalidKeys[i];
    self._invalidKeys.push(k);
  }

  //mark key as changed due to new validation (they may be valid now, or invalid in a different way)
  var genericName = makeGeneric(keyName);
  if (genericName in self._deps) {
    self._deps[genericName].changed();
  }
  self._depsAny.changed();

  // Return true if it was valid; otherwise, return false
  return !self._keyIsInvalid(keyName);
};

//reset the invalidKeys array
SimpleSchemaValidationContext.prototype.resetValidation = function() {
  var self = this;
  var removedKeys = _.pluck(self._invalidKeys, "name");
  self._invalidKeys = [];
  _.each(removedKeys, function(name) {
    var genericName = makeGeneric(name);
    if (genericName in self._deps) {
      self._deps[genericName].changed();
    }
  });
};

SimpleSchemaValidationContext.prototype.isValid = function() {
  var self = this;
  self._depsAny.depend();
  return !self._invalidKeys.length;
};

SimpleSchemaValidationContext.prototype.invalidKeys = function() {
  var self = this;
  self._depsAny.depend();
  return self._invalidKeys;
};

SimpleSchemaValidationContext.prototype._keyIsInvalid = function(name, genericName) {
  var self = this;
  genericName = genericName || makeGeneric(name);
  var specificIsInvalid = !!_.findWhere(self._invalidKeys, {name: name});
  var genericIsInvalid = (genericName !== name) ? (!!_.findWhere(self._invalidKeys, {name: genericName})) : false;
  return specificIsInvalid || genericIsInvalid;
};

SimpleSchemaValidationContext.prototype.keyIsInvalid = function(name) {
  var self = this, genericName = makeGeneric(name);
  self._deps[genericName].depend();
  return self._keyIsInvalid(name, genericName);
};

SimpleSchemaValidationContext.prototype.keyErrorMessage = function(name) {
  var self = this, genericName = makeGeneric(name);
  self._deps[genericName].depend();
  var errorObj = _.findWhere(self._invalidKeys, {name: name});
  if (!errorObj) {
    errorObj = _.findWhere(self._invalidKeys, {name: genericName});
  }
  return errorObj ? errorObj.message : "";
};

/*
 * PRIVATE
 */

var doValidation = function(obj, isModifier, isUpsert, keyToValidate, ss) {

  // First do some basic checks of the object, and throw errors if necessary
  if (!_.isObject(obj)) {
    throw new Error("The first argument of validate() or validateOne() must be an object");
  }

  if (isModifier) {
    if (_.isEmpty(obj)) {
      throw new Error("When the modifier option is true, validation object must have at least one operator");
    } else {
      var allKeysAreOperators = _.every(obj, function(v, k) {
        return (k.substring(0, 1) === "$");
      });
      if (!allKeysAreOperators) {
        throw new Error("When the modifier option is true, all validation object keys must be operators");
      }
    }
  } else if (looksLikeModifier(obj)) {
    throw new Error("When the validation object contains mongo operators, you must set the modifier option to true");
  }

  // If this is an upsert, add all the $setOnInsert keys to $set;
  // since we don't know whether it will be an insert or update, we'll
  // validate upserts as if they will be an insert.
  // TODO It would be more secure to validate twice, once as
  // an update and once as an insert, because $set validation does not
  // consider missing required keys to be an issue.
  if ("$setOnInsert" in obj) {
    if (isUpsert) {
      obj.$set = obj.$set || {};
      obj.$set = _.extend(obj.$set, obj.$setOnInsert);
    }
    delete obj.$setOnInsert;
  }

  var invalidKeys = [];
  
  var mDoc; // for caching the MongoObject if necessary

  // Validation function called for each affected key
  function validate(val, affectedKey, affectedKeyGeneric, def, op) {

    // Get the schema for this key, marking invalid if there isn't one.
    if (!def) {
      invalidKeys.push(errorObject("keyNotInSchema", affectedKey, val, def, ss));
      return;
    }

    // Check for missing required values. The general logic is this:
    // * If there's no operator, or if the operator is $set and it's an upsert,
    //   val must not be undefined, null, or an empty string.
    // * If there is an operator other than $unset or $rename, val must
    //   not be null or an empty string, but undefined is OK.
    // * If the operator is $unset or $rename, it's invalid.
    if (!def.optional) {
      if (op === "$unset" || op === "$rename" || isBlankNullOrUndefined(val)) {
        invalidKeys.push(errorObject("required", affectedKey, null, def, ss));
        return;
      }
    }

    // For $rename, make sure that the new name is allowed by the schema
    if (op === "$rename" && typeof val === "string" && !ss.allowsKey(val)) {
      invalidKeys.push(errorObject("keyNotInSchema", val, null, null, ss));
      return;
    }

    // Value checks are not necessary for null or undefined values,
    // or for certain operators.
    if (!_.contains(["$unset", "$rename", "$pull", "$pullAll", "$pop"], op)) {

      if (isSet(val)) {

        // Check that value is of the correct type
        var typeError = doTypeChecks(def, val, op);
        if (typeError) {
          invalidKeys.push(errorObject(typeError, affectedKey, val, def, ss));
          return;
        }

        // Check value against allowedValues array
        if (def.allowedValues && !_.contains(def.allowedValues, val)) {
          invalidKeys.push(errorObject("notAllowed", affectedKey, val, def, ss));
          return;
        }

      }

      // Check value using valusIsAllowed function
      if (def.valueIsAllowed && !def.valueIsAllowed(val, obj, op)) {
        invalidKeys.push(errorObject("notAllowed", affectedKey, val, def, ss));
        return;
      }

    }

    // Perform custom validation
    if (def.custom) {
      var errorType = def.custom.call({
        isSet: (val !== void 0),
        value: val,
        operator: op,
        field: function(fName) {
          mDoc = mDoc || new MongoObject(obj, ss._blackboxKeys); //create if necessary, cache for speed
          var keyInfo = mDoc.getArrayInfoForKey(fName) || mDoc.getInfoForKey(fName) || {};
          return {
            isSet: (keyInfo.value !== void 0),
            value: keyInfo.value,
            operator: keyInfo.operator
          };
        }
      });
      if (typeof errorType === "string") {
        invalidKeys.push(errorObject(errorType, affectedKey, val, def, ss));
        return;
      }
    }

    _.every(ss._validators.concat(SimpleSchema._validators), function(validator) {
      var errorType = validator.call({
        key: affectedKeyGeneric,
        definition: def,
        isSet: (val !== void 0),
        value: val,
        operator: op,
        field: function(fName) {
          mDoc = mDoc || new MongoObject(obj, ss._blackboxKeys); //create if necessary, cache for speed
          var keyInfo = mDoc.getArrayInfoForKey(fName) || mDoc.getInfoForKey(fName) || {};
          return {
            isSet: (keyInfo.value !== void 0),
            value: keyInfo.value,
            operator: keyInfo.operator
          };
        }
      }, affectedKeyGeneric, val, def, op); //pass args for backwards compatibility; don't use them
      if (typeof errorType === "string") {
        invalidKeys.push(errorObject(errorType, affectedKey, val, def, ss));
        return false;
      }
      return true;
    });
  }

  // The recursive function
  function checkObj(val, affectedKey, operator, adjusted) {
    var affectedKeyGeneric, def;

    // Adjust for first-level modifier operators
    if (!operator && affectedKey && affectedKey.substring(0, 1) === "$") {
      operator = affectedKey;
      affectedKey = null;
    }

    if (affectedKey) {

      // Adjust for $push and $addToSet
      if (!adjusted && (operator === "$push" || operator === "$addToSet")) {
        // Adjust for $each
        // We can simply jump forward and pretend like the $each array
        // is the array for the field. This has the added benefit of
        // skipping past any $slice, which we also don't care about.
        if (isBasicObject(val) && "$each" in val) {
          val = val.$each;
        } else {
          affectedKey = affectedKey + ".0";
        }
        adjusted = true;
      }

      // Make a generic version of the affected key, and use that
      // to get the schema for this key.
      affectedKeyGeneric = makeGeneric(affectedKey);
      def = ss.schema(affectedKeyGeneric);

      // Perform validation for this key
      if (!keyToValidate || keyToValidate === affectedKey || keyToValidate === affectedKeyGeneric) {
        validate(val, affectedKey, affectedKeyGeneric, def, operator);
      }
    }

    // Temporarily convert missing objects to empty objects
    // so that the looping code will be called and required
    // descendent keys can be validated.
    if ((val === void 0 || val === null) && (!def || (def.type === Object && !def.optional))) {
      val = {};
    }

    // Loop through arrays
    if (_.isArray(val)) {
      _.each(val, function(v, i) {
        checkObj(v, affectedKey + '.' + i, operator, adjusted);
      });
    }

    // Loop through object keys
    else if (isBasicObject(val)) {

      // Get list of present keys
      var presentKeys = _.keys(val);

      // For required checks, we want to also loop through all keys expected
      // based on the schema, in case any are missing.
      var requiredKeys, valueIsAllowedKeys;
      if (!isModifier || (isUpsert && operator === "$set") || (affectedKeyGeneric && affectedKeyGeneric.slice(-2) === ".$")) {
        requiredKeys = ss.requiredObjectKeys(affectedKeyGeneric);

        // Filter out required keys that are ancestors
        // of those in $set
        requiredKeys = _.filter(requiredKeys, function(k) {
          return !_.some(presentKeys, function(pk) {
            return (pk.slice(0, k.length + 1) === k + ".");
          });
        });
      }

      if (!isModifier || (operator === "$set") || (affectedKeyGeneric && affectedKeyGeneric.slice(-2) === ".$")) {

        // We want to be sure to call any present valueIsAllowed functions
        // even if the value isn't set, so they can be used for custom
        // required errors, such as basing it on another field's value.
        valueIsAllowedKeys = ss.valueIsAllowedObjectKeys(affectedKeyGeneric);

      }

      // Merge the lists
      var keysToCheck = _.union(presentKeys, requiredKeys || [], valueIsAllowedKeys || []);

      // Check all keys in the merged list
      _.each(keysToCheck, function(key) {
        if (shouldCheck(key)) {
          checkObj(val[key], appendAffectedKey(affectedKey, key), operator, adjusted);
        }
      });
    }

  }

  // Kick off the validation
  checkObj(obj);

  // Make sure there is only one error per fieldName
  var addedFieldNames = [];
  invalidKeys = _.filter(invalidKeys, function(errObj) {
    if (!_.contains(addedFieldNames, errObj.name)) {
      addedFieldNames.push(errObj.name);
      return true;
    }
    return false;
  });

  return invalidKeys;
};

var doTypeChecks = function(def, keyValue, op) {
  var expectedType = def.type;

  // If min/max are functions, call them
  var min = def.min;
  var max = def.max;
  if (typeof min === "function") {
    min = min();
  }
  if (typeof max === "function") {
    max = max();
  }

  // String checks
  if (expectedType === String) {
    if (typeof keyValue !== "string") {
      return "expectedString";
    } else if (max !== null && max < keyValue.length) {
      return "maxString";
    } else if (min !== null && min > keyValue.length) {
      return "minString";
    } else if (def.regEx instanceof RegExp && !def.regEx.test(keyValue)) {
      return "regEx";
    } else if (_.isArray(def.regEx)) {
      var regExError;
      _.every(def.regEx, function(re, i) {
        if (!re.test(keyValue)) {
          regExError = "regEx." + i;
          return false;
        }
        return true;
      });
      if (regExError)
        return regExError;
    }
  }

  // Number checks
  else if (expectedType === Number) {
    if (typeof keyValue !== "number") {
      return "expectedNumber";
    } else if (op !== "$inc" && max !== null && max < keyValue) {
      return "maxNumber";
    } else if (op !== "$inc" && min !== null && min > keyValue) {
      return "minNumber";
    } else if (!def.decimal && keyValue.toString().indexOf(".") > -1) {
      return "noDecimal";
    }
  }

  // Boolean checks
  else if (expectedType === Boolean) {
    if (typeof keyValue !== "boolean") {
      return "expectedBoolean";
    }
  }

  // Object checks
  else if (expectedType === Object) {
    if (!isBasicObject(keyValue)) {
      return "expectedObject";
    }
  }

  // Array checks
  else if (expectedType === Array) {
    if (!_.isArray(keyValue)) {
      return "expectedArray";
    } else if (def.minCount !== null && keyValue.length < def.minCount) {
      return "minCount";
    } else if (def.maxCount !== null && keyValue.length > def.maxCount) {
      return "maxCount";
    }
  }

  // Constructor function checks
  else if (expectedType instanceof Function || safariBugFix(expectedType)) {

    // Generic constructor checks
    if (!(keyValue instanceof expectedType)) {
      return "expectedConstructor";
    }

    // Date checks
    else if (expectedType === Date) {
      if (_.isDate(min) && min.getTime() > keyValue.getTime()) {
        return "minDate";
      } else if (_.isDate(max) && max.getTime() < keyValue.getTime()) {
        return "maxDate";
      }
    }
  }

};

/*
 * HELPERS
 */

var appendAffectedKey = function(affectedKey, key) {
  if (key === "$each") {
    return affectedKey;
  } else {
    return (affectedKey ? affectedKey + "." + key : key);
  }
};

var shouldCheck = function(key) {
  if (key === "$pushAll") {
    throw new Error("$pushAll is not supported; use $push + $each");
  }
  return !_.contains(["$pull", "$pullAll", "$pop", "$slice"], key);
};

var isBlank = function(str) {
  if (typeof str !== "string") {
    return false;
  }
  return (/^\s*$/).test(str);
};

var isBlankNullOrUndefined = function(str) {
  return (str === void 0 || str === null || isBlank(str));
};

var errorObject = function(errorType, keyName, keyValue, def, ss) {
  return {name: keyName, type: errorType, message: ss.messageForError(errorType, keyName, def, keyValue)};
};

// Tests whether it's an Object as opposed to something that inherits from Object
var isBasicObject = function(obj) {
  return _.isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;
};

// The latest Safari returns false for Uint8Array, etc. instanceof Function
// unlike other browsers.
var safariBugFix = function(type) {
  return (typeof Uint8Array !== "undefined" && type === Uint8Array)
          || (typeof Uint16Array !== "undefined" && type === Uint16Array)
          || (typeof Uint32Array !== "undefined" && type === Uint32Array)
          || (typeof Uint8ClampedArray !== "undefined" && type === Uint8ClampedArray);
};

var isSet = function(val) {
  return val !== void 0 && val !== null;
};

var makeGeneric = function(name) {
  if (typeof name !== "string")
    return null;

  return name.replace(/\.[0-9]+\./g, '.$.').replace(/\.[0-9]+/g, '.$');
};
