var pullOps = ["$pull", "$pullAll", "$pop"];
var noCheckOps = ["$unset", "$rename", "$pull", "$pullAll", "$pop"];

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

  var invalidKeys = doValidation(doc, options.modifier, options.upsert, null, self._simpleSchema, self._schema);

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
  var d = self._deps;
  _.each(changedKeys, function(name) {
    if (name in d) {
      d[name].changed();
    }
  });
  if (changedKeys.length) {
    self._depsAny.changed();
  }
};

//validates doc against self._schema for one key and sets a reactive array of error objects
SimpleSchemaValidationContext.prototype.validateOne = function(doc, keyName, options) {
  var self = this;
  options = _.extend({
    modifier: false
  }, options || {});

  var invalidKeys = doValidation(doc, options.modifier, options.upsert, keyName, self._simpleSchema, self._schema);

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
  self._deps[keyName].changed();
  self._depsAny.changed();
};

//this is where all the validation happens for a particular key for a single operator
var recursivelyValidate = function(operator, def, keyName, arrayPos, keyValue, ss, fullDoc, allKeys, keyToValidate, isUpsert) {
  var invalidKeys = [], requiredError;
  var schemaKeyName = numToDollar(keyName); //replace .Number. with .$. in key

  if (keyToValidate && keyToValidate !== schemaKeyName) {
    return invalidKeys;
  }

  if (operator === "$pushAll")
    throw new Error("$pushAll is not supported; use $push + $each");

  def = def || ss.schema(schemaKeyName);

  if (!def) {
    invalidKeys.push(errorObject("keyNotInSchema", schemaKeyName, keyValue, def, ss));
    return invalidKeys;
  }

  var expectedType = def.type;

  // Adjust keyValue for $each
  var isEach = false;
  if (_.isObject(keyValue) && "$each" in keyValue) {
    keyValue = keyValue.$each;
    isEach = true;
  }

  // Adjust expectedType for $push and $addToSet
  if (!isEach && (operator === "$push" || operator === "$addToSet") && _.isArray(expectedType)) {
    expectedType = expectedType[0];
    arrayPos = "$";
  }

  // We did most "required" validation previously, but it is easier to check
  // required keys in subobjects now.
  var dollarPos = schemaKeyName.indexOf(".");
  if (dollarPos !== -1) {
    if (!operator || operator === "$push" || operator === "$addToSet") {
      requiredError = validateRequired(schemaKeyName, keyValue, def, ss);
    } else if (operator === "$set") {
      if (keyValue !== void 0 || isUpsert) {
        requiredError = validateRequired(schemaKeyName, keyValue, def, ss);
      }
    } else if (!def.optional && (operator === "$unset" || operator === "$rename")) {
      requiredError = errorObject("required", schemaKeyName, null, def, ss);
    }

    if (requiredError) {
      invalidKeys.push(requiredError);
      return invalidKeys; //once we've logged a required error for the key, no further checking is necessary
    }
  }

  // For $rename, make sure that the new name is allowed by the schema
  if (operator === "$rename") {
    if (keyValue && typeof keyValue === "string" && !ss.allowsKey(keyValue)) {
      invalidKeys.push(errorObject("keyNotInSchema", keyValue, null, null, ss));
      return invalidKeys;
    }
  }

  // Recurse into objects if necessary
  if (operator !== "$unset" && operator !== "$rename" && expectedType === Object) {
    var keysToCheck, additionalKeys, checkObj;
    var keyPrefix = schemaKeyName + ".";
    var isArrayItem = false;
    if (arrayPos !== void 0 && arrayPos !== null) {
      keyPrefix += arrayPos + ".";
      isArrayItem = true;
    }

    checkObj = isBasicObject(keyValue) ? keyValue : {};
    additionalKeys = ((isArrayItem && isSet(keyValue)) || !isArrayItem) ? ss.requiredObjectKeys(numToDollar(keyPrefix)) : [];

    // In addition to all keys in the object, we'll check any required object
    // keys that are not in the object. This will cause a "required" validation
    // error.
    //if (operator === "$push" || operator === "$addToSet") {
    //  keysToCheck = _.keys(checkObj);
    //} else {
      keysToCheck = _.union(_.keys(checkObj), additionalKeys);
    //}

    //recursive calls
    var childVal;
    _.each(keysToCheck, function(k) {
      //recurse only if the key wasn't checked at the first level, due to being passed in under a modifier operator
      if (_.contains(allKeys, keyPrefix + k))
        return;

      childVal = checkObj[k];

      if (isArrayItem && childVal === void 0)
        childVal = null; //within arrays, use null instead of undefined so that $set knows to consider required fields invalid

      invalidKeys = _.union(invalidKeys, recursivelyValidate(operator, null, keyPrefix + k, null, childVal, ss, fullDoc, allKeys, keyToValidate, isUpsert));
    });
  }

  // Recurse into arrays if necessary
  if (isSet(keyValue) && !_.contains(pullOps, operator) && _.isArray(expectedType)) {
    // If it's an array, loop through it and validate each value in the array
    if (_.isArray(keyValue)) {
      var childDef = _.clone(def), loopVal;
      childDef.type = def.type[0]; //strip array off of type
      for (var i = 0, ln = keyValue.length; i < ln; i++) {
        loopVal = keyValue[i];
        invalidKeys = _.union(invalidKeys, recursivelyValidate(operator, childDef, schemaKeyName, i, loopVal, ss, fullDoc, allKeys, keyToValidate, isUpsert));
      }
    } else {
      invalidKeys.push(errorObject("expectedArray", schemaKeyName, keyValue, def, ss));
    }
    return invalidKeys;
  }

  // Type checks are not necessary for null or undefined values,
  // or for certain operators,
  // regardless of whether the key is required or not.
  if (isSet(keyValue) && !_.contains(noCheckOps, operator)) {
    invalidKeys = _.union(invalidKeys, doTypeChecks(def, expectedType, schemaKeyName, keyValue, ss));
  }

  // Call custom validation
  var validatorCount = ss._validators.length;
  if (validatorCount) {
    for (var i = 0, validator, result; i < validatorCount; i++) {
      validator = ss._validators[i];
      result = validator(schemaKeyName, keyValue, def, operator);
      if (result !== true && typeof result === "string") {
        invalidKeys.push(errorObject(result, schemaKeyName, keyValue, def, ss));
        break;
      }
    }
  }

  // Check to make sure the value is allowed.
  // This is the last thing we want to do for all data types.
  if (isSet(keyValue) && def.allowedValues && !_.contains(noCheckOps, operator)) {
    if (!_.contains(def.allowedValues, keyValue)) {
      invalidKeys.push(errorObject("notAllowed", schemaKeyName, keyValue, def, ss));
    }
  }

  if (typeof def.valueIsAllowed === "function" && operator !== "$unset" && operator !== "$rename" ) {
    if (!def.valueIsAllowed(keyValue, fullDoc, operator)) {
      invalidKeys.push(errorObject("notAllowed", schemaKeyName, keyValue, def, ss));
    }
  }

  return invalidKeys;
};

