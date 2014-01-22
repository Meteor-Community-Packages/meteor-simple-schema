//URL RegEx from https://gist.github.com/dperini/729294
//http://mathiasbynens.be/demo/url-regex

if (Meteor.isServer) {
  S = Npm.require("string");
}
if (Meteor.isClient) {
  S = window.S;
}

var schemaDefinition = {
  type: Match.Any,
  label: Match.Optional(String),
  optional: Match.Optional(Boolean),
  min: Match.Optional(Match.OneOf(Number, Date, Function)),
  max: Match.Optional(Match.OneOf(Number, Date, Function)),
  minCount: Match.Optional(Number),
  maxCount: Match.Optional(Number),
  allowedValues: Match.Optional([Match.Any]),
  valueIsAllowed: Match.Optional(Function), //TODO deprecate this in favor of custom?
  decimal: Match.Optional(Boolean),
  regEx: Match.Optional(Match.OneOf(RegExp, [RegExp])),
  custom: Match.Optional(Function)
};

//exported
SimpleSchema = function(schemas, options) {
  var self = this, requiredSchemaKeys = [], firstLevelSchemaKeys = [],
          firstLevelRequiredSchemaKeys = [], valueIsAllowedSchemaKeys = [],
          firstLevelValueIsAllowedSchemaKeys = [], fieldNameRoot;
  options = options || {};
  schemas = schemas || {};

  if (!_.isArray(schemas)) {
    schemas = [schemas];
  }

  // adjust and store a copy of the schema definitions
  self._schema = mergeSchemas(schemas);

  // store the list of defined keys for speedier checking
  self._schemaKeys = [];

  // a place to store custom validators for this instance
  self._validators = [];

  // a place to store custom error messages for this schema
  self._messages = {};

  var overrideMessages = {};
  _.each(self._schema, function(definition, fieldName) {
    // Validate the field definition
    if (!Match.test(definition, schemaDefinition)) {
      throw new Error('Invalid definition for ' + fieldName + ' field.');
    }

    fieldNameRoot = fieldName.split(".")[0];

    self._schemaKeys.push(fieldName);

    if (!_.contains(firstLevelSchemaKeys, fieldNameRoot)) {
      firstLevelSchemaKeys.push(fieldNameRoot);
      if (!definition.optional) {
        firstLevelRequiredSchemaKeys.push(fieldNameRoot);
      }

      if (definition.valueIsAllowed) {
        firstLevelValueIsAllowedSchemaKeys.push(fieldNameRoot);
      }
    }

    if (!definition.optional) {
      requiredSchemaKeys.push(fieldName);
    }

    if (definition.valueIsAllowed) {
      valueIsAllowedSchemaKeys.push(fieldName);
    }

    // Set up nicer error messages for the built-in regEx.
    // Users will need to override these at the schema-specific level,
    // which could be undesirable, so we provide an option to
    // skip this.
    if (options.defineBuiltInRegExMessages !== false) {
      if (definition.regEx === SimpleSchema.RegEx.Email) {
        overrideMessages['regEx ' + fieldName] = "[label] must be a valid e-mail address";
      } else if (definition.regEx === SimpleSchema.RegEx.Url) {
        overrideMessages['regEx ' + fieldName] = "[label] must be a valid URL";
      } else if (_.isArray(definition.regEx)) {
        _.each(definition.regEx, function(re, i) {
          if (re === SimpleSchema.RegEx.Email) {
            overrideMessages['regEx.' + i + ' ' + fieldName] = "[label] must be a valid e-mail address";
          } else if (re === SimpleSchema.RegEx.Url) {
            overrideMessages['regEx.' + i + ' ' + fieldName] = "[label] must be a valid URL";
          }
        });
      }
    }

  });

  // Set override messages
  self.messages(overrideMessages);

  // Cache these lists
  self._requiredSchemaKeys = requiredSchemaKeys;
  self._firstLevelSchemaKeys = firstLevelSchemaKeys;
  self._firstLevelRequiredSchemaKeys = firstLevelRequiredSchemaKeys;
  self._requiredObjectKeys = getObjectKeys(self._schema, requiredSchemaKeys);
  self._valueIsAllowedSchemaKeys = valueIsAllowedSchemaKeys;
  self._firstLevelValueIsAllowedSchemaKeys = firstLevelValueIsAllowedSchemaKeys;
  self._valueIsAllowedObjectKeys = getObjectKeys(self._schema, valueIsAllowedSchemaKeys);

  // We will store named validation contexts here
  self._validationContexts = {};
};

