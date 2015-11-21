var schemaDefinition = {
  type: Match.Any,
  label: Match.Optional(Match.OneOf(String, Function)),
  optional: Match.Optional(Match.OneOf(Boolean, Function)),
  min: Match.Optional(Match.OneOf(Number, Date, Function)),
  max: Match.Optional(Match.OneOf(Number, Date, Function)),
  minCount: Match.Optional(Match.OneOf(Number, Function)),
  maxCount: Match.Optional(Match.OneOf(Number, Function)),
  allowedValues: Match.Optional(Match.OneOf([Match.Any], Function)),
  decimal: Match.Optional(Boolean),
  exclusiveMax: Match.Optional(Boolean),
  exclusiveMin: Match.Optional(Boolean),
  regEx: Match.Optional(Match.OneOf(RegExp, [RegExp])),
  custom: Match.Optional(Function),
  blackbox: Match.Optional(Boolean),
  autoValue: Match.Optional(Function),
  defaultValue: Match.Optional(Match.Any),
  trim: Match.Optional(Boolean)
};

var optionsThatCanBeFunction = [
  'label',
  'optional',
  'min',
  'max',
  'minCount',
  'maxCount',
  'allowedValues',
];

// Main exported class
SimpleSchema = function (schemas, options) {
  var self = this;
  var firstLevelSchemaKeys = [];
  var fieldNameRoot;
  options = options || {};
  schemas = schemas || {};

  if (!_.isArray(schemas)) schemas = [schemas];

  // adjust and store a copy of the schema definitions
  self._schema = mergeSchemas(schemas);

  // store the list of defined keys for speedier checking
  self._schemaKeys = [];

  // store autoValue functions by key
  self._autoValues = {};

  // store the list of blackbox keys for passing to MongoObject constructor
  self._blackboxKeys = [];

  // a place to store custom validators for this instance
  self._validators = [];

  // a place to store custom error messages for this schema
  self._messages = {};

  self._depsMessages = new Tracker.Dependency();
  self._depsLabels = {};

  _.each(self._schema, function(definition, fieldName) {
    // Validate the field definition
    try {
      check(definition, schemaDefinition);
    } catch (error) {
      if (error.message.indexOf('Match error: Unknown key in field ') === 0) {
        var badKey = error.message.replace('Match error: Unknown key in field ', '');
        throw new Error('Invalid definition for ' + fieldName + ' field: "' + badKey + '" is not a supported option');
      }
      throw new Error('Invalid definition for ' + fieldName + ' field: ' + error.message);
    }

    fieldNameRoot = fieldName.split(".")[0];

    self._schemaKeys.push(fieldName);

    // AUTOVALUE

    // We support defaultValue shortcut by converting it immediately into an
    // autoValue.
    if ('defaultValue' in definition) {
      if ('autoValue' in definition) {
        console.warn('SimpleSchema: Found both autoValue and defaultValue options for "' + fieldName + '". Ignoring defaultValue.');
      } else {
        if (fieldName.slice(-2) === ".$") {
          throw new Error('An array item field (one that ends with ".$") cannot have defaultValue.');
        }
        self._autoValues[fieldName] = (function defineAutoValue(v) {
          return function() {
            if (this.operator === null && !this.isSet) {
              return v;
            }
          };
        })(definition.defaultValue);
      }
    }

    if ('autoValue' in definition) {
      if (fieldName.slice(-2) === ".$") {
        throw new Error('An array item field (one that ends with ".$") cannot have autoValue.');
      }
      self._autoValues[fieldName] = definition.autoValue;
    }

    // LABELS
    self._depsLabels[fieldName] = new Tracker.Dependency();
    if (!definition.hasOwnProperty('label')) {
      self._schema[fieldName].label = inflectedLabel(fieldName);
    }

    if (definition.blackbox === true) {
      self._blackboxKeys.push(fieldName);
    }

    if (!_.contains(firstLevelSchemaKeys, fieldNameRoot)) {
      firstLevelSchemaKeys.push(fieldNameRoot);
    }
  });

  // Cache these lists
  self._firstLevelSchemaKeys = firstLevelSchemaKeys;
  self._objectKeys = getObjectKeys(self._schema, self._schemaKeys);

  // We will store named validation contexts here
  self._validationContexts = {};
};

