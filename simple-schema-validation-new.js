/* global Utility */
/* global _ */
/* global SimpleSchema */
/* global MongoObject */
/* global Meteor */
/* global Random */
/* global doValidation2:true */

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

doValidation2 = function doValidation2(obj, isModifier, isUpsert, keyToValidate, ss, extendedCustomContext) {

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

      // We use a LocalCollection to figure out what the resulting doc
      // would be in a worst case scenario. Then we validate that doc
      // so that we don't have to validate the modifier object directly.
      obj = convertModifierToDoc(obj, ss.schema(), isUpsert);
    }
  } else if (Utility.looksLikeModifier(obj)) {
    throw new Error("When the validation object contains mongo operators, you must set the modifier option to true");
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
    // * If the operator is $unset or $rename, it's invalid.
    // * If the value is null, it's invalid.
    // * If the value is undefined and one of the following are true, it's invalid:
    //     * We're validating a key of a sub-object.
    //     * We're validating a key of an object that is an array item.
    //     * We're validating a document (as opposed to a modifier).
    //     * We're validating a key under the $set operator in a modifier, and it's an upsert.
    if (!skipRequiredCheck && !def.optional) {
      if (val === null || val === void 0) {
        invalidKeys.push(Utility.errorObject("required", affectedKey, null, def, ss));
        return;
      }
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
  function checkObj(val, affectedKey, skipRequiredCheck, strictRequiredCheck) {
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
        validate(val, affectedKey, affectedKeyGeneric, def, null, skipRequiredCheck, strictRequiredCheck);
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
        checkObj(v, affectedKey + '.' + i);
      });
    }

    // Loop through object keys
    else if (Utility.isBasicObject(val) && (!def || !def.blackbox)) {

      // Get list of present keys
      var presentKeys = _.keys(val);

      // Check all present keys plus all keys defined by the schema.
      // This allows us to detect extra keys not allowed by the schema plus
      // any missing required keys, and to run any custom functions for other keys.
      var keysToCheck = _.union(presentKeys, ss._schemaKeys);

      // If this object is within an array, make sure we check for
      // required as if it's not a modifier
      strictRequiredCheck = (affectedKeyGeneric && affectedKeyGeneric.slice(-2) === ".$");

      // Check all keys in the merged list
      _.each(keysToCheck, function(key) {
        if (Utility.shouldCheck(key)) {
          checkObj(val[key], Utility.appendAffectedKey(affectedKey, key), skipRequiredCheck, strictRequiredCheck);
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

function convertModifierToDoc(mod, schema, isUpsert) {
  // Create unmanaged LocalCollection as scratchpad
  var t = new Meteor.Collection(null);

  // LocalCollections are in memory, and it seems
  // that it's fine to use them synchronously on 
  // either client or server
  var id;
  if (isUpsert) {
    // We assume upserts will be inserts (conservative
    // validation of requiredness)
    id = Random.id();
    t.upsert({_id: id}, mod);
  } else {
    var mDoc = new MongoObject(mod);
    // Create a ficticious existing document
    var fakeDoc = new MongoObject({});
    _.each(schema, function (def, fieldName) {
      var setVal;
      // Prefill doc with empty arrays to avoid the
      // mongodb issue where it does not understand
      // that numeric pieces should create arrays.
      if (def.type === Array && mDoc.affectsGenericKey(fieldName)) {
        setVal = [];
      }
      // Set dummy values for required fields because
      // we assume any existing data would be valid.
      else if (!def.optional) {
        // TODO correct value type based on schema type
        if (def.type === Boolean) {
          setVal = true;
        } else if (def.type === Number) {
          setVal = def.min || 0;
        } else if (def.type === Date) {
          setVal = def.min || new Date();
        } else if (def.type === Array) {
          setVal = [];
        } else if (def.type === Object) {
          setVal = {};
        } else {
          setVal = "0";
        }
      }

      if (setVal !== void 0) {
        var key = fieldName.replace(/\.\$/g, ".0");
        var pos = MongoObject._keyToPosition(key, false);
        fakeDoc.setValueForPosition(pos, setVal);
      }
    });
    fakeDoc = fakeDoc.getObject();
    // Insert fake doc into local scratch collection
    id = t.insert(fakeDoc);
    // Now update it with the modifier
    t.update(id, mod);
  }
  
  var doc = t.findOne(id);
  // We're done with it
  t.remove(id);
  // Currently we don't validate _id unless it is
  // explicitly added to the schema
  if (!schema._id) {
    delete doc._id;
  }
  return doc;
}
