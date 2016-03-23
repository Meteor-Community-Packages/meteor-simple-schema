import MongoObject from 'mongo-object';
import { appendAffectedKey, looksLikeModifier, safariBugFix, shouldCheck } from './utility.js';

function doTypeChecks(def, keyValue, op) {
  let expectedType = def.type;

  // String checks
  if (expectedType === String) {
    if (typeof keyValue !== "string") {
      return SimpleSchema.ErrorTypes.EXPECTED_TYPE;
    } else if (def.max !== null && def.max < keyValue.length) {
      return SimpleSchema.ErrorTypes.MAX_STRING;
    } else if (def.min !== null && def.min > keyValue.length) {
      return SimpleSchema.ErrorTypes.MIN_STRING;
    } else if (def.regEx instanceof RegExp && !def.regEx.test(keyValue)) {
      return SimpleSchema.ErrorTypes.FAILED_REGULAR_EXPRESSION;
    } else if (_.isArray(def.regEx)) {
      let regExError;
      _.every(def.regEx, function(re, i) {
        if (!re.test(keyValue)) {
          regExError = SimpleSchema.ErrorTypes.FAILED_REGULAR_EXPRESSION + '.' + i;
          return false;
        }
        return true;
      });
      if (regExError) return regExError;
    }
  }

  // Number checks
  else if (expectedType === Number || expectedType === SimpleSchema.Integer) {
    if (typeof keyValue !== "number" || isNaN(keyValue)) {
      return SimpleSchema.ErrorTypes.EXPECTED_TYPE;
    } else if (op !== "$inc" && def.max !== null && (!!def.exclusiveMax ? def.max <= keyValue : def.max < keyValue)) {
       return !!def.exclusiveMax ? SimpleSchema.ErrorTypes.MAX_NUMBER_EXCLUSIVE : SimpleSchema.ErrorTypes.MAX_NUMBER;
    } else if (op !== "$inc" && def.min !== null && (!!def.exclusiveMin ? def.min >= keyValue : def.min > keyValue)) {
       return !!def.exclusiveMin ? SimpleSchema.ErrorTypes.MIN_NUMBER_EXCLUSIVE : SimpleSchema.ErrorTypes.MIN_NUMBER;
    } else if (expectedType === SimpleSchema.Integer && keyValue.toString().indexOf('.') > -1) {
      return SimpleSchema.ErrorTypes.MUST_BE_INTEGER;
    }
  }

  // Boolean checks
  else if (expectedType === Boolean) {
    if (typeof keyValue !== "boolean") {
      return SimpleSchema.ErrorTypes.EXPECTED_TYPE;
    }
  }

  // Object checks
  else if (expectedType === Object) {
    if (!MongoObject.isBasicObject(keyValue)) {
      return SimpleSchema.ErrorTypes.EXPECTED_TYPE;
    }
  }

  // Array checks
  else if (expectedType === Array) {
    if (!_.isArray(keyValue)) {
      return SimpleSchema.ErrorTypes.EXPECTED_TYPE;
    } else if (def.minCount !== null && keyValue.length < def.minCount) {
      return SimpleSchema.ErrorTypes.MIN_COUNT;
    } else if (def.maxCount !== null && keyValue.length > def.maxCount) {
      return SimpleSchema.ErrorTypes.MAX_COUNT;
    }
  }

  // Constructor function checks
  else if (expectedType instanceof Function || safariBugFix(expectedType)) {

    // Generic constructor checks
    if (!(keyValue instanceof expectedType)) {
      return SimpleSchema.ErrorTypes.EXPECTED_TYPE;
    }

    // Date checks
    else if (expectedType === Date) {
      if (isNaN(keyValue.getTime())) {
        return SimpleSchema.ErrorTypes.BAD_DATE;
      }

      if (_.isDate(def.min) && def.min.getTime() > keyValue.getTime()) {
        return SimpleSchema.ErrorTypes.MIN_DATE;
      } else if (_.isDate(def.max) && def.max.getTime() < keyValue.getTime()) {
        return SimpleSchema.ErrorTypes.MAX_DATE;
      }
    }
  }

}

