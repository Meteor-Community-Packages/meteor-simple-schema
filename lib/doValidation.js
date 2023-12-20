import MongoObject from 'mongo-object';
import { SimpleSchema } from './SimpleSchema';
import {
  appendAffectedKey,
  getParentOfKey,
  looksLikeModifier,
  isObjectWeShouldTraverse,
} from './utility';
import typeValidator from './validation/typeValidator';
import requiredValidator from './validation/requiredValidator';
import allowedValuesValidator from './validation/allowedValuesValidator';

function shouldCheck(key) {
  if (key === '$pushAll') throw new Error('$pushAll is not supported; use $push + $each');
  return ['$pull', '$pullAll', '$pop', '$slice'].indexOf(key) === -1;
}

function doValidation({
  extendedCustomContext,
  ignoreTypes,
  isModifier,
  isUpsert,
  keysToValidate,
  mongoObject,
  obj,
  schema,
  validationContext,
}) {
  // First do some basic checks of the object, and throw errors if necessary
  if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) {
    throw new Error('The first argument of validate() must be an object');
  }

  if (!isModifier && looksLikeModifier(obj)) {
    throw new Error('When the validation object contains mongo operators, you must set the modifier option to true');
  }

  function getFieldInfo(key) {
    // Create mongoObject if necessary, cache for speed
    if (!mongoObject) mongoObject = new MongoObject(obj, schema.blackboxKeys());

    const keyInfo = mongoObject.getInfoForKey(key) || {};
    return {
      isSet: (keyInfo.value !== undefined),
      value: keyInfo.value,
      operator: keyInfo.operator || null,
    };
  }

  let validationErrors = [];

  // Validation function called for each affected key
  function validate(val, affectedKey, affectedKeyGeneric, def, op, isInArrayItemObject, isInSubObject) {
    // Get the schema for this key, marking invalid if there isn't one.
    if (!def) {
      // We don't need KEY_NOT_IN_SCHEMA error for $unset and we also don't need to continue
      if (op === '$unset' || (op === '$currentDate' && affectedKey.endsWith('.$type'))) return;

      validationErrors.push({
        name: affectedKey,
        type: SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA,
        value: val,
      });
      return;
    }

    // For $rename, make sure that the new name is allowed by the schema
    if (op === '$rename' && !schema.allowsKey(val)) {
      validationErrors.push({
        name: val,
        type: SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA,
        value: null,
      });
      return;
    }

    // Prepare the context object for the validator functions
    const fieldParentNameWithEndDot = getParentOfKey(affectedKey, true);
    const fieldParentName = fieldParentNameWithEndDot.slice(0, -1);

    const fieldValidationErrors = [];

    const validatorContext = {
      addValidationErrors(errors) {
        errors.forEach((error) => fieldValidationErrors.push(error));
      },
      field(fName) {
        return getFieldInfo(fName);
      },
      genericKey: affectedKeyGeneric,
      isInArrayItemObject,
      isInSubObject,
      isModifier,
      isSet: (val !== undefined),
      key: affectedKey,
      obj,
      operator: op,
      parentField() {
        return getFieldInfo(fieldParentName);
      },
      siblingField(fName) {
        return getFieldInfo(fieldParentNameWithEndDot + fName);
      },
      validationContext,
      value: val,
      // Value checks are not necessary for null or undefined values, except
      // for non-optional null array items, or for $unset or $rename values
      valueShouldBeChecked: (
        op !== '$unset' && op !== '$rename'
        && ((val !== undefined && val !== null) || (affectedKeyGeneric.slice(-2) === '.$' && val === null && !def.optional))
      ),
      ...(extendedCustomContext || {}),
    };

    const builtInValidators = [
      requiredValidator,
      typeValidator,
      allowedValuesValidator,
    ];
    const validators = builtInValidators
      .concat(schema._validators)
      .concat(SimpleSchema._validators);

    // Loop through each of the definitions in the SimpleSchemaGroup.
    // If any return true, we're valid.
    const fieldIsValid = def.type.some((typeDef) => {
      // If the type is SimpleSchema.Any, then it is valid:
      if (typeDef === SimpleSchema.Any) return true;

      const { type, ...definitionWithoutType } = def; // eslint-disable-line no-unused-vars

      const finalValidatorContext = {
        ...validatorContext,

        // Take outer definition props like "optional" and "label"
        // and add them to inner props like "type" and "min"
        definition: {
          ...definitionWithoutType,
          ...typeDef,
        },
      };

      // Add custom field validators to the list after the built-in
      // validators but before the schema and global validators.
      const fieldValidators = validators.slice(0);
      if (typeof typeDef.custom === 'function') {
        fieldValidators.splice(builtInValidators.length, 0, typeDef.custom);
      }

      // We use _.every just so that we don't continue running more validator
      // functions after the first one returns false or an error string.
      return fieldValidators.every((validator) => {
        const result = validator.call(finalValidatorContext);

        // If the validator returns a string, assume it is the
        // error type.
        if (typeof result === 'string') {
          fieldValidationErrors.push({
            name: affectedKey,
            type: result,
            value: val,
          });
          return false;
        }

        // If the validator returns an object, assume it is an
        // error object.
        if (typeof result === 'object' && result !== null) {
          fieldValidationErrors.push({
            name: affectedKey,
            value: val,
            ...result,
          });
          return false;
        }

        // If the validator returns false, assume they already
        // called this.addValidationErrors within the function
        if (result === false) return false;

        // Any other return value we assume means it was valid
        return true;
      });
    });

    if (!fieldIsValid) {
      validationErrors = validationErrors.concat(fieldValidationErrors);
    }
  }

  // The recursive function
  function checkObj({
    val,
    affectedKey,
    operator,
    isInArrayItemObject = false,
    isInSubObject = false,
  }) {
    let affectedKeyGeneric;
    let def;

    if (affectedKey) {
      // When we hit a blackbox key, we don't progress any further
      if (schema.keyIsInBlackBox(affectedKey)) return;

      // Make a generic version of the affected key, and use that
      // to get the schema for this key.
      affectedKeyGeneric = MongoObject.makeKeyGeneric(affectedKey);

      const shouldValidateKey = !keysToValidate || keysToValidate.some((keyToValidate) => (
        keyToValidate === affectedKey
        || keyToValidate === affectedKeyGeneric
        || affectedKey.startsWith(`${keyToValidate}.`)
        || affectedKeyGeneric.startsWith(`${keyToValidate}.`)
      ));

      // Prepare the context object for the rule functions
      const fieldParentNameWithEndDot = getParentOfKey(affectedKey, true);
      const fieldParentName = fieldParentNameWithEndDot.slice(0, -1);

      const functionsContext = {
        field(fName) {
          return getFieldInfo(fName);
        },
        genericKey: affectedKeyGeneric,
        isInArrayItemObject,
        isInSubObject,
        isModifier,
        isSet: (val !== undefined),
        key: affectedKey,
        obj,
        operator,
        parentField() {
          return getFieldInfo(fieldParentName);
        },
        siblingField(fName) {
          return getFieldInfo(fieldParentNameWithEndDot + fName);
        },
        validationContext,
        value: val,
        ...(extendedCustomContext || {}),
      };

      // Perform validation for this key
      def = schema.getDefinition(affectedKey, null, functionsContext);
      if (shouldValidateKey) {
        validate(val, affectedKey, affectedKeyGeneric, def, operator, isInArrayItemObject, isInSubObject);
      }
    }

    // If affectedKeyGeneric is undefined due to this being the first run of this
    // function, objectKeys will return the top-level keys.
    const childKeys = schema.objectKeys(affectedKeyGeneric);

    // Temporarily convert missing objects to empty objects
    // so that the looping code will be called and required
    // descendent keys can be validated.
    if ((val === undefined || val === null) && (!def || (!def.optional && childKeys && childKeys.length > 0))) {
      val = {};
    }

    // Loop through arrays
    if (Array.isArray(val)) {
      val.forEach((v, i) => {
        checkObj({
          val: v,
          affectedKey: `${affectedKey}.${i}`,
          operator,
        });
      });
    } else if (isObjectWeShouldTraverse(val) && (!def || !schema._blackboxKeys.has(affectedKey))) {
      // Loop through object keys

      // Get list of present keys
      const presentKeys = Object.keys(val);

      // If this object is within an array, make sure we check for
      // required as if it's not a modifier
      isInArrayItemObject = (affectedKeyGeneric && affectedKeyGeneric.slice(-2) === '.$');

      const checkedKeys = [];

      // Check all present keys plus all keys defined by the schema.
      // This allows us to detect extra keys not allowed by the schema plus
      // any missing required keys, and to run any custom functions for other keys.
      /* eslint-disable no-restricted-syntax */
      for (const key of [...presentKeys, ...childKeys]) {
        // `childKeys` and `presentKeys` may contain the same keys, so make
        // sure we run only once per unique key
        if (checkedKeys.indexOf(key) !== -1) continue;
        checkedKeys.push(key);

        checkObj({
          val: val[key],
          affectedKey: appendAffectedKey(affectedKey, key),
          operator,
          isInArrayItemObject,
          isInSubObject: true,
        });
      }
      /* eslint-enable no-restricted-syntax */
    }
  }

  function checkModifier(mod) {
    // Loop through operators
    Object.keys(mod).forEach((op) => {
      const opObj = mod[op];
      // If non-operators are mixed in, throw error
      if (op.slice(0, 1) !== '$') {
        throw new Error(`Expected '${op}' to be a modifier operator like '$set'`);
      }
      if (shouldCheck(op)) {
        // For an upsert, missing props would not be set if an insert is performed,
        // so we check them all with undefined value to force any 'required' checks to fail
        if (isUpsert && (op === '$set' || op === '$setOnInsert')) {
          const presentKeys = Object.keys(opObj);
          schema.objectKeys().forEach((schemaKey) => {
            if (!presentKeys.includes(schemaKey)) {
              checkObj({
                val: undefined,
                affectedKey: schemaKey,
                operator: op,
              });
            }
          });
        }
        // Don't use forEach here because it will not properly handle an
        // object that has a property named `length`
        Object.keys(opObj).forEach((k) => {
          let v = opObj[k];
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
          });
        });
      }
    });
  }

  // Kick off the validation
  if (isModifier) {
    checkModifier(obj);
  } else {
    checkObj({ val: obj });
  }

  // Custom whole-doc validators
  const docValidators = schema._docValidators.concat(SimpleSchema._docValidators);
  const docValidatorContext = {
    ignoreTypes,
    isModifier,
    isUpsert,
    keysToValidate,
    mongoObject,
    obj,
    schema,
    validationContext,
    ...(extendedCustomContext || {}),
  };
  docValidators.forEach((func) => {
    const errors = func.call(docValidatorContext, obj);
    if (!Array.isArray(errors)) throw new Error('Custom doc validator must return an array of error objects');
    if (errors.length) validationErrors = validationErrors.concat(errors);
  });

  const addedFieldNames = [];
  validationErrors = validationErrors.filter((errObj) => {
    // Remove error types the user doesn't care about
    if (ignoreTypes.includes(errObj.type)) return false;
    // Make sure there is only one error per fieldName
    if (addedFieldNames.includes(errObj.name)) return false;

    addedFieldNames.push(errObj.name);
    return true;
  });
  return validationErrors;
}

export default doValidation;