// If you need to allow properties other than those listed above, call this from your app or package
SimpleSchema.extendOptions = function(options) {
  _.extend(schemaDefinition, options);
};

SimpleSchema._makeGeneric = function(name) {
  if (typeof name !== 'string') return null;
  return name.replace(/\.[0-9]+(?=\.|$)/g, '.$');
};

/*
 * BEGIN Make this package work with the `check` package
 */

// Inherit from Match.Where
// This allow SimpleSchema instance to be recognized as a Match.Where instance as well
// as a SimpleSchema instance
SimpleSchema.prototype = new Match.Where();

// If an object is an instance of Match.Where, Meteor built-in check API will look at
// the function named `condition` and will pass it the document to validate
SimpleSchema.prototype.condition = function(obj) {
  var self = this;

  //determine whether obj is a modifier
  var isModifier, isNotModifier;
  _.each(obj, function(val, key) {
    if (key.substring(0, 1) === "$") {
      isModifier = true;
    } else {
      isNotModifier = true;
    }
  });

  if (isModifier && isNotModifier) {
    throw new Match.Error("Object cannot contain modifier operators alongside other keys");
  }

  var ctx = self.newContext();
  if (!ctx.validate(obj, {modifier: isModifier, filter: false, autoConvert: false})) {
    var error = ctx.getErrorObject();
    var matchError = new Match.Error(error.message);
    matchError.invalidKeys = error.invalidKeys;
    if (Meteor.isServer) {
      matchError.sanitizedError = error.sanitizedError;
    }
    throw matchError;
  }

  return true;
};

/*
 * END Make this package work with the `check` package
 */

/**
 * @param {String} [key] One specific or generic key for which to get the schema
 * @returns {Object} The entire schema object or just the definition for one key
 */
SimpleSchema.prototype.schema = function (key) {
  return key ? this._schema[SimpleSchema._makeGeneric(key)] : this._schema;
};

/**
 * Returns the evaluated definition for one key in the schema
 *
 * @param {String} key Generic or specific schema key
 * @param {Array(String)} [propList] Array of schema properties you need; performance optimization
 * @param {Object} [functionContext] The context to use when evaluating schema options that are functions
 * @returns {Object} The schema definition for the requested key
 */
SimpleSchema.prototype.getDefinition = function (key, propList, functionContext) {
  var self = this;
  var defs = self.schema(key);
  if (!defs) return;
  defs = _.isArray(propList) ? _.pick(defs, propList) : _.clone(defs);

  // Clone any, for any options that support specifying a function, evaluate the functions.
  var result = {};
  for (var prop in defs) {
    if (defs.hasOwnProperty(prop)) {
      result[prop] = defs[prop];
      if (optionsThatCanBeFunction.indexOf(prop) > -1 && typeof result[prop] === 'function') {
        result[prop] = result[prop].call(functionContext || {});
        // Inflect label if undefined
        if (prop === 'label' && typeof result[prop] !== 'string') result[prop] = inflectedLabel(key);
      }
    }
  }
  return result;
};

// Check if the key is a nested dot-syntax key inside of a blackbox object
SimpleSchema.prototype.keyIsInBlackBox = function (key) {
  var self = this;
  var parentPath = SimpleSchema._makeGeneric(key), lastDot, def;

  // Iterate the dot-syntax hierarchy until we find a key in our schema
  do {
    lastDot = parentPath.lastIndexOf('.');
    if (lastDot !== -1) {
      parentPath = parentPath.slice(0, lastDot); // Remove last path component
      def = self.getDefinition(parentPath);
    }
  } while (lastDot !== -1 && !def);

  return !!(def && def.blackbox);
};