// This allows other packages or users to extend the schema
// definition options that are supported.
SimpleSchema.extendOptions = function(options) {
  _.extend(schemaDefinition, options);
};

SimpleSchema.RegEx = {
  Email: /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/,
  Url: /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i
};

// exported for backwards compatibility, deprecated
SchemaRegEx = SimpleSchema.RegEx;

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

  if (isModifier && isNotModifier)
    throw new Match.Error("Object cannot contain modifier operators alongside other keys");

  if (!self.newContext().validate(obj, {modifier: isModifier, filter: false, autoConvert: false}))
    throw new Match.Error("One or more properties do not match the schema.");

  return true;
};

SimpleSchema.prototype.namedContext = function(name) {
  var self = this;
  if (typeof name !== "string") {
    name = "default";
  }
  self._validationContexts[name] = self._validationContexts[name] || new SimpleSchemaValidationContext(self);
  return self._validationContexts[name];
};

// Global custom validators
SimpleSchema._validators = [];
SimpleSchema.addValidator = function(func) {
  SimpleSchema._validators.push(func);
};

// Instance custom validators
// validator is deprecated; use addValidator
SimpleSchema.prototype.addValidator = SimpleSchema.prototype.validator = function(func) {
  this._validators.push(func);
};

// Filter and automatically type convert
SimpleSchema.prototype.clean = function(doc, options) {
  var self = this;

  // By default, doc will be filtered and autoconverted
  options = _.extend({
    filter: true,
    autoConvert: true
  }, options || {});

  // Convert $pushAll (deprecated) to $push with $each
  if ("$pushAll" in doc) {
    doc.$push = doc.$push || {};
    for (var field in doc.$pushAll) {
      doc.$push[field] = doc.$push[field] || {};
      doc.$push[field].$each = doc.$push[field].$each || [];
      for (var i = 0, ln = doc.$pushAll[field].length; i < ln; i++) {
        doc.$push[field].$each.push(doc.$pushAll[field][i]);
      }
      delete doc.$pushAll;
    }
  }

  var mDoc = new MongoObject(doc);

  // Filter out anything that would affect keys not defined
  // or implied by the schema
  options.filter && mDoc.filterGenericKeys(function(genericKey) {
    return self.allowsKey(genericKey);
  });

  // Autoconvert values if requested and if possible
  options.autoConvert && mDoc.forEachNode(function(val, position, affectedKey, affectedKeyGeneric) {
    if (affectedKeyGeneric) {
      var def = self._schema[affectedKeyGeneric];
      def && this.updateValue(typeconvert(val, def.type));
    }
  });

  return mDoc.getObject();
};

// Returns the entire schema object or just the definition for one key
// in the schema.
SimpleSchema.prototype.schema = function(key) {
  var self = this;
  // if not null or undefined (more specific)
  if (key != null) {
    return self._schema[key];
  } else {
    return self._schema;
  }
};

// Use to dynamically change the schema labels.
SimpleSchema.prototype.labels = function(labels) {
  var self = this;
  _.each(labels, function(label, fieldName) {
    if (!_.isString(label) && !_.isFunction(label))
      return;

    if (!(fieldName in self._schema))
      return;

    self._schema[fieldName]["label"] = label;
  });
};

