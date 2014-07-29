doValidation1 = function doValidation1(obj, isModifier, isUpsert, keyToValidate, ss, extendedCustomContext) {
  var setKeys = [];

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
        throw new Error("When the modifier option is true, all validation object keys must be operators. Did you forget `$set`?");
      }

      // Get a list of all keys in $set and $setOnInsert combined, for use later
      setKeys = setKeys.concat(_.keys(obj.$set || {})).concat(_.keys(obj.$setOnInsert || {}));
    }
  } else if (Utility.looksLikeModifier(obj)) {
    throw new Error("When the validation object contains mongo operators, you must set the modifier option to true");
  }

  // If this is an upsert, add all the $setOnInsert keys to $set;
  // since we don't know whether it will be an insert or update, we'll
  // validate upserts as if they will be an insert.
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
  function validate(val, affectedKey, affectedKeyGeneric, def, op, skipRequiredCheck, strictRequiredCheck) {

    // Get the schema for this key, marking invalid if there isn't one.
    if (!def) {
      invalidKeys.push(Utility.errorObject("keyNotInSchema", affectedKey, val, def, ss));
      return;
    }

    // Check for missing required values. The general logic is this:
    // * If there's no operator, or if the operator is $set and it's an upsert,
    //   val must not be undefined, null, or an empty string.
    // * If there is an operator other than $unset or $rename, val must
    //   not be null or an empty string, but undefined is OK.
    // * If the operator is $unset or $rename, it's invalid.
    if (!skipRequiredCheck && !def.optional) {
      if (
        op === "$unset" ||
        op === "$rename" ||
        ((!op || (op === "$set" && isUpsert) || strictRequiredCheck) && Utility.isBlankNullOrUndefined(val, extendedCustomContext.requiredAllowsEmptyStrings)) ||
        (op && Utility.isBlankOrNull(val, extendedCustomContext.requiredAllowsEmptyStrings))
        ) {
        invalidKeys.push(Utility.errorObject("required", affectedKey, null, def, ss));
        return;
      }
    }

    // For $rename, make sure that the new name is allowed by the schema
    if (op === "$rename" && typeof val === "string" && !ss.allowsKey(val)) {
      invalidKeys.push(Utility.errorObject("keyNotInSchema", val, null, null, ss));
      return;
    }

    // No further checking necessary for $unset or $rename
    if (_.contains(["$unset", "$rename"], op)) {
      return;
    }

    // Value checks are not necessary for null or undefined values
    if (Utility.isNotNullOrUndefined(val)) {

      // Check that value is of the correct type
      var typeError = doTypeChecks(def, val, op);
      if (typeError) {
        invalidKeys.push(Utility.errorObject(typeError, affectedKey, val, def, ss));
        return;
      }

      // Check value against allowedValues array
      if (def.allowedValues && !_.contains(def.allowedValues, val)) {
        invalidKeys.push(Utility.errorObject("notAllowed", affectedKey, val, def, ss));
        return;
      }

    }

    // Perform custom validation
    var lastDot = affectedKey.lastIndexOf('.');
    var fieldParentName = lastDot === -1 ? '' : affectedKey.slice(0, lastDot + 1);
    var validators = def.custom ? [def.custom] : [];
    validators = validators.concat(ss._validators).concat(SimpleSchema._validators);
    _.every(validators, function(validator) {
      var errorType = validator.call(_.extend({
        key: affectedKey,
        genericKey: affectedKeyGeneric,
        definition: def,
        isSet: (val !== void 0),
        value: val,
        operator: op,
        field: function(fName) {
          mDoc = mDoc || new MongoObject(obj, ss._blackboxKeys); //create if necessary, cache for speed
          var keyInfo = mDoc.getInfoForKey(fName) || {};
          return {
            isSet: (keyInfo.value !== void 0),
            value: keyInfo.value,
            operator: keyInfo.operator
          };
        },
        siblingField: function(fName) {
          mDoc = mDoc || new MongoObject(obj, ss._blackboxKeys); //create if necessary, cache for speed
          var keyInfo = mDoc.getInfoForKey(fieldParentName + fName) || {};
          return {
            isSet: (keyInfo.value !== void 0),
            value: keyInfo.value,
            operator: keyInfo.operator
          };
        }
      }, extendedCustomContext || {}));
      if (typeof errorType === "string") {
        invalidKeys.push(Utility.errorObject(errorType, affectedKey, val, def, ss));
        return false;
      }
      return true;
    });
  }

  // The recursive function
  function checkObj(val, affectedKey, operator, adjusted, skipRequiredCheck, strictRequiredCheck) {
    var affectedKeyGeneric, def, checkAllRequired = false;

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
        if (Utility.isBasicObject(val) && "$each" in val) {
          val = val.$each;
        } else {
          affectedKey = affectedKey + ".0";
        }
        checkAllRequired = adjusted = true;
      }

      // When we hit a blackbox key, we don't progress any further
      if (ss.keyIsInBlackBox(affectedKey)) {
        return;
      }

      // Make a generic version of the affected key, and use that
      // to get the schema for this key.
      affectedKeyGeneric = SimpleSchema._makeGeneric(affectedKey);
      def = ss.getDefinition(affectedKey);

      // Perform validation for this key
      if (!keyToValidate || keyToValidate === affectedKey || keyToValidate === affectedKeyGeneric) {
        validate(val, affectedKey, affectedKeyGeneric, def, operator, skipRequiredCheck, strictRequiredCheck);
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
    else if (Utility.isBasicObject(val) && (!def || !def.blackbox)) {
      var presentKeys, requiredKeys, customKeys;

      // Get list of present keys
      presentKeys = _.keys(val);

      if (!isModifier || operator === "$set" || checkAllRequired) {

        // For required checks, we want to also loop through all keys expected
        // based on the schema, in case any are missing.
        requiredKeys = ss.requiredObjectKeys(affectedKeyGeneric);

        // We want to be sure to call any present custom functions
        // even if the value isn't set, so they can be used for custom
        // required errors, such as basing it on another field's value.
        customKeys = ss.customObjectKeys(affectedKeyGeneric);
      }

      // Merge the lists
      var keysToCheck = _.union(presentKeys, requiredKeys || [], customKeys || []);

      // If this object is within an array, make sure we check for
      // required as if it's not a modifier
      var strictRequiredCheck = (affectedKeyGeneric && affectedKeyGeneric.slice(-2) === ".$");

      // Check all keys in the merged list
      _.each(keysToCheck, function(key) {
        if (Utility.shouldCheck(key)) {
          // We can skip the required check for keys that are ancestors
          // of those in $set or $setOnInsert because they will be created
          // by MongoDB while setting.
          skipRequiredCheck = _.some(setKeys, function(sk) {
            return (sk.slice(0, key.length + 1) === key + ".");
          });
          checkObj(val[key], Utility.appendAffectedKey(affectedKey, key), operator, adjusted, skipRequiredCheck, strictRequiredCheck);
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

function doTypeChecks(def, keyValue, op) {
  var expectedType = def.type;

  // String checks
  if (expectedType === String) {
    if (typeof keyValue !== "string") {
      return "expectedString";
    } else if (def.max !== null && def.max < keyValue.length) {
      return "maxString";
    } else if (def.min !== null && def.min > keyValue.length) {
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
    if (typeof keyValue !== "number" || isNaN(keyValue)) {
      return "expectedNumber";
    } else if (op !== "$inc" && def.max !== null && def.max < keyValue) {
      return "maxNumber";
    } else if (op !== "$inc" && def.min !== null && def.min > keyValue) {
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
    if (!Utility.isBasicObject(keyValue)) {
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
  else if (expectedType instanceof Function || Utility.safariBugFix(expectedType)) {

    // Generic constructor checks
    if (!(keyValue instanceof expectedType)) {
      return "expectedConstructor";
    }

    // Date checks
    else if (expectedType === Date) {
      if (_.isDate(def.min) && def.min.getTime() > keyValue.getTime()) {
        return "minDate";
      } else if (_.isDate(def.max) && def.max.getTime() < keyValue.getTime()) {
        return "maxDate";
      }
    }
  }

}