// Returns true if key is explicitly allowed by the schema or implied
// by other explicitly allowed keys.
// The key string should have $ in place of any numeric array positions.
SimpleSchema.prototype.allowsKey = function (key) {
  var self = this;

  // Loop through all keys in the schema
  return _.any(self._schemaKeys, function (schemaKey) {

    // If the schema key is the test key, it's allowed.
    if (schemaKey === key) return true;

    // Black box handling
    if (self.schema(schemaKey).blackbox === true) {
      var kl = schemaKey.length;
      var compare1 = key.slice(0, kl + 2);
      var compare2 = compare1.slice(0, -1);

      // If the test key is the black box key + ".$", then the test
      // key is NOT allowed because black box keys are by definition
      // only for objects, and not for arrays.
      if (compare1 === schemaKey + '.$') return false;

      // Otherwise
      if (compare2 === schemaKey + '.') return true;
    }

    return false;
  });
};

// Returns all the child keys for the object identified by the generic prefix,
// or all the top level keys if no prefix is supplied.
SimpleSchema.prototype.objectKeys = function (keyPrefix) {
  var self = this;
  if (!keyPrefix) return self._firstLevelSchemaKeys;
  return self._objectKeys[keyPrefix + "."] || [];
};

/*
 * PRIVATE
 */

function mergeSchemas(schemas) {

  // Merge all provided schema definitions.
  // This is effectively a shallow clone of each object, too,
  // which is what we want since we are going to manipulate it.
  var mergedSchema = {};
  _.each(schemas, function(schema) {

    // Create a temporary SS instance so that the internal object
    // we use for merging/extending will be fully expanded
    if (Match.test(schema, SimpleSchema)) {
      schema = schema._schema;
    } else {
      schema = addImplicitKeys(expandSchema(schema));
    }

    // Loop through and extend each individual field
    // definition. That way you can extend and overwrite
    // base field definitions.
    _.each(schema, function(def, field) {
      mergedSchema[field] = mergedSchema[field] || {};
      _.extend(mergedSchema[field], def);
    });

  });

  // If we merged some schemas, do this again to make sure
  // extended definitions are pushed into array item field
  // definitions properly.
  schemas.length && adjustArrayFields(mergedSchema);

  return mergedSchema;
}

// Returns an object relating the keys in the list
// to their parent object.
function getObjectKeys(schema, schemaKeyList) {
  var keyPrefix, remainingText, rKeys = {}, loopArray;
  _.each(schema, function(definition, fieldName) {
    if (definition.type === Object) {
      //object
      keyPrefix = fieldName + ".";
    } else {
      return;
    }

    loopArray = [];
    _.each(schemaKeyList, function(fieldName2) {
      if (fieldName2.startsWith(keyPrefix)) {
        remainingText = fieldName2.substring(keyPrefix.length);
        if (remainingText.indexOf(".") === -1) {
          loopArray.push(remainingText);
        }
      }
    });
    rKeys[keyPrefix] = loopArray;
  });
  return rKeys;
}

function expandSchema(schema) {
  // Flatten schema by inserting nested definitions
  _.each(schema, function(val, key) {
    var dot, type;
    if (!val) {
      return;
    }
    if (Match.test(val.type, SimpleSchema)) {
      dot = '.';
      type = val.type;
      val.type = Object;
    } else if (Match.test(val.type, [SimpleSchema])) {
      dot = '.$.';
      type = val.type[0];
      val.type = [Object];
    } else {
      return;
    }
    //add child schema definitions to parent schema
    _.each(type._schema, function(subVal, subKey) {
      var newKey = key + dot + subKey;
      if (!(newKey in schema)) {
        schema[newKey] = subVal;
      }
    });
  });
  return schema;
}