// should be used to safely get a label as string
SimpleSchema.prototype.label = function(key) {
  var def = this.schema(key);
  if (key == null) {
    var result = {};
    _.each(def, function (def, fieldName) {
      result[fieldName] = this.label(fieldName);
    }, this);
    return result;
  } else {
    var label = def != null ? def.label : undefined;
    return _.isFunction(label) ? label.call(def) : label;
  }
}

// should be used to safely get a label as string
SimpleSchema.prototype.label = function(key) {
  var def = this.schema(key) || {};
  if (key == null) {
    var result = {};
    _.each(def, function(def, fieldName) {
      result[fieldName] = this.label(fieldName);
    }, this);
    return result;
  } else {
    var label = def.label;
    return _.isFunction(label) ? label.call(def) : label;
  }
};

// Global messages

SimpleSchema._globalMessages = {
  required: "[label] is required",
  minString: "[label] must be at least [min] characters",
  maxString: "[label] cannot exceed [max] characters",
  minNumber: "[label] must be at least [min]",
  maxNumber: "[label] cannot exceed [max]",
  minDate: "[label] must be on or before [min]",
  maxDate: "[label] cannot be after [max]",
  minCount: "You must specify at least [minCount] values",
  maxCount: "You cannot specify more than [maxCount] values",
  noDecimal: "[label] must be an integer",
  notAllowed: "[value] is not an allowed value",
  expectedString: "[label] must be a string",
  expectedNumber: "[label] must be a number",
  expectedBoolean: "[label] must be a boolean",
  expectedArray: "[label] must be an array",
  expectedObject: "[label] must be an object",
  expectedConstructor: "[label] must be a [type]",
  regEx: "[label] failed regular expression validation",
  keyNotInSchema: "[label] is not allowed by the schema"
};

SimpleSchema.messages = function(messages) {
  _.extend(SimpleSchema._globalMessages, messages);
};

// Schema-specific messages

SimpleSchema.prototype.messages = function(messages) {
  _.extend(this._messages, messages);
};

// Returns a string message for the given error type and key. Uses the
// def and value arguments to fill in placeholders in the error messages.
SimpleSchema.prototype.messageForError = function(type, key, def, value) {
  var self = this, typePlusKey = type + " " + key, genType,
          genTypePlusKey, firstTypePeriod = type.indexOf(".");
  if (firstTypePeriod !== -1) {
    genType = type.substring(0, firstTypePeriod);
    genTypePlusKey = genType + " " + key;
  }

  // Try finding the correct message to use at various levels, from most
  // specific to least specific.
  // 
  // (1) Use message for specific key, specific type, schema-specific
  // (2) Use message for specific type, schema-specific
  var message = self._messages[typePlusKey] || self._messages[type];
  // (3) Use message for specific key, general type, schema-specific
  // (4) Use message for general type, schema-specific
  if (!message && genType) {
    message = self._messages[genTypePlusKey] || self._messages[genType];
  }
  // (5) Use global message for specific key, specific type
  // (6) Use global message for specific type
  if (!message) {
    message = SimpleSchema._globalMessages[typePlusKey] || SimpleSchema._globalMessages[type];
  }
  // (7) Use global message for specific key, general type
  // (8) Use global message for general type
  if (!message && genType) {
    message = SimpleSchema._globalMessages[genTypePlusKey] || SimpleSchema._globalMessages[genType];
  }
  if (!message)
    return "Unknown validation error";
  def = def || self._schema[key] || {};
  message = message.replace("[label]", self.label(key));
  if (typeof def.minCount !== "undefined") {
    message = message.replace("[minCount]", def.minCount);
  }
  if (typeof def.maxCount !== "undefined") {
    message = message.replace("[maxCount]", def.maxCount);
  }
  if (value !== void 0 && value !== null) {
    message = message.replace("[value]", value.toString());
  }
  var min = def.min;
  var max = def.max;
  if (typeof min === "function") {
    min = min();
  }
  if (typeof max === "function") {
    max = max();
  }
  if (def.type === Date || def.type === [Date]) {
    if (typeof min !== "undefined") {
      message = message.replace("[min]", dateToDateString(min));
    }
    if (typeof max !== "undefined") {
      message = message.replace("[max]", dateToDateString(max));
    }
  } else {
    if (typeof min !== "undefined") {
      message = message.replace("[min]", min);
    }
    if (typeof max !== "undefined") {
      message = message.replace("[max]", max);
    }
  }
  if (def.type instanceof Function) {
    message = message.replace("[type]", def.type.name);
  }
  return message;
};

