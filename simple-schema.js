if (Meteor.isServer) {
  S = Npm.require("string");
}
if (Meteor.isClient) {
  S = window.S;
}

var schemaDefinition = {
  type: Match.Any,
  label: Match.Optional(Match.OneOf(String, Function)),
  optional: Match.Optional(Boolean),
  min: Match.Optional(Match.OneOf(Number, Date, Function)),
  max: Match.Optional(Match.OneOf(Number, Date, Function)),
  minCount: Match.Optional(Number),
  maxCount: Match.Optional(Number),
  allowedValues: Match.Optional([Match.Any]),
  valueIsAllowed: Match.Optional(Function), //TODO deprecate this in favor of custom?
  decimal: Match.Optional(Boolean),
  regEx: Match.Optional(Match.OneOf(RegExp, [RegExp])),
  custom: Match.Optional(Function),
  blackbox: Match.Optional(Boolean),
  autoValue: Match.Optional(Function),
  defaultValue: Match.Optional(Match.Any)
};

//exported
SimpleSchema = function(schemas, options) {
  var self = this;
  var firstLevelSchemaKeys = [];
  var requiredSchemaKeys = [], firstLevelRequiredSchemaKeys = [];
  var valueIsAllowedSchemaKeys = [], firstLevelValueIsAllowedSchemaKeys = [];
  var customSchemaKeys = [], firstLevelCustomSchemaKeys = [];
  var fieldNameRoot;
  options = options || {};
  schemas = schemas || {};

  if (!_.isArray(schemas)) {
    schemas = [schemas];
  }

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

  self._depsMessages = new Deps.Dependency;
  self._depsLabels = {};

  var overrideMessages = {};
  _.each(self._schema, function(definition, fieldName) {
    // Validate the field definition
    if (!Match.test(definition, schemaDefinition)) {
      throw new Error('Invalid definition for ' + fieldName + ' field.');
    }

    fieldNameRoot = fieldName.split(".")[0];

    self._schemaKeys.push(fieldName);

    // We support defaultValue shortcut by converting it immediately into an
    // autoValue.
    if ('defaultValue' in definition) {
      if ('autoValue' in definition) {
        console.warn('SimpleSchema: Found both autoValue and defaultValue options for "' + fieldName + '". Ignoring defaultValue.');
      } else {
        if (fieldName.slice(-2) === ".$") {
          throw new Error('An array item field (one that ends with ".$") cannot have defaultValue.')
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
        throw new Error('An array item field (one that ends with ".$") cannot have autoValue.')
      }
      self._autoValues[fieldName] = definition.autoValue;
    }

    self._depsLabels[fieldName] = new Deps.Dependency;

    if (definition.blackbox === true) {
      self._blackboxKeys.push(fieldName);
    }

    if (!_.contains(firstLevelSchemaKeys, fieldNameRoot)) {
      firstLevelSchemaKeys.push(fieldNameRoot);
      if (!definition.optional) {
        firstLevelRequiredSchemaKeys.push(fieldNameRoot);
      }

      if (definition.valueIsAllowed) {
        firstLevelValueIsAllowedSchemaKeys.push(fieldNameRoot);
      }

      if (definition.custom) {
        firstLevelCustomSchemaKeys.push(fieldNameRoot);
      }
    }

    if (!definition.optional) {
      requiredSchemaKeys.push(fieldName);
    }

    if (definition.valueIsAllowed) {
      valueIsAllowedSchemaKeys.push(fieldName);
    }

    if (definition.custom) {
      customSchemaKeys.push(fieldName);
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
  self._firstLevelSchemaKeys = firstLevelSchemaKeys;
  //required
  self._requiredSchemaKeys = requiredSchemaKeys;
  self._firstLevelRequiredSchemaKeys = firstLevelRequiredSchemaKeys;
  self._requiredObjectKeys = getObjectKeys(self._schema, requiredSchemaKeys);
  //valueIsAllowed
  self._valueIsAllowedSchemaKeys = valueIsAllowedSchemaKeys;
  self._firstLevelValueIsAllowedSchemaKeys = firstLevelValueIsAllowedSchemaKeys;
  self._valueIsAllowedObjectKeys = getObjectKeys(self._schema, valueIsAllowedSchemaKeys);
  //custom
  self._customSchemaKeys = customSchemaKeys;
  self._firstLevelCustomSchemaKeys = firstLevelCustomSchemaKeys;
  self._customObjectKeys = getObjectKeys(self._schema, customSchemaKeys);

  // We will store named validation contexts here
  self._validationContexts = {};
};

// This allows other packages or users to extend the schema
// definition options that are supported.
SimpleSchema.extendOptions = function(options) {
  _.extend(schemaDefinition, options);
};

// regex for email validation after RFC 5322
// the obsolete double quotes and square brackets are left out
// read: http://www.regular-expressions.info/email.html
var RX_MAIL_NAME = '[a-z0-9!#$%&\'*+\\/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&\'*+\\/=?^_`{|}~-]+)*';
// this domain regex matches all domains that have at least one .
// sadly IPv4 Adresses will be caught too but technically those are valid domains
// this expression is extracted from the original RFC 5322 mail expression
// a modification enforces that the tld consists only of characters
var RX_DOMAIN = '(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z](?:[a-z-]*[a-z])?';
// this domain regex matches everythign that could be a domain in intranet
// that means "localhost" is a valid domain
var RX_NAME_DOMAIN = '(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\\.|$))+';
// strict IPv4 expression which allows 0-255 per oktett
var RX_IPv4 = '(?:(?:[0-1]?\\d{1,2}|2[0-4]\\d|25[0-5])(?:\\.|$)){4}';
// strict IPv6 expression which allows (and validates) all shortcuts
var RX_IPv6 = '(?:(?:[\\dA-Fa-f]{1,4}(?::|$)){8}' // full adress
  + '|(?=(?:[^:\\s]|:[^:\\s])*::(?:[^:\\s]|:[^:\\s])*$)' // or min/max one '::'
  + '[\\dA-Fa-f]{0,4}(?:::?(?:[\\dA-Fa-f]{1,4}|$)){1,6})'; // and short adress
// this allows domains (also localhost etc) and ip adresses
var RX_WEAK_DOMAIN = '(?:' + [RX_NAME_DOMAIN,RX_IPv4,RX_IPv6].join('|') + ')';

SimpleSchema.RegEx = {
  Email: new RegExp('^' + RX_MAIL_NAME + '@' + RX_DOMAIN + '$'),
  WeakEmail: new RegExp('^' + RX_MAIL_NAME + '@' + RX_WEAK_DOMAIN + '$'),
  
  Domain: new RegExp('^' + RX_DOMAIN + '$'),
  WeakDomain: new RegExp('^' + RX_WEAK_DOMAIN + '$'),
  
  IP: new RegExp('^(?:' + RX_IPv4 + '|' + RX_IPv6 + ')$'),
  IPv4: new RegExp('^' + RX_IPv4 + '$'),
  IPv6: new RegExp('^' + RX_IPv6 + '$'),
  // URL RegEx from https://gist.github.com/dperini/729294
  // http://mathiasbynens.be/demo/url-regex
  Url: /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i,
  // unique id from the random package also used by minimongo
  // character list: https://github.com/meteor/meteor/blob/release/0.8.0/packages/random/random.js#L88
  // string length: https://github.com/meteor/meteor/blob/release/0.8.0/packages/random/random.js#L143
  Id: /^[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{17}$/
};

SimpleSchema._makeGeneric = function(name) {
  if (typeof name !== "string")
    return null;

  return name.replace(/\.[0-9]+\./g, '.$.').replace(/\.[0-9]+/g, '.$');
};

SimpleSchema._depsGlobalMessages = new Deps.Dependency;

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

function logInvalidKeysForContext(context, name) {
  Meteor.startup(function() {
    Deps.autorun(function() {
      if (!context.isValid()) {
        console.log('SimpleSchema invalid keys for "' + name + '" context:', context.invalidKeys());
      }
    });
  });
}

SimpleSchema.prototype.namedContext = function(name) {
  var self = this;
  if (typeof name !== "string") {
    name = "default";
  }
  if (!self._validationContexts[name]) {
    self._validationContexts[name] = new SimpleSchemaValidationContext(self);

    // In debug mode, log all invalid key errors to the browser console
    if (SimpleSchema.debug && Meteor.isClient) {
      Deps.nonreactive(function() {
        logInvalidKeysForContext(self._validationContexts[name], name);
      });
    }
  }
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

/**
 * @method SimpleSchema.prototype.clean
 * @param {Object} doc - Document or modifier to clean. Referenced object will be modified in place.
 * @param {Object} [options]
 * @param {Boolean} [options.filter=true] - Do filtering?
 * @param {Boolean} [options.autoConvert=true] - Do automatic type converting?
 * @param {Boolean} [options.removeEmptyStrings=true] - Remove keys in normal object or $set where the value is an empty string?
 * @param {Boolean} [options.getAutoValues=true] - Inject automatic and default values?
 * @param {Boolean} [options.isModifier=false] - Is doc a modifier object?
 * @param {Object} [options.extendAutoValueContext] - This object will be added to the `this` context of autoValue functions.
 * @returns {Object} The modified doc.
 * 
 * Cleans a document or modifier object. By default, will filter, automatically
 * type convert where possible, and inject automatic/default values. Use the options
 * to skip one or more of these.
 */
SimpleSchema.prototype.clean = function(doc, options) {
  var self = this;

  // By default, doc will be filtered and autoconverted
  options = _.extend({
    filter: true,
    autoConvert: true,
    removeEmptyStrings: true,
    getAutoValues: true,
    isModifier: false,
    extendAutoValueContext: {}
  }, options || {});

  // Convert $pushAll (deprecated) to $push with $each
  if ("$pushAll" in doc) {
    console.warn("SimpleSchema.clean: $pushAll is deprecated; converting to $push with $each");
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

  var mDoc = new MongoObject(doc, self._blackboxKeys);

  // Filter out anything that would affect keys not defined
  // or implied by the schema
  options.filter && mDoc.filterGenericKeys(function(genericKey) {
    var allowed = self.allowsKey(genericKey);
    if (!allowed && SimpleSchema.debug) {
      console.info('SimpleSchema.clean: filtered out value that would have affected key "' + genericKey + '", which is not allowed by the schema');
    }
    return allowed;
  });

  // Autoconvert values if requested and if possible
  (options.autoConvert || options.removeEmptyStrings) && mDoc.forEachNode(function() {
    if (this.genericKey) {
      var def = self._schema[this.genericKey];
      var val = this.value;
      if (def && val !== void 0) {
        var wasAutoConverted = false;
        if (options.autoConvert) {
          var newVal = typeconvert(val, def.type);
          if (newVal !== void 0 && newVal !== val) {
            SimpleSchema.debug && console.info('SimpleSchema.clean: autoconverted value ' + val + ' from ' + typeof val + ' to ' + typeof newVal + ' for ' + this.genericKey);
            this.updateValue(newVal);
            wasAutoConverted = true;
            // remove empty strings
            if (options.removeEmptyStrings && (!this.operator || this.operator === "$set") && typeof newVal === "string" && !newVal.length) {
              this.remove();
            }
          }
        }
        // remove empty strings
        if (options.removeEmptyStrings && !wasAutoConverted && (!this.operator || this.operator === "$set") && typeof val === "string" && !val.length) {
          this.remove();
        }
      }
    }
  }, {endPointsOnly: false});

  // Set automatic values
  options.getAutoValues && getAutoValues.call(self, mDoc, options.isModifier, options.extendAutoValueContext);

  return doc;
};

// Returns the entire schema object or just the definition for one key
// in the schema.
SimpleSchema.prototype.schema = function(key) {
  var self = this;
  // if not null or undefined (more specific)
  if (key != null) {
    return self._schema[SimpleSchema._makeGeneric(key)];
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

    self._schema[fieldName].label = label;
    self._depsLabels[fieldName] && self._depsLabels[fieldName].changed();
  });
};

// should be used to safely get a label as string
SimpleSchema.prototype.label = function(key) {
  var self = this
  key = SimpleSchema._makeGeneric(key);
  var def = self.schema(key);
  // if there is no field defined use all fields
  if (key == null) {
    var result = {};
    _.each(def, function(def, fieldName) {
      result[fieldName] = self.label(fieldName);
    });
    return result;
    // if a field was defined get that
  } else if (def != null) {
    self._depsLabels[key] && self._depsLabels[key].depend();
    var label = def.label;
    return _.isFunction(label) ? label.call(def) : (label || inflectedLabel(key));
  } else {
    return null;
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
  SimpleSchema._depsGlobalMessages.changed();
};

// Schema-specific messages

SimpleSchema.prototype.messages = function(messages) {
  var self = this;
  _.extend(self._messages, messages);
  self._depsMessages.changed();
};

// Returns a string message for the given error type and key. Uses the
// def and value arguments to fill in placeholders in the error messages.
SimpleSchema.prototype.messageForError = function(type, key, def, value) {
  var self = this;

  // Prep some strings to be used when finding the correct message for this error
  var typePlusKey = type + " " + key;
  var genericKey = SimpleSchema._makeGeneric(key);
  var typePlusGenKey = type + " " + genericKey;
  var firstTypePeriod = type.indexOf(".");
  var genType;
  var genTypePlusKey;
  var genTypePlusGenKey;
  if (firstTypePeriod !== -1) {
    genType = type.substring(0, firstTypePeriod);
    genTypePlusKey = genType + " " + key;
    genTypePlusGenKey = genType + " " + genericKey;
  }

  // reactively update when message templates or labels are changed
  SimpleSchema._depsGlobalMessages.depend();
  self._depsMessages.depend();
  self._depsLabels[key] && self._depsLabels[key].depend();

  // Try finding the correct message to use at various levels, from most
  // specific to least specific.
  // 
  // (1) Use schema-specific message for specific key, specific type
  // (2) Use schema-specific message for generic key, specific type
  // (3) Use schema-specific message for specific type
  var message = self._messages[typePlusKey] || self._messages[typePlusGenKey] || self._messages[type];
  // (4) Use schema-specific message for specific key, general type
  // (5) Use schema-specific message for generic key, general type
  // (6) Use schema-specific message for general type
  if (!message && genType) {
    message = self._messages[genTypePlusKey] || self._messages[genTypePlusGenKey] || self._messages[genType];
  }
  // (7) Use global message for specific key, specific type
  // (8) Use global message for generic key, specific type
  // (9) Use global message for specific type
  if (!message) {
    message = SimpleSchema._globalMessages[typePlusKey] || SimpleSchema._globalMessages[typePlusGenKey] || SimpleSchema._globalMessages[type];
  }
  // (10) Use global message for specific key, general type
  // (11) Use global message for generic key, general type
  // (12) Use global message for general type
  if (!message && genType) {
    message = SimpleSchema._globalMessages[genTypePlusKey] || SimpleSchema._globalMessages[genTypePlusGenKey] || SimpleSchema._globalMessages[genType];
  }
  if (!message) {
    return "Unknown validation error";
  }

  // Now replace all placeholders in the message with the correct values
  def = def || self.schema(key) || {};
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

  // Now return the message
  return message;
};

// Returns true if key is explicitly allowed by the schema or implied
// by other explicitly allowed keys.
// The key string should have $ in place of any numeric array positions.
SimpleSchema.prototype.allowsKey = function(key) {
  var self = this;

  // Loop through all keys in the schema
  return _.any(self._schemaKeys, function(schemaKey) {

    // If the schema key is the test key, it's allowed.
    if (schemaKey === key) {
      return true;
    }
    
    // Black box handling
    if (self.schema(schemaKey).blackbox === true) {
      var kl = schemaKey.length;
      var compare1 = key.slice(0, kl + 2);
      var compare2 = compare1.slice(0, -1);

      // If the test key is the black box key + ".$", then the test
      // key is NOT allowed because black box keys are by definition
      // only for objects, and not for arrays.
      if (compare1 === schemaKey + '.$')
        return false;

      // Otherwise
      if (compare2 === schemaKey + '.')
        return true;
    }

    return false;
  });
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

SimpleSchema.prototype.customObjectKeys = function(keyPrefix) {
  var self = this;
  if (!keyPrefix) {
    return self._firstLevelCustomSchemaKeys;
  }
  return self._customObjectKeys[keyPrefix + "."] || [];
};

SimpleSchema.prototype.customSchemaKeys = function() {
  return this._customSchemaKeys;
};

//called by clean()
var typeconvert = function(value, type) {
  if (_.isArray(value) || (_.isObject(value) && !(value instanceof Date)))
    return value; //can't and shouldn't convert arrays or objects
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
};

var expandSchema = function(schema) {
  // Flatten schema by inserting nested definitions
  _.each(schema, function(val, key) {
    var dot, type;
    if (!val)
      return;
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
  var arrayKeysToAdd = [], objectKeysToAdd = [], newKey, key;

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

// returns an inflected version of fieldName to use as the label
var inflectedLabel = function(fieldName) {
  var label = fieldName, lastPeriod = label.lastIndexOf(".");
  if (lastPeriod !== -1) {
    label = label.substring(lastPeriod + 1);
    if (label === "$") {
      var pcs = fieldName.split(".");
      label = pcs[pcs.length - 2];
    }
  }
  if (label === "_id")
    return "ID";
  return S(label).humanize().s;
};

var deleteIfPresent = function(obj, key) {
  if (key in obj) {
    delete obj[key];
  }
};

/**
 * @method getAutoValues
 * @private 
 * @param {MongoObject} mDoc
 * @param {Boolean} [isModifier=false] - Is it a modifier doc?
 * @param {Object} [extendedAutoValueContext] - Object that will be added to the context when calling each autoValue function
 * @returns {undefined}
 * 
 * Updates doc with automatic values from autoValue functions or default
 * values from defaultValue. Modifies the referenced object in place.
 */
function getAutoValues(mDoc, isModifier, extendedAutoValueContext) {
  var self = this;
  var doneKeys = [];

  //on the client we can add the userId if not already in the custom context
  if (Meteor.isClient && extendedAutoValueContext.userId === void 0) {
    extendedAutoValueContext.userId = (Meteor.userId && Meteor.userId()) || null;
  }
  
  function runAV(func) {
    var affectedKey = this.key;
    // If already called for this key, skip it
    if (_.contains(doneKeys, affectedKey))
      return;
    var lastDot = affectedKey.lastIndexOf('.');
    var fieldParentName = lastDot === -1 ? '' : affectedKey.slice(0, lastDot + 1);
    var doUnset = false;
    var autoValue = func.call(_.extend({
      isSet: (this.value !== void 0),
      unset: function() {
        doUnset = true;
      },
      value: this.value,
      operator: this.operator,
      field: function(fName) {
        var keyInfo = mDoc.getInfoForKey(fName) || {};
        return {
          isSet: (keyInfo.value !== void 0),
          value: keyInfo.value,
          operator: keyInfo.operator || null
        };
      },
      siblingField: function(fName) {
        var keyInfo = mDoc.getInfoForKey(fieldParentName + fName) || {};
        return {
          isSet: (keyInfo.value !== void 0),
          value: keyInfo.value,
          operator: keyInfo.operator || null
        };
      }
    }, extendedAutoValueContext || {}), mDoc.getObject());

    // Update tracking of which keys we've run autovalue for
    doneKeys.push(affectedKey);

    if (autoValue === void 0) {
      if (doUnset) {
        mDoc.removeValueForPosition(this.position);
      }
      return;
    }

    // If the user's auto value is of the pseudo-modifier format, parse it
    // into operator and value.
    var op, newValue;
    if (_.isObject(autoValue)) {
      for (var key in autoValue) {
        if (autoValue.hasOwnProperty(key) && key.substring(0, 1) === "$") {
          op = key;
          newValue = autoValue[key];
          break;
        }
      }
    }

    // Add $set for updates and upserts if necessary
    if (!op && isModifier && this.position.slice(0, 1) !== '$') {
      op = "$set";
      newValue = autoValue;
    }

    // Update/change value
    if (op) {
      mDoc.removeValueForPosition(this.position);
      mDoc.setValueForPosition(op + '[' + affectedKey + ']', newValue);
    } else {
      mDoc.setValueForPosition(this.position, autoValue);
    }
  }

  _.each(self._autoValues, function(func, fieldName) {
    var positionSuffix, key, keySuffix, positions;
    
    // If we're under an array, run autovalue for all the properties of
    // any objects that are present in the nearest ancestor array.
    if (fieldName.indexOf("$") !== -1) {
      var testField = fieldName.slice(0, fieldName.lastIndexOf("$") + 1);
      keySuffix = fieldName.slice(testField.length + 1);
      positionSuffix = MongoObject._keyToPosition(keySuffix, true);
      keySuffix = '.' + keySuffix;
      positions = mDoc.getPositionsForGenericKey(testField);
    } else {
      
      // See if anything in the object affects this key
      positions = mDoc.getPositionsForGenericKey(fieldName);
      
      // Run autovalue for properties that are set in the object
      if (positions.length) {
        key = fieldName;
        keySuffix = '';
        positionSuffix = '';
      }
      
      // Run autovalue for properties that are NOT set in the object
      else {
        key = fieldName;
        keySuffix = '';
        positionSuffix = '';
        if (isModifier) {
          positions = ["$set[" + fieldName + "]"];
        } else {
          positions = [MongoObject._keyToPosition(fieldName)];
        }
      }
    
    }

    _.each(positions, function(position) {
      runAV.call({
        key: (key || MongoObject._positionToKey(position)) + keySuffix,
        value: mDoc.getValueForPosition(position + positionSuffix),
        operator: extractOp(position),
        position: position + positionSuffix
      }, func);
    });
  });
}

// Extracts operator piece, if present, from position string
var extractOp = function extractOp(position) {
  var firstPositionPiece = position.slice(0, position.indexOf("["));
  return (firstPositionPiece.substring(0, 1) === "$") ? firstPositionPiece : null;
};