function adjustArrayFields(schema) {
  _.each(schema, function(def, existingKey) {
    if (_.isArray(def.type) || def.type === Array) {
      // Copy some options to array-item definition
      var itemKey = existingKey + ".$";
      if (!(itemKey in schema)) {
        schema[itemKey] = {};
      }
      if (_.isArray(def.type)) {
        schema[itemKey].type = def.type[0];
      }
      if (def.label) {
        schema[itemKey].label = def.label;
      }
      schema[itemKey].optional = true;
      if (typeof def.min !== "undefined") {
        schema[itemKey].min = def.min;
      }
      if (typeof def.max !== "undefined") {
        schema[itemKey].max = def.max;
      }
      if (typeof def.allowedValues !== "undefined") {
        schema[itemKey].allowedValues = def.allowedValues;
      }
      if (typeof def.decimal !== "undefined") {
        schema[itemKey].decimal = def.decimal;
      }
      if (typeof def.exclusiveMax !== "undefined") {
        schema[itemKey].exclusiveMax = def.exclusiveMax;
      }
      if (typeof def.exclusiveMin !== "undefined") {
        schema[itemKey].exclusiveMin = def.exclusiveMin;
      }
      if (typeof def.regEx !== "undefined") {
        schema[itemKey].regEx = def.regEx;
      }
      if (typeof def.blackbox !== "undefined") {
        schema[itemKey].blackbox = def.blackbox;
      }
      // Remove copied options and adjust type
      def.type = Array;
      _.each(['min', 'max', 'allowedValues', 'decimal', 'exclusiveMax', 'exclusiveMin', 'regEx', 'blackbox'], function(k) {
        Utility.deleteIfPresent(def, k);
      });
    }
  });
}

/**
 * Adds implied keys.
 * * If schema contains a key like "foo.$.bar" but not "foo", adds "foo".
 * * If schema contains a key like "foo" with an array type, adds "foo.$".
 * @param {Object} schema
 * @returns {Object} modified schema
 */
function addImplicitKeys(schema) {
  var arrayKeysToAdd = [], objectKeysToAdd = [], newKey, key, i, ln;

  // Pass 1 (objects)
  _.each(schema, function(def, existingKey) {
    var pos = existingKey.indexOf(".");
    while (pos !== -1) {
      newKey = existingKey.substring(0, pos);

      // It's an array item; nothing to add
      if (newKey.substring(newKey.length - 2) === ".$") {
        pos = -1;
      }
      // It's an array of objects; add it with type [Object] if not already in the schema
      else if (existingKey.substring(pos, pos + 3) === ".$.") {
        arrayKeysToAdd.push(newKey); // add later, since we are iterating over schema right now
        pos = existingKey.indexOf(".", pos + 3); // skip over next dot, find the one after
      }
      // It's an object; add it with type Object if not already in the schema
      else {
        objectKeysToAdd.push(newKey); // add later, since we are iterating over schema right now
        pos = existingKey.indexOf(".", pos + 1); // find next dot
      }
    }
  });

  for (i = 0, ln = arrayKeysToAdd.length; i < ln; i++) {
    key = arrayKeysToAdd[i];
    if (!(key in schema)) {
      schema[key] = {type: [Object], optional: true};
    }
  }

  for (i = 0, ln = objectKeysToAdd.length; i < ln; i++) {
    key = objectKeysToAdd[i];
    if (!(key in schema)) {
      schema[key] = {type: Object, optional: true};
    }
  }

  // Pass 2 (arrays)
  adjustArrayFields(schema);

  return schema;
}

/**
 * @param {String} fieldName The full generic schema key
 * @returns {String} A humanized label based on the key
 */
function inflectedLabel(fieldName) {
  var pieces = fieldName.split('.');
  var label;
  do {
    label = pieces.pop();
  } while (label === '$');
  return humanize(label);
}