// Returns true if key is explicitly allowed by the schema or implied
// by other explicitly allowed keys.
// The key string should have $ in place of any numeric array positions.
SimpleSchema.prototype.allowsKey = function(key) {
  var self = this, schemaKeys = self._schemaKeys;

  // Begin by assuming it's not allowed.
  var allowed = false;

  // Loop through all keys in the schema
  for (var i = 0, ln = schemaKeys.length, schemaKey; i < ln; i++) {
    schemaKey = schemaKeys[i];

    // If the schema key is the test key, it's allowed.
    if (schemaKey === key) {
      allowed = true;
      break;
    }

    // If the schema key implies the test key because the schema key
    // starts with the test key followed by a period, it's allowed.
    if (schemaKey.substring(0, key.length + 1) === key + ".") {
      allowed = true;
      break;
    }

    // If the schema key implies the test key because the schema key
    // starts with the test key and the test key ends with ".$", it's allowed.
    var lastTwo = key.slice(-2);
    if (lastTwo === ".$" && key.slice(0, -2) === schemaKey) {
      allowed = true;
      break;
    }
  }

  return allowed;
};

SimpleSchema.prototype.newContext = function() {
  return new SimpleSchemaValidationContext(this);
};

SimpleSchema.prototype.requiredObjectKeys = function(keyPrefix) {
  var self = this;
  if (!keyPrefix) {
    return self._firstLevelRequiredSchemaKeys;
  }
  return self._requiredObjectKeys[keyPrefix + "."] || [];
};

SimpleSchema.prototype.requiredSchemaKeys = function() {
  return this._requiredSchemaKeys;
};

SimpleSchema.prototype.firstLevelSchemaKeys = function() {
  return this._firstLevelSchemaKeys;
};

SimpleSchema.prototype.valueIsAllowedObjectKeys = function(keyPrefix) {
  var self = this;
  if (!keyPrefix) {
    return self._firstLevelValueIsAllowedSchemaKeys;
  }
  return self._valueIsAllowedObjectKeys[keyPrefix + "."] || [];
};

SimpleSchema.prototype.valueIsAllowedSchemaKeys = function() {
  return this._valueIsAllowedSchemaKeys;
};

//called by clean()
var typeconvert = function(value, type) {
  if (type === String) {
    if (typeof value !== "undefined" && value !== null && typeof value !== "string") {
      return value.toString();
    }
    return value;
  }
  if (type === Number) {
    if (typeof value === "string" && !S(value).isEmpty()) {
      //try to convert numeric strings to numbers
      var numberVal = Number(value);
      if (!isNaN(numberVal)) {
        return numberVal;
      } else {
        return value; //leave string; will fail validation
      }
    }
    return value;
  }
  return value;
};

//tests whether it's an Object as opposed to something that inherits from Object
var isBasicObject = function(obj) {
  return _.isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;
};

looksLikeModifier = function(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key) && key.substring(0, 1) === "$") {
      return true;
    }
  }
  return false;
};

var dateToDateString = function(date) {
  var m = (date.getUTCMonth() + 1);
  if (m < 10) {
    m = "0" + m;
  }
  var d = date.getUTCDate();
  if (d < 10) {
    d = "0" + d;
  }
  return date.getUTCFullYear() + '-' + m + '-' + d;
};

