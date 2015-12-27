let schemaDefinition = {
  type: Match.Any,
  label: Match.Optional(Match.OneOf(String, Function)),
  optional: Match.Optional(Match.OneOf(Boolean, Function)),
  required: Match.Optional(Match.OneOf(Boolean, Function)),
  min: Match.Optional(Match.OneOf(Number, Date, Function)),
  max: Match.Optional(Match.OneOf(Number, Date, Function)),
  minCount: Match.Optional(Match.OneOf(Number, Function)),
  maxCount: Match.Optional(Match.OneOf(Number, Function)),
  allowedValues: Match.Optional(Match.OneOf([Match.Any], Function)),
  integer: Match.Optional(Boolean),
  exclusiveMax: Match.Optional(Boolean),
  exclusiveMin: Match.Optional(Boolean),
  regEx: Match.Optional(Match.OneOf(RegExp, [RegExp])),
  custom: Match.Optional(Function),
  blackbox: Match.Optional(Boolean),
  autoValue: Match.Optional(Function),
  defaultValue: Match.Optional(Match.Any),
  trim: Match.Optional(Boolean)
};

const optionsThatCanBeFunction = [
  'label',
  'optional',
  'min',
  'max',
  'minCount',
  'maxCount',
  'allowedValues',
];

SimpleSchema = class SimpleSchema {
  constructor(schemas, options) {
    options = options || {};
    schemas = schemas || {};

    if (options.humanizeAutoLabels !== false) options.humanizeAutoLabels = true;

    if (!_.isArray(schemas)) schemas = [schemas];

    // adjust and store a copy of the schema definitions
    this._schema = mergeSchemas(schemas);

    // store the list of defined keys for speedier checking
    this._schemaKeys = [];

    // store autoValue functions by key
    this._autoValues = {};

    // store the list of blackbox keys for passing to MongoObject constructor
    this._blackboxKeys = [];

    // store the list of first level keys
    this._firstLevelSchemaKeys = [];

    // a place to store custom validators for this instance
    this._validators = [];

    // a place to store custom error messages for this schema
    this._messages = {};

    this._depsMessages = new Tracker.Dependency();
    this._depsLabels = {};

    _.each(this._schema, (definition, fieldName) => {
      // Validate the field definition
      try {
        check(definition, schemaDefinition);
      } catch (error) {
        if (error.message.indexOf('Match error: Unknown key in field ') === 0) {
          let badKey = error.message.replace('Match error: Unknown key in field ', '');
          throw new Error('Invalid definition for ' + fieldName + ' field: "' + badKey + '" is not a supported option');
        }
        throw new Error('Invalid definition for ' + fieldName + ' field: ' + error.message);
      }

      // TYPE
      // Since type can be anything, make sure it's defined
      if (!definition.type) throw new Error('Invalid definition for ' + fieldName + ' field: "type" option is required');

      if (_.isArray(definition.type)) {
        throw new Error('Invalid definition for ' + fieldName + ' field: "type" may not be an array. Change it to Array.');
      }

      this._schemaKeys.push(fieldName);

      // AUTOVALUE

      // We support defaultValue shortcut by converting it immediately into an
      // autoValue.
      if ('defaultValue' in definition) {
        if ('autoValue' in definition) {
          console.warn('SimpleSchema: Found both autoValue and defaultValue options for "' + fieldName + '". Ignoring defaultValue.');
        } else {
          if (fieldName.endsWith('.$')) {
            throw new Error('An array item field (one that ends with ".$") cannot have defaultValue.');
          }
          this._autoValues[fieldName] = getDefaultAutoValueFunction(definition.defaultValue);
        }
      }

      if (definition.autoValue) this._autoValues[fieldName] = definition.autoValue;

      // REQUIREDNESS
      if (fieldName.endsWith('.$')) {
        this._schema[fieldName].optional = true;
      } else {
        if (!definition.hasOwnProperty('optional')) {
          if (definition.hasOwnProperty('required')) {
            if (typeof definition.required === 'function') {
              this._schema[fieldName].optional = function () {
                return !definition.required.apply(this, arguments);
              };
            } else {
              this._schema[fieldName].optional = !definition.required;
            }
          } else {
            this._schema[fieldName].optional = (options.requiredByDefault === false);
          }
        }
      }

      delete this._schema[fieldName].required;

      // LABELS
      this._depsLabels[fieldName] = new Tracker.Dependency();
      if (!definition.hasOwnProperty('label')) {
        if (options.defaultLabel) {
          this._schema[fieldName].label = options.defaultLabel;
        } else if (SimpleSchema.defaultLabel) {
          this._schema[fieldName].label = SimpleSchema.defaultLabel;
        } else {
          this._schema[fieldName].label = inflectedLabel(fieldName, options.humanizeAutoLabels);
        }
      }

      if (definition.type === Array) {
        if (!this._schema[fieldName + '.$']) throw new Error('Missing definition for key ' + fieldName + '.$');
        // Set array item label to same as array label if array item label is missing
        if (!this._schema[fieldName + '.$'].hasOwnProperty('label')) {
          this._schema[fieldName + '.$'].label = this._schema[fieldName].label;
        }
      }

      // Keep list of all blackbox keys
      if (definition.blackbox === true) this._blackboxKeys.push(fieldName);

      // Keep list of all top level keys
      if (fieldName.indexOf('.') === -1) this._firstLevelSchemaKeys.push(fieldName);
    }); // END _.each

    // Store a list of all object keys
    this._objectKeys = getObjectKeys(this._schema, this._schemaKeys);

    // We will store named validation contexts here
    this._validationContexts = {};

    this._constructorOptions = options;

    // Schema-level defaults for cleaning
    this._cleanOptions = _.extend({
      filter: true,
      autoConvert: true,
      removeEmptyStrings: true,
      trimStrings: true,
      getAutoValues: true,
      removeNullsFromArrays: false,
      extendAutoValueContext: {}
    }, options.clean);
  }

  /**
   * @param {String} [key] One specific or generic key for which to get the schema
   * @returns {Object} The entire schema object or just the definition for one key
   */
  schema(key) {
    return key ? this._schema[MongoObject.makeKeyGeneric(key)] : this._schema;
  }

  /**
   * Returns the evaluated definition for one key in the schema
   *
   * @param {String} key Generic or specific schema key
   * @param {Array(String)} [propList] Array of schema properties you need; performance optimization
   * @param {Object} [functionContext] The context to use when evaluating schema options that are functions
   * @returns {Object} The schema definition for the requested key
   */
  getDefinition(key, propList, functionContext) {
    let defs = this.schema(key);
    if (!defs) return;
    defs = _.isArray(propList) ? _.pick(defs, propList) : _.clone(defs);

    // Clone any, for any options that support specifying a function, evaluate the functions.
    let result = {};
    for (let prop in defs) {
      if (defs.hasOwnProperty(prop)) {
        result[prop] = defs[prop];
        if (optionsThatCanBeFunction.indexOf(prop) > -1 && typeof result[prop] === 'function') {
          result[prop] = result[prop].call(functionContext || {});
          // Inflect label if undefined
          if (prop === 'label' && typeof result[prop] !== 'string') result[prop] = inflectedLabel(key, this._constructorOptions.humanizeAutoLabels);
        }
      }
    }
    return result;
  }

  // Check if the key is a nested dot-syntax key inside of a blackbox object
  keyIsInBlackBox(key) {
    let testKey = MongoObject.makeKeyGeneric(key), lastDot;

    // Iterate the dot-syntax hierarchy until we find a key in our schema
    do {
      lastDot = testKey.lastIndexOf('.');
      if (lastDot !== -1) {
        testKey = testKey.slice(0, lastDot); // Remove last path component
        if (this._blackboxKeys.indexOf(testKey) > -1) return true;
      }
    } while (lastDot !== -1);

    return false;
  }

  // Returns true if key is explicitly allowed by the schema or implied
  // by other explicitly allowed keys.
  // The key string should have $ in place of any numeric array positions.
  allowsKey(key) {
    // Loop through all keys in the schema
    return _.any(this._schemaKeys, (schemaKey) => {
      // If the schema key is the test key, it's allowed.
      if (schemaKey === key) return true;

      // Black box handling
      if (this.schema(schemaKey).blackbox === true) {
        let kl = schemaKey.length;
        let compare1 = key.slice(0, kl + 2);
        let compare2 = compare1.slice(0, -1);

        // If the test key is the black box key + ".$", then the test
        // key is NOT allowed because black box keys are by definition
        // only for objects, and not for arrays.
        if (compare1 === schemaKey + '.$') return false;

        // Otherwise
        if (compare2 === schemaKey + '.') return true;
      }

      return false;
    });
  }

  /**
   * Returns all the child keys for the object identified by the generic prefix,
   * or all the top level keys if no prefix is supplied.
   *
   * @param {String} [keyPrefix] The Object-type generic key for which to get child keys. Omit for
   *   top-level Object-type keys
   * @returns {[[Type]]} [[Description]]
   */
  objectKeys(keyPrefix) {
    return keyPrefix ? (this._objectKeys[keyPrefix + '.'] || []) : this._firstLevelSchemaKeys;
  }

  /**
   * Extends this schema with another schema, key by key.
   *
   * @param {SimpleSchema} schema
   * @returns {SimpleSchema} The new, extended schema.
   */
  extend(schema) {
    return new SimpleSchema([this, schema]);
  }

  //// STATIC METHODS ////

  // If you need to allow properties other than those listed above, call this from your app or package
  static extendOptions(options) {
    _.extend(schemaDefinition, options);
  }

};

