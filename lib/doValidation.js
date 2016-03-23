import MongoObject from 'mongo-object';
import { appendAffectedKey, dateToDateString, looksLikeModifier, safariBugFix, shouldCheck } from './utility.js';

function doValidation({
  obj,
  isModifier,
  isUpsert,
  keysToValidate,
  schema,
  extendedCustomContext,
  ignoreTypes,
}) {
  // First do some basic checks of the object, and throw errors if necessary
  if (!_.isObject(obj)) {
    throw new Error("The first argument of validate() must be an object");
  }

  if (!isModifier && looksLikeModifier(obj)) {
    throw new Error("When the validation object contains mongo operators, you must set the modifier option to true");
  }

  let validationErrors = [];
  let mDoc; // for caching the MongoObject if necessary

  // Validation function called for each affected key
  function validate(val, affectedKey, affectedKeyGeneric, def, op, skipRequiredCheck, isInArrayItemObject, isInSubObject) {

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
      if (
        val === null ||
        op === "$unset" ||
        op === "$rename" ||
        (val === void 0 && (isInArrayItemObject || isInSubObject || !op || op === "$set"))
        ) {
        validationErrors.push({
          name: affectedKey,
          type: SimpleSchema.ErrorTypes.REQUIRED,
          value: null
        });
        return;
      }
    }

    // For $rename, make sure that the new name is allowed by the schema
    if (op === "$rename" && typeof val === "string" && !schema.allowsKey(val)) {
      validationErrors.push({
        name: val,
        type: SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA,
        value: null
      });
      return;
    }

    // Value checks are not necessary for null or undefined values, except for null array items,
    // or for $unset or $rename values
    if (
      op !== "$unset" && op !== "$rename" &&
      ((val !== undefined && val !== null) || (affectedKeyGeneric.slice(-2) === '.$' && val === null))
    ) {

      // Check that value is of the correct type
      let typeError = doTypeChecks(def, val, op);
      if (typeError) {
        validationErrors.push(_.extend({
          name: affectedKey,
          value: val
        }, typeError));
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
    validators = validators.concat(schema._validators).concat(SimpleSchema._validators);
    _.every(validators, (validator) => {
      let result = validator.call(_.extend({
        key: affectedKey,
        genericKey: affectedKeyGeneric,
        definition: def,
        isSet: (val !== undefined),
        value: val,
        operator: op,
        field: (fName) => {
          mDoc = mDoc || new MongoObject(obj, schema._blackboxKeys); //create if necessary, cache for speed
          let keyInfo = mDoc.getInfoForKey(fName) || {};
          return {
            isSet: (keyInfo.value !== undefined),
            value: keyInfo.value,
            operator: keyInfo.operator
          };
        },
        siblingField: (fName) => {
          mDoc = mDoc || new MongoObject(obj, schema._blackboxKeys); //create if necessary, cache for speed
          let keyInfo = mDoc.getInfoForKey(fieldParentName + fName) || {};
          return {
            isSet: (keyInfo.value !== undefined),
            value: keyInfo.value,
            operator: keyInfo.operator
          };
        },
        addValidationErrors: (errors) => {
          for (let error of errors) {
            validationErrors.push(error);
          }
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
      if (result === false) return false;
      return true;
    });
  }

  // The recursive function
  function checkObj({
    val,
    affectedKey,
    operator,
    setKeys,
    isInArrayItemObject = false,
    isInSubObject = false
  }) {
    let affectedKeyGeneric, def;

    if (affectedKey) {
      // When we hit a blackbox key, we don't progress any further
      if (schema.keyIsInBlackBox(affectedKey)) return;

      // Make a generic version of the affected key, and use that
      // to get the schema for this key.
      affectedKeyGeneric = MongoObject.makeKeyGeneric(affectedKey);
      def = schema.getDefinition(affectedKey);

      let shouldValidateKey = !keysToValidate || _.any(keysToValidate, (keyToValidate) => {
        return keyToValidate === affectedKey ||
          keyToValidate === affectedKeyGeneric ||
          affectedKey.indexOf(keyToValidate + '.') === 0 ||
          affectedKeyGeneric.indexOf(keyToValidate + '.') === 0;
      });

      // Perform validation for this key
      if (shouldValidateKey) {
        // We can skip the required check for keys that are ancestors
        // of those in $set or $setOnInsert because they will be created
        // by MongoDB while setting.
        let skipRequiredCheck = _.some(setKeys, (sk) => {
          return (sk.slice(0, affectedKey.length + 1) === affectedKey + ".");
        });
        validate(val, affectedKey, affectedKeyGeneric, def, operator, skipRequiredCheck, isInArrayItemObject, isInSubObject);
      }
    }

    // Temporarily convert missing objects to empty objects
    // so that the looping code will be called and required
    // descendent keys can be validated.
    if ((val === undefined || val === null) && (!def || (def.type === Object && !def.optional))) {
      val = {};
    }

    // Loop through arrays
    if (_.isArray(val)) {
      _.each(val, function(v, i) {
        checkObj({
          val: v,
          affectedKey: `${affectedKey}.${i}`,
          operator,
          setKeys,
        });
      });
    }

    // Loop through object keys
    else if (MongoObject.isBasicObject(val) && (!def || !def.blackbox)) {

      // Get list of present keys
      let presentKeys = _.keys(val);

      // Check all present keys plus all keys defined by the schema.
      // This allows us to detect extra keys not allowed by the schema plus
      // any missing required keys, and to run any custom functions for other keys.
      let keysToCheck = _.union(presentKeys, schema.objectKeys(affectedKeyGeneric));

      // If this object is within an array, make sure we check for
      // required as if it's not a modifier
      isInArrayItemObject = (affectedKeyGeneric && affectedKeyGeneric.slice(-2) === ".$");

      // Check all keys in the merged list
      _.each(keysToCheck, (key) => {
        checkObj({
          val: val[key],
          affectedKey: appendAffectedKey(affectedKey, key),
          operator,
          setKeys,
          isInArrayItemObject,
          isInSubObject: true,
        });
      });
    }

  }

  function checkModifier(mod) {
    // Get a list of all keys in $set and $setOnInsert combined, for use later
    let setKeys = _.keys(mod.$set || {}).concat(_.keys(mod.$setOnInsert || {}));

    // If this is an upsert, add all the $setOnInsert keys to $set;
    // since we don't know whether it will be an insert or update, we'll
    // validate upserts as if they will be an insert.
    if ('$setOnInsert' in mod) {
      if (isUpsert) {
        mod.$set = mod.$set || {};
        mod.$set = _.extend(mod.$set, mod.$setOnInsert);
      }
      delete mod.$setOnInsert;
    }

    // Loop through operators
    _.each(mod, (opObj, op) => {
      // If non-operators are mixed in, throw error
      if (op.slice(0, 1) !== '$') {
        throw new Error(`Expected "${op}" to be a modifier operator like "$set"`);
      }
      if (shouldCheck(op)) {
        // For an upsert, missing props would not be set if an insert is performed,
        // so we check them all with undefined value to force any "required" checks to fail
        if (isUpsert && op === "$set") {
          let presentKeys = _.keys(opObj);
          _.each(schema.objectKeys(), (schemaKey) => {
            if (!_.contains(presentKeys, schemaKey)) {
              checkObj({
                val: undefined,
                affectedKey: schemaKey,
                operator: op,
                setKeys,
              });
            }
          });
        }
        _.each(opObj, (v, k) => {
          if (op === '$push' || op === '$addToSet') {
            if (typeof v === 'object' && '$each' in v) {
              v = v.$each;
            } else {
              k = `${k}.0`;
            }
          }
          checkObj({
            val: v,
            affectedKey: k,
            operator: op,
            setKeys,
          });
        });
      }
    });
  }

  // Kick off the validation
  if (isModifier) {
    checkModifier(obj);
  } else {
    checkObj({val: obj});
  }

  let addedFieldNames = [];
  validationErrors = _.filter(validationErrors, (errObj) => {
    // Remove error types the user doesn't care about
    if (_.contains(ignoreTypes, errObj.type)) return false;
    // Make sure there is only one error per fieldName
    if (_.contains(addedFieldNames, errObj.name)) return false;

    addedFieldNames.push(errObj.name);
    return true;
  });

  return validationErrors;
}

function doTypeChecks(def, keyValue, op) {
  let expectedType = def.type;

  // String checks
  if (expectedType === String) {
    if (typeof keyValue !== "string") {
      return {type: SimpleSchema.ErrorTypes.EXPECTED_TYPE, dataType: 'String'};
    } else if (def.max !== null && def.max < keyValue.length) {
      return {type: SimpleSchema.ErrorTypes.MAX_STRING, max: def.max};
    } else if (def.min !== null && def.min > keyValue.length) {
      return {type: SimpleSchema.ErrorTypes.MIN_STRING, min: def.min};
    } else if (def.regEx instanceof RegExp && !def.regEx.test(keyValue)) {
      return {type: SimpleSchema.ErrorTypes.FAILED_REGULAR_EXPRESSION, regExp: def.regEx.toString()};
    } else if (_.isArray(def.regEx)) {
      let regExError;
      _.every(def.regEx, function(re, i) {
        if (!re.test(keyValue)) {
          regExError = {type: SimpleSchema.ErrorTypes.FAILED_REGULAR_EXPRESSION, regExp: re.toString()};
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
      return {type: SimpleSchema.ErrorTypes.EXPECTED_TYPE, dataType: (expectedType === SimpleSchema.Integer) ? 'Integer' : 'Number'};
    } else if (op !== "$inc" && def.max !== null && (!!def.exclusiveMax ? def.max <= keyValue : def.max < keyValue)) {
      return {type: !!def.exclusiveMax ? SimpleSchema.ErrorTypes.MAX_NUMBER_EXCLUSIVE : SimpleSchema.ErrorTypes.MAX_NUMBER, max: def.max};
    } else if (op !== "$inc" && def.min !== null && (!!def.exclusiveMin ? def.min >= keyValue : def.min > keyValue)) {
      return {type: !!def.exclusiveMin ? SimpleSchema.ErrorTypes.MIN_NUMBER_EXCLUSIVE : SimpleSchema.ErrorTypes.MIN_NUMBER, min: def.min};
    } else if (expectedType === SimpleSchema.Integer && !Number.isInteger(keyValue)) {
      return {type: SimpleSchema.ErrorTypes.MUST_BE_INTEGER};
    }
  }

  // Boolean checks
  else if (expectedType === Boolean) {
    if (typeof keyValue !== "boolean") {
      return {type: SimpleSchema.ErrorTypes.EXPECTED_TYPE, dataType: 'Boolean'};
    }
  }

  // Object checks
  else if (expectedType === Object) {
    if (!MongoObject.isBasicObject(keyValue)) {
      return {type: SimpleSchema.ErrorTypes.EXPECTED_TYPE, dataType: 'Object'};
    }
  }

  // Array checks
  else if (expectedType === Array) {
    if (!_.isArray(keyValue)) {
      return {type: SimpleSchema.ErrorTypes.EXPECTED_TYPE, dataType: 'Array'};
    } else if (def.minCount !== null && keyValue.length < def.minCount) {
      return {type: SimpleSchema.ErrorTypes.MIN_COUNT, minCount: def.minCount};
    } else if (def.maxCount !== null && keyValue.length > def.maxCount) {
      return {type: SimpleSchema.ErrorTypes.MAX_COUNT, maxCount: def.maxCount};
    }
  }

  // Constructor function checks
  else if (expectedType instanceof Function || safariBugFix(expectedType)) {
    // Generic constructor checks
    if (!(keyValue instanceof expectedType)) return {type: SimpleSchema.ErrorTypes.EXPECTED_TYPE, dataType: expectedType.toString()};

    // Date checks
    if (expectedType === Date) {
      if (isNaN(keyValue.getTime())) {
        return {type: SimpleSchema.ErrorTypes.BAD_DATE};
      }

      if (_.isDate(def.min) && def.min.getTime() > keyValue.getTime()) {
        return {type: SimpleSchema.ErrorTypes.MIN_DATE, min: dateToDateString(def.min)};
      } else if (_.isDate(def.max) && def.max.getTime() < keyValue.getTime()) {
        return {type: SimpleSchema.ErrorTypes.MAX_DATE, max: dateToDateString(def.max)};
      }
    }
  }
}

export default doValidation;