var mergeSchemas = function(schemas) {

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
      schema = inflectLabels(addImplicitKeys(expandSchema(schema)));
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
};

var expandSchema = function(schema) {
  // Flatten schema by inserting nested definitions
  _.each(schema, function(val, key) {
    var dot, type;
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
      if (!(newKey in schema))
        schema[newKey] = subVal;
    });
  });
  return schema;
};

var adjustArrayFields = function(schema) {
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
      if (typeof def.valueIsAllowed !== "undefined") {
        schema[itemKey].valueIsAllowed = def.valueIsAllowed;
      }
      if (typeof def.decimal !== "undefined") {
        schema[itemKey].decimal = def.decimal;
      }
      if (typeof def.regEx !== "undefined") {
        schema[itemKey].regEx = def.regEx;
      }
      // Remove copied options and adjust type
      def.type = Array;
      _.each(['min', 'max', 'allowedValues', 'valueIsAllowed', 'decimal', 'regEx'], function(k) {
        deleteIfPresent(def, k);
      });
    }
  });
};

/**
 * Adds implied keys.
 * * If schema contains a key like "foo.$.bar" but not "foo", adds "foo".
 * * If schema contains a key like "foo" with an array type, adds "foo.$".
 * @param {Object} schema
 * @returns {Object} modified schema
 */
var addImplicitKeys = function(schema) {
  var arrayKeysToAdd = [], objectKeysToAdd = [], newKey, key, nextThree;

  // Pass 1 (objects)
  _.each(schema, function(def, existingKey) {
    var pos = existingKey.indexOf(".");

    while (pos !== -1) {
      newKey = existingKey.substring(0, pos);
      nextThree = existingKey.substring(pos, pos + 3);
      if (newKey.substring(newKey.length - 2) !== ".$") {
        if (nextThree === ".$.") {
          arrayKeysToAdd.push(newKey);
        } else {
          objectKeysToAdd.push(newKey);
        }
      }
      pos = existingKey.indexOf(".", pos + 3);
    }
  });

  for (var i = 0, ln = arrayKeysToAdd.length; i < ln; i++) {
    key = arrayKeysToAdd[i];
    if (!(key in schema)) {
      schema[key] = {type: [Object], optional: true};
    }
  }

  for (var i = 0, ln = objectKeysToAdd.length; i < ln; i++) {
    key = objectKeysToAdd[i];
    if (!(key in schema)) {
      schema[key] = {type: Object, optional: true};
    }
  }

  // Pass 2 (arrays)
  adjustArrayFields(schema);

  return schema;
};

// Returns an object relating the keys in the list
// to their parent object.
var getObjectKeys = function(schema, schemaKeyList) {
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
      if (S(fieldName2).startsWith(keyPrefix)) {
        remainingText = fieldName2.substring(keyPrefix.length);
        if (remainingText.indexOf(".") === -1) {
          loopArray.push(remainingText);
        }
      }
    });
    rKeys[keyPrefix] = loopArray;
  });
  return rKeys;
};

//label inflection
var inflectLabels = function(schema) {
  if (!_.isObject(schema))
    return schema;

  var editedSchema = {};
  _.each(schema, function(definition, fieldName) {
    if (_.isString(definition.label) || _.isFunction(definition.label)) {
      editedSchema[fieldName] = definition;
      return;
    }

    var label = fieldName, lastPeriod = label.lastIndexOf(".");
    if (lastPeriod !== -1) {
      label = label.substring(lastPeriod + 1);
      if (label === "$") {
        var pcs = fieldName.split(".");
        label = pcs[pcs.length - 2];
      }
    }
    definition.label = S(label).humanize().s;
    editedSchema[fieldName] = definition;
  });

  return editedSchema;
};

var deleteIfPresent = function(obj, key) {
  if (key in obj) {
    delete obj[key];
  }
};