// Backwards compatibility
SimpleSchema._makeGeneric = MongoObject.makeKeyGeneric;

// Error type constants
SimpleSchema.ErrorTypes = {
  REQUIRED: 'required',
  MIN_STRING: 'minString',
  MAX_STRING: 'maxString',
  MIN_NUMBER: 'minNumber',
  MAX_NUMBER: 'maxNumber',
  MIN_NUMBER_EXCLUSIVE: 'minNumberExclusive',
  MAX_NUMBER_EXCLUSIVE: 'maxNumberExclusive',
  MIN_DATE: 'minDate',
  MAX_DATE: 'maxDate',
  BAD_DATE: 'badDate',
  MIN_COUNT: 'minCount',
  MAX_COUNT: 'maxCount',
  MUST_BE_INTEGER: 'noDecimal',
  VALUE_NOT_ALLOWED: 'notAllowed',
  EXPECTED_STRING: 'expectedString',
  EXPECTED_NUMBER: 'expectedNumber',
  EXPECTED_BOOLEAN: 'expectedBoolean',
  EXPECTED_ARRAY: 'expectedArray',
  EXPECTED_OBJECT: 'expectedObject',
  EXPECTED_CONSTRUCTOR: 'expectedConstructor',
  FAILED_REGULAR_EXPRESSION: 'regEx',
  KEY_NOT_IN_SCHEMA: 'keyNotInSchema',
};