doValidation2 = function doValidation2(obj, isModifier, isUpsert, keyToValidate, ss, extendedCustomContext) {

  // First do some basic checks of the object, and throw errors if necessary
  if (!_.isObject(obj)) {
    throw new Error("The first argument of validate() must be an object");
  }

  if (isModifier) {
    let allKeysAreOperators = _.every(obj, function(v, k) {
      return (k.substring(0, 1) === "$");
    });
    if (!allKeysAreOperators) {
      throw new Error("When the modifier option is true, all validation object keys must be operators");
    }

    // We use a LocalCollection to figure out what the resulting doc
    // would be in a worst case scenario. Then we validate that doc
    // so that we don't have to validate the modifier object directly.
    obj = convertModifierToDoc(obj, ss.schema(), isUpsert);
  } else if (looksLikeModifier(obj)) {
    throw new Error("When the validation object contains mongo operators, you must set the modifier option to true");
  }

  let validationErrors = [];
  let mDoc; // for caching the MongoObject if necessary

  // Validation function called for each affected key
  function validate(val, affectedKey, affectedKeyGeneric, def, op, skipRequiredCheck, strictRequiredCheck) {

    // Get the schema for this key, marking invalid if there isn't one.
    if (!def) {
      validationErrors.push({
        name: affectedKey,
        type: SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA,
        value: val
      });
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
        validationErrors.push({
          name: affectedKey,
          type: SimpleSchema.ErrorTypes.REQUIRED,
          value: null
        });
        return;
      }
    }

    // Value checks are not necessary for null or undefined values
    if (val !== undefined && val !== null) {

      // Check that value is of the correct type
      let typeError = doTypeChecks(def, val, op);
      if (typeError) {
        validationErrors.push({
          name: affectedKey,
          type: typeError,
          value: val
        });
        return;
      }

      // Check value against allowedValues array
      if (def.allowedValues && !_.contains(def.allowedValues, val)) {
        validationErrors.push({
          name: affectedKey,
          type: SimpleSchema.ErrorTypes.VALUE_NOT_ALLOWED,
          value: val
        });
        return;
      }

    }

    // Perform custom validation
    let lastDot = affectedKey.lastIndexOf('.');
    let fieldParentName = lastDot === -1 ? '' : affectedKey.slice(0, lastDot + 1);
    let validators = def.custom ? [def.custom] : [];
    validators = validators.concat(ss._validators).concat(SimpleSchema._validators);
    _.every(validators, function(validator) {
      let result = validator.call(_.extend({
        key: affectedKey,
        genericKey: affectedKeyGeneric,
        definition: def,
        isSet: (val !== void 0),
        value: val,
        operator: op,
        field: function(fName) {
          mDoc = mDoc || new MongoObject(obj, ss._blackboxKeys); //create if necessary, cache for speed
          let keyInfo = mDoc.getInfoForKey(fName) || {};
          return {
            isSet: (keyInfo.value !== void 0),
            value: keyInfo.value,
            operator: keyInfo.operator
          };
        },
        siblingField: function(fName) {
          mDoc = mDoc || new MongoObject(obj, ss._blackboxKeys); //create if necessary, cache for speed
          let keyInfo = mDoc.getInfoForKey(fieldParentName + fName) || {};
          return {
            isSet: (keyInfo.value !== void 0),
            value: keyInfo.value,
            operator: keyInfo.operator
          };
        }
      }, extendedCustomContext || {}));
      if (typeof result === "string") {
        validationErrors.push({
          name: affectedKey,
          type: result,
          value: val
        });
        return false;
      }
      if (MongoObject.isBasicObject(result)) {
        validationErrors.push(result);
        return false;
      }
      return true;
    });
  }

  // The recursive function
  function checkObj(val, affectedKey, skipRequiredCheck, strictRequiredCheck) {
    let affectedKeyGeneric, def;

    if (affectedKey) {

      // When we hit a blackbox key, we don't progress any further
      if (ss.keyIsInBlackBox(affectedKey)) return;

      // Make a generic version of the affected key, and use that
      // to get the schema for this key.
      affectedKeyGeneric = MongoObject.makeKeyGeneric(affectedKey);
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
    else if (MongoObject.isBasicObject(val) && (!def || !def.blackbox)) {

      // Get list of present keys
      let presentKeys = _.keys(val);

      // Check all present keys plus all keys defined by the schema.
      // This allows us to detect extra keys not allowed by the schema plus
      // any missing required keys, and to run any custom functions for other keys.
      let keysToCheck = _.union(presentKeys, ss._schemaKeys);

      // If this object is within an array, make sure we check for
      // required as if it's not a modifier
      strictRequiredCheck = (affectedKeyGeneric && affectedKeyGeneric.slice(-2) === ".$");

      // Check all keys in the merged list
      _.each(keysToCheck, function(key) {
        if (shouldCheck(key)) {
          checkObj(val[key], appendAffectedKey(affectedKey, key), skipRequiredCheck, strictRequiredCheck);
        }
      });
    }

  }

  // Kick off the validation
  checkObj(obj);

  // Make sure there is only one error per fieldName
  let addedFieldNames = [];
  validationErrors = _.filter(validationErrors, function(errObj) {
    if (!_.contains(addedFieldNames, errObj.name)) {
      addedFieldNames.push(errObj.name);
      return true;
    }
    return false;
  });

  return validationErrors;
};

function convertModifierToDoc(mod, schema, isUpsert) {
  // Create unmanaged LocalCollection as scratchpad
  let t = new Meteor.Collection(null);

  // LocalCollections are in memory, and it seems
  // that it's fine to use them synchronously on
  // either client or server
  let id;
  if (isUpsert) {
    // We assume upserts will be inserts (conservative
    // validation of requiredness)
    id = Random.id();
    t.upsert({_id: id}, mod);
  } else {
    let mDoc = new MongoObject(mod);
    // Create a ficticious existing document
    let fakeDoc = new MongoObject({});
    _.each(schema, function (def, fieldName) {
      let setVal;
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
        } else if (def.type === Number || def.type === SimpleSchema.Integer) {
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
        let key = fieldName.replace(/\.\$/g, ".0");
        let pos = MongoObject._keyToPosition(key, false);
        fakeDoc.setValueForPosition(pos, setVal);
      }
    });
    fakeDoc = fakeDoc.getObject();
    // Insert fake doc into local scratch collection
    id = t.insert(fakeDoc);
    // Now update it with the modifier
    t.update(id, mod);
  }

  let doc = t.findOne(id);
  // We're done with it
  t.remove(id);
  // Currently we don't validate _id unless it is
  // explicitly added to the schema
  if (!schema._id) {
    delete doc._id;
  }
  return doc;
}