//reset the invalidKeys array
SimpleSchemaValidationContext.prototype.resetValidation = function() {
  var self = this;
  var removedKeys = _.pluck(self._invalidKeys, "name");
  self._invalidKeys = [];
  _.each(removedKeys, function(name) {
    self._deps[name].changed();
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

SimpleSchemaValidationContext.prototype.keyIsInvalid = function(name) {
  var self = this;
  self._deps[name].depend();
  return !!_.findWhere(self._invalidKeys, {name: name});
};

SimpleSchemaValidationContext.prototype.keyErrorMessage = function(name) {
  var self = this;
  self._deps[name].depend();
  var errorObj = _.findWhere(self._invalidKeys, {name: name});
  return errorObj ? errorObj.message : "";
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

var validateRequired = function(keyName, keyValue, def, ss) {
  if (!def.optional && isBlankNullOrUndefined(keyValue)) {
    return errorObject("required", keyName, null, def, ss);
  }
};

var validateArray = function(keyName, keyValue, def, ss) {
  if (_.isArray(def.type) && !isBlankNullOrUndefined(keyValue)) {
    if (!_.isArray(keyValue)) {
      return errorObject("expectedArray", keyName, null, def, ss);
    } else if (def.minCount && keyValue.length < def.minCount) {
      return errorObject("minCount", keyName, null, def, ss);
    } else if (def.maxCount && keyValue.length > def.maxCount) {
      return errorObject("maxCount", keyName, null, def, ss);
    }
  }
};

var getRequiredAndArrayErrors = function(doc, keyName, def, ss, hasModifiers, isUpsert, hasSet, hasUnset, hasRename) {
  var keyValue, requiredError, arrayError;

  //if (keyName === "requiredString" && )

  if (hasModifiers) {
    //Do required checks for modifiers. The general logic is this:
    //if required, then:
    //-in $set with isUpsert=false, val must not be null or empty string (undefined is OK), AND
    //-in $set with isUpsert=true, val must not be undefined, null, or empty string, AND
    //-in $unset, key must not be present, AND
    //-in $rename, key must not be present
    //But make sure only one required error is logged per keyName, and we'll validate
    //subkeys later
    if (hasSet) {
      keyValue = doc.$set[keyName];

      //check for missing required, unless undefined,
      //except validate required keys in objects in arrays later, when looping through doc ("foo.$.bar")
      if ((keyValue !== void 0 || isUpsert) && keyName.indexOf(".") === -1) {
        requiredError = validateRequired(keyName, keyValue, def, ss);
      }
    }

    if (!requiredError && hasUnset && !def.optional && (keyName in doc.$unset)) {
      requiredError = errorObject("required", keyName, null, def, ss);
    }

    if (!requiredError && hasRename && !def.optional && (keyName in doc.$rename)) {
      requiredError = errorObject("required", keyName, null, def, ss);
    }
  } else {

    //Do required checks for normal objects. The general logic is this:
    //if required, then the key must be present and it's value
    //must not be undefined, null, or an empty string
    keyValue = doc[keyName];

    //check for missing required,
    //except validate required keys in objects in arrays later, when looping through doc ("foo.$.bar")
    if (keyName.indexOf(".") === -1) {
      requiredError = validateRequired(keyName, keyValue, def, ss);
    }
  }

  if (requiredError) {
    return requiredError; //once we've logged a required error for the key, no further checking is necessary
  }

  //Second do array checks
  return validateArray(keyName, keyValue, def, ss);
};

var validateObj = function(obj, fullDoc, keyToValidate, invalidKeys, ss, operator, isUpsert) {
  var allKeys = _.keys(obj);
  //for required checks, we want to loop through all keys in the object
  //plus all keys expected based on the schema, in case any are missing
  var keysToCheck = _.union(allKeys, ss.firstLevelSchemaKeys());
  _.each(keysToCheck, function(key) {
    invalidKeys = _.union(invalidKeys, recursivelyValidate(operator, null, key, null, obj[key], ss, fullDoc, allKeys, keyToValidate, isUpsert));
  });

  //make sure there is only one error per fieldName
  var uniqueInvalidKeys = [];
  _.each(invalidKeys, function(errObj) {
    if (!_.findWhere(uniqueInvalidKeys, {name: errObj.name})) {
      uniqueInvalidKeys.push(errObj);
    }
  });

  return uniqueInvalidKeys;
};

var doValidation = function(doc, isModifier, isUpsert, keyToValidate, ss, schema) {
  //check arguments
  if (!_.isObject(doc)) {
    throw new Error("The first argument of validate() or validateOne() must be an object");
  }

  if (!isModifier && looksLikeModifier(doc)) {
    throw new Error("When the validation object contains mongo operators, you must set the modifier option to true");
  }

  //if this is an upsert, just add all the $setOnInsert keys to $set;
  //since we don't know whether it will be an insert or update, we'll
  //validate upserts as if they will be an insert
  if ("$setOnInsert" in doc) {
    if (isUpsert) {
      doc["$set"] = doc["$set"] || {};
      _.extend(doc["$set"], doc["$setOnInsert"]);
    }
    delete doc["$setOnInsert"];
  }

  var invalidKeys = [];
  var hasSet = ("$set" in doc);
  var hasUnset = ("$unset" in doc);
  var hasRename = ("$rename" in doc);

  //first, loop through schema to do required and array checks
  var found = false, validationError;
  _.each(schema, function(def, keyName) {
    if (keyToValidate) {
      if (keyToValidate === keyName) {
        found = true;
      } else {
        return;
      }
    }
    validationError = getRequiredAndArrayErrors(doc, keyName, def, ss, isModifier, isUpsert, hasSet, hasUnset, hasRename);
    validationError && invalidKeys.push(validationError);
  });

  if (keyToValidate && !found) {
    throw new Error("The schema contains no key named " + keyToValidate);
  }

  if (isModifier) {
    //second, loop through present modifiers
    _.each(doc, function(modObj, operator) {
      if (operator.substring(0, 1) !== "$") {
        throw new Error("When the modifier option is true, all validation object keys must be operators");
      }
      if (!isUpsert && operator === "$set" && _.isObject(modObj) && _.isEmpty(modObj))
        return; //special rare case; $set obj with no keys shouldn't cause errors unless it's an upsert
      invalidKeys = _.union(invalidKeys, validateObj(modObj, doc, keyToValidate, invalidKeys, ss, operator, isUpsert));
    });
  } else {
    //second, loop through doc and validate all keys that are present
    invalidKeys = _.union(invalidKeys, validateObj(doc, doc, keyToValidate, invalidKeys, ss, null, isUpsert));
  }

  return invalidKeys;
};

var doTypeChecks = function(def, expectedType, schemaKeyName, keyValue, ss) {
  var invalidKeys = [];
  //If min/max are functions, call them
  var min = def.min;
  var max = def.max;
  if (typeof min === "function") {
    min = min();
  }
  if (typeof max === "function") {
    max = max();
  }

  //Type Checking
  if (expectedType === String) {
    if (typeof keyValue !== "string") {
      invalidKeys.push(errorObject("expectedString", schemaKeyName, keyValue, def, ss));
    } else if (def.regEx) {
      if (def.regEx instanceof RegExp) {
        if (!def.regEx.test(keyValue)) {
          invalidKeys.push(errorObject("regEx", schemaKeyName, keyValue, def, ss));
        }
      } else {
        //it's an array with multiple regEx
        var re;
        for (var i = 0, ln = def.regEx.length; i < ln; i++) {
          re = def.regEx[i];
          if (!re.test(keyValue)) {
            invalidKeys.push(errorObject("regEx." + i, schemaKeyName, keyValue, def, ss));
            break;
          }
        }
      }
    } else if (max && max < keyValue.length) {
      invalidKeys.push(errorObject("maxString", schemaKeyName, keyValue, def, ss));
    } else if (min && min > keyValue.length) {
      invalidKeys.push(errorObject("minString", schemaKeyName, keyValue, def, ss));
    }
  } else if (expectedType === Number) {
    if (typeof keyValue !== "number") {
      invalidKeys.push(errorObject("expectedNumber", schemaKeyName, keyValue, def, ss));
    } else if (max && max < keyValue) {
      invalidKeys.push(errorObject("maxNumber", schemaKeyName, keyValue, def, ss));
    } else if (min && min > keyValue) {
      invalidKeys.push(errorObject("minNumber", schemaKeyName, keyValue, def, ss));
    } else if (!def.decimal && keyValue.toString().indexOf(".") > -1) {
      invalidKeys.push(errorObject("noDecimal", schemaKeyName, keyValue, def, ss));
    }
  } else if (expectedType === Boolean) {
    if (typeof keyValue !== "boolean") {
      invalidKeys.push(errorObject("expectedBoolean", schemaKeyName, keyValue, def, ss));
    }
  } else if (expectedType === Object) {
    if (!isBasicObject(keyValue)) {
      invalidKeys.push(errorObject("expectedObject", schemaKeyName, keyValue, def, ss));
    }
  } else if (expectedType instanceof Function || safariBugFix(expectedType)) {
    if (!(keyValue instanceof expectedType)) {
      invalidKeys.push(errorObject("expectedConstructor", schemaKeyName, keyValue, def, ss));
    } else if (expectedType === Date) {
      if (_.isDate(min) && min.getTime() > keyValue.getTime()) {
        invalidKeys.push(errorObject("minDate", schemaKeyName, keyValue, def, ss));
      } else if (_.isDate(max) && max.getTime() < keyValue.getTime()) {
        invalidKeys.push(errorObject("maxDate", schemaKeyName, keyValue, def, ss));
      }
    }
  }

  return invalidKeys;
};

//tests whether it's an Object as opposed to something that inherits from Object
var isBasicObject = function(obj) {
  return _.isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;
};

var numToDollar = function(str) {
  return str.replace(/\.[0-9]+\./g, '.$.');
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