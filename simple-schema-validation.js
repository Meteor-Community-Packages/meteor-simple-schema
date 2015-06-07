/* global Utility */
/* global _ */
/* global SimpleSchema */
/* global MongoObject */
/* global doValidation1:true */

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
      if (regExError) {
        return regExError;
      }
    }
  }

  // Number checks
  else if (expectedType === Number) {
    if (typeof keyValue !== "number" || isNaN(keyValue)) {
      return "expectedNumber";
    } else if (op !== "$inc" && def.max !== null && (!!def.exclusiveMax ? def.max <= keyValue : def.max < keyValue)) {
       return !!def.exclusiveMax ? "maxNumberExclusive" : "maxNumber";
    } else if (op !== "$inc" && def.min !== null && (!!def.exclusiveMin ? def.min >= keyValue : def.min > keyValue)) {
       return !!def.exclusiveMin ? "minNumberExclusive" : "minNumber";
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
      if (isNaN(keyValue.getTime())) {
        return "badDate";
      }

      if (_.isDate(def.min) && def.min.getTime() > keyValue.getTime()) {
        return "minDate";
      } else if (_.isDate(def.max) && def.max.getTime() < keyValue.getTime()) {
        return "maxDate";
      }
    }
  }

}

doValidation1 = function doValidation1(obj, isModifier, isUpsert, keyToValidate, ss, extendedCustomContext) {
  // First do some basic checks of the object, and throw errors if necessary
  if (!_.isObject(obj)) {
    throw new Error("The first argument of validate() or validateOne() must be an object");
  }

  if (!isModifier && Utility.looksLikeModifier(obj)) {
    throw new Error("When the validation object contains mongo operators, you must set the modifier option to true");
  }

  var invalidKeys = [];
  var mDoc; // for caching the MongoObject if necessary

  // Validation function called for each affected key
  function validate(val, affectedKey, affectedKeyGeneric, def, op, skipRequiredCheck, isInArrayItemObject, isInSubObject) {

    // Get the schema for this key, marking invalid if there isn't one.
    if (!def) {
      invalidKeys.push(Utility.errorObject("keyNotInSchema", affectedKey, val, def, ss));
      return;
    }

    // Check for missing required values. The general logic is this:
    // * If the operator is $unset or $rename, it's invalid.
    // * If the value is null, it's invalid.
    // * If the value is undefined and one of the following are true, it's invalid:
    //     * We're validating a key of a sub-object.
    //     * We're validating a key of an object that is an array item.
    //     * We're validating a document (as opposed to a modifier).
    //     * We're validating a key under the $set operator in a modifier, and it's an upsert.
    if (!skipRequiredCheck && !def.optional) {
      if (
        val === null ||
        op === "$unset" ||
        op === "$rename" ||
        (val === void 0 && (isInArrayItemObject || isInSubObject || !op || op === "$set"))
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

    // Value checks are not necessary for null or undefined values
    // or for $unset or $rename values
    if (op !== "$unset" && op !== "$rename" && Utility.isNotNullOrUndefined(val)) {

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
  function checkObj(val, affectedKey, operator, setKeys, isInArrayItemObject, isInSubObject) {
    var affectedKeyGeneric, def;

    if (affectedKey) {
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
        // We can skip the required check for keys that are ancestors
        // of those in $set or $setOnInsert because they will be created
        // by MongoDB while setting.
        var skipRequiredCheck = _.some(setKeys, function(sk) {
          return (sk.slice(0, affectedKey.length + 1) === affectedKey + ".");
        });
        validate(val, affectedKey, affectedKeyGeneric, def, operator, skipRequiredCheck, isInArrayItemObject, isInSubObject);
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
        checkObj(v, affectedKey + '.' + i, operator, setKeys);
      });
    }

    // Loop through object keys
    else if (Utility.isBasicObject(val) && (!def || !def.blackbox)) {

      // Get list of present keys
      var presentKeys = _.keys(val);

      // Check all present keys plus all keys defined by the schema.
      // This allows us to detect extra keys not allowed by the schema plus
      // any missing required keys, and to run any custom functions for other keys.
      var keysToCheck = _.union(presentKeys, ss.objectKeys(affectedKeyGeneric));

      // If this object is within an array, make sure we check for
      // required as if it's not a modifier
      isInArrayItemObject = (affectedKeyGeneric && affectedKeyGeneric.slice(-2) === ".$");

      // Check all keys in the merged list
      _.each(keysToCheck, function(key) {
        checkObj(val[key], Utility.appendAffectedKey(affectedKey, key), operator, setKeys, isInArrayItemObject, true);
      });
    }

  }

  function checkModifier(mod) {
    // Check for empty modifier
    if (_.isEmpty(mod)) {
      throw new Error("When the modifier option is true, validation object must have at least one operator");
    }

    // Get a list of all keys in $set and $setOnInsert combined, for use later
    var setKeys = _.keys(mod.$set || {}).concat(_.keys(mod.$setOnInsert || {}));

    // If this is an upsert, add all the $setOnInsert keys to $set;
    // since we don't know whether it will be an insert or update, we'll
    // validate upserts as if they will be an insert.
    if ("$setOnInsert" in mod) {
      if (isUpsert) {
        mod.$set = mod.$set || {};
        mod.$set = _.extend(mod.$set, mod.$setOnInsert);
      }
      delete mod.$setOnInsert;
    }

    // Loop through operators
    _.each(mod, function (opObj, op) {
      // If non-operators are mixed in, throw error
      if (op.slice(0, 1) !== "$") {
        throw new Error("When the modifier option is true, all validation object keys must be operators. Did you forget `$set`?");
      }
      if (Utility.shouldCheck(op)) {
        // For an upsert, missing props would not be set if an insert is performed,
        // so we add null keys to the modifier to force any "required" checks to fail
        if (isUpsert && op === "$set") {
          var presentKeys = _.keys(opObj);
          _.each(ss.objectKeys(), function (schemaKey) {
            if (!_.contains(presentKeys, schemaKey)) {
              checkObj(void 0, schemaKey, op, setKeys);
            }
          });
        }
        _.each(opObj, function (v, k) {
          if (op === "$push" || op === "$addToSet") {
            if (Utility.isBasicObject(v) && "$each" in v) {
              v = v.$each;
            } else {
              k = k + ".0";
            }
          }
          checkObj(v, k, op, setKeys);
        });
      }
    });
  }

  // Kick off the validation
  if (isModifier) {
    checkModifier(obj);
  } else {
    checkObj(obj);
  }

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