/*
 * PRIVATE
 */

function mergeSchemas(schemas) {
  // Merge all provided schema definitions.
  // This is effectively a shallow clone of each object, too,
  // which is what we want since we are going to manipulate it.
  let mergedSchema = {};
  _.each(schemas, function (schema) {

    // Create a temporary SS instance so that the internal object
    // we use for merging/extending will be fully expanded
    if (schema instanceof SimpleSchema) {
      schema = schema._schema;
    } else {
      schema = expandSchema(schema);
    }

    // Loop through and extend each individual field
    // definition. That way you can extend and overwrite
    // base field definitions.
    _.each(schema, function (def, field) {
      mergedSchema[field] = mergedSchema[field] || {};
      _.extend(mergedSchema[field], def);
    });

  });

  return mergedSchema;
}

// Returns an object relating the keys in the list
// to their parent object.
function getObjectKeys(schema, schemaKeyList) {
  let result = {};

  _.each(schema, function (definition, key) {
    if (definition.type !== Object) return;

    let keyPrefix = key + '.';
    let childKeys = [];
    _.each(schemaKeyList, function (otherKey) {
      // Is it a descendant key?
      if (!otherKey.startsWith(keyPrefix)) return;
      let remainingText = otherKey.substring(keyPrefix.length);
      // Is it a direct child?
      if (remainingText.indexOf('.') === -1) childKeys.push(remainingText);
    });
    result[keyPrefix] = childKeys;
  });

  return result;
}

function expandSchema(schema) {
  // BEGIN SHORTHAND
  let addArrayFields = [];
  _.each(schema, function (definition, key) {
    if (!Utility.isBasicObject(definition)) {
      if (_.isArray(definition)) {
        if (_.isArray(definition[0])) {
          throw new Error(`Array shorthand may only be used to one level of depth (${key})`);
        }
        addArrayFields.push({key: key, type: definition[0]});
        schema[key] = {
          type: Array
        };
      } else {
        schema[key] = {
          type: definition
        };
      }
    }
  });

  for (let {key, type} of addArrayFields) {
    if (schema[`${key}.$`]) {
      throw new Error(`Array shorthand used for ${key} field but ${key}.$ key is already in the schema`);
    }
    schema[`${key}.$`] = {
      type
    };
  }
  // END SHORTHAND

  // Flatten schema by inserting nested definitions
  _.each(schema, function (val, key) {
    if (!(val.type instanceof SimpleSchema)) return;

    // Add child schema definitions to parent schema
    _.each(val.type._schema, function (subVal, subKey) {
      let newKey = key + '.' + subKey;
      if (!schema.hasOwnProperty(newKey)) schema[newKey] = subVal;
    });

    val.type = Object;
  });
  return schema;
}

/**
 * @param {String} fieldName The full generic schema key
 * @param {Boolean} shouldHumanize Humanize it
 * @returns {String} A label based on the key
 */
function inflectedLabel(fieldName, shouldHumanize) {
  let pieces = fieldName.split('.');
  let label;
  do {
    label = pieces.pop();
  } while (label === '$' && pieces.length);
  return shouldHumanize ? humanize(label) : label;
}

function getDefaultAutoValueFunction(defaultValue) {
  return function () {
    if (!this.isSet) {
      if (this.operator === null) {
        return defaultValue;
      } else {
        // We don't know whether it's an upsert, but if it's not, this seems to be ignored,
        // so this is a safe way to make sure the default value is added on upsert insert.
        return {
          $setOnInsert: defaultValue
        };
      }
    }
  };
}
