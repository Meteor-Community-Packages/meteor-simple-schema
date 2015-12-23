/* global SimpleSchema:true */
/* global SimpleSchemaValidationContext */
/* global MongoObject */
/* global Utility */

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

/*
 * PRIVATE FUNCTIONS
 */

//called by clean()
var typeconvert = function(value, type) {
  var parsedDate;

  if (_.isArray(value) || (_.isObject(value) && !(value instanceof Date))) {
    return value; //can't and shouldn't convert arrays or objects
  }
  if (type === String) {
    if (typeof value !== "undefined" && value !== null && typeof value !== "string") {
      return value.toString();
    }
    return value;
  }
  if (type === Number) {
    if (typeof value === "string" && !_.isEmpty(value)) {
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
  //
  // If target type is a Date we can safely convert from either a
  // number (Integer value representing the number of milliseconds
  // since 1 January 1970 00:00:00 UTC) or a string that can be parsed
  // by Date.
  //
  if (type === Date) {
    if (typeof value === "string") {
      parsedDate = Date.parse(value);
      if (isNaN(parsedDate) === false) {
        return new Date(parsedDate);
      }
    }
    if (typeof value === "number") {
      return new Date(value);
    }
  }
  return value;
};

var expandSchema = function(schema) {
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
};

/**
 * Adds implied keys.
 * * If schema contains a key like "foo.$.bar" but not "foo", adds "foo".
 * * If schema contains a key like "foo" with an array type, adds "foo.$".
 * @param {Object} schema
 * @returns {Object} modified schema
 */
var addImplicitKeys = function(schema) {
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
  if (label === "_id") {
    return "ID";
  }
  return humanize(label);
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
    if (_.contains(doneKeys, affectedKey)) {
      return;
    }
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
        operator: Utility.extractOp(position),
        position: position + positionSuffix
      }, func);
    });
  });
}

//exported
SimpleSchema = function(schemas, options) {
  var self = this;
  var firstLevelSchemaKeys = [];
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

  self._depsMessages = new Deps.Dependency();
  self._depsLabels = {};

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

    self._depsLabels[fieldName] = new Deps.Dependency();

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

// This allows other packages or users to extend the schema
// definition options that are supported.
SimpleSchema.extendOptions = function(options) {
  _.extend(schemaDefinition, options);
};

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
  // We use the RegExp suggested by W3C in http://www.w3.org/TR/html5/forms.html#valid-e-mail-address
  // This is probably the same logic used by most browsers when type=email, which is our goal. It is
  // a very permissive expression. Some apps may wish to be more strict and can write their own RegExp.
  Email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

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
  Id: /^[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{17}$/,
  // allows for a 5 digit zip code followed by a whitespace or dash and then 4 more digits
  // matches 11111 and 11111-1111 and 11111 1111
  ZipCode: /^\d{5}(?:[-\s]\d{4})?$/,
  // taken from google's libphonenumber library
  // https://github.com/googlei18n/libphonenumber/blob/master/javascript/i18n/phonenumbers/phonenumberutil.js
  // reference the VALID_PHONE_NUMBER_PATTERN key
  // allows for common phone number symbols including + () and -
  Phone: /^[0-9０-９٠-٩۰-۹]{2}$|^[+＋]*(?:[-x‐-―−ー－-／  ­​⁠　()（）［］.\[\]/~⁓∼～*]*[0-9０-９٠-٩۰-۹]){3,}[-x‐-―−ー－-／  ­​⁠　()（）［］.\[\]/~⁓∼～0-9０-９٠-٩۰-۹]*(?:;ext=([0-9０-９٠-٩۰-۹]{1,7})|[  \t,]*(?:e?xt(?:ensi(?:ó?|ó))?n?|ｅ?ｘｔｎ?|[,xｘ#＃~～]|int|anexo|ｉｎｔ)[:\.．]?[  \t,-]*([0-9０-９٠-٩۰-۹]{1,7})#?|[- ]+([0-9０-９٠-٩۰-۹]{1,5})#)?$/i
};

SimpleSchema._makeGeneric = function(name) {
  if (typeof name !== "string") {
    return null;
  }

  return name.replace(/\.[0-9]+(?=\.|$)/g, '.$');
};

SimpleSchema._depsGlobalMessages = new Deps.Dependency();

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
SimpleSchema.prototype.addValidator = function(func) {
  this._validators.push(func);
};

/**
 * @method SimpleSchema.prototype.pick
 * @param {[fields]} The list of fields to pick to instantiate the subschema
 * @returns {SimpleSchema} The subschema
 */
SimpleSchema.prototype.pick = function(/* arguments */) {
  var self = this;
  var args = _.toArray(arguments);
  args.unshift(self._schema);

  var newSchema = _.pick.apply(null, args);
  return new SimpleSchema(newSchema);
};

SimpleSchema.prototype.omit = function() {
  var self = this;
  var args = _.toArray(arguments);
  args.unshift(self._schema);

  var newSchema = _.omit.apply(null, args);
  return new SimpleSchema(newSchema);
};


/**
 * @method SimpleSchema.prototype.clean
 * @param {Object} doc - Document or modifier to clean. Referenced object will be modified in place.
 * @param {Object} [options]
 * @param {Boolean} [options.filter=true] - Do filtering?
 * @param {Boolean} [options.autoConvert=true] - Do automatic type converting?
 * @param {Boolean} [options.removeEmptyStrings=true] - Remove keys in normal object or $set where the value is an empty string?
 * @param {Boolean} [options.trimStrings=true] - Trim string values?
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
    trimStrings: true,
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

  // Clean loop
  if (options.filter || options.autoConvert || options.removeEmptyStrings || options.trimStrings) {
    mDoc.forEachNode(function() {
      var gKey = this.genericKey, p, def, val;
      if (gKey) {
        def = self._schema[gKey];
        val = this.value;
        // Filter out props if necessary; any property is OK for $unset because we want to
        // allow conversions to remove props that have been removed from the schema.
        if (options.filter && this.operator !== "$unset" && !self.allowsKey(gKey)) {
          // XXX Special handling for $each; maybe this could be made nicer
          if (this.position.slice(-7) === "[$each]") {
            mDoc.removeValueForPosition(this.position.slice(0, -7));
          } else {
            this.remove();
          }
          if (SimpleSchema.debug) {
            console.info('SimpleSchema.clean: filtered out value that would have affected key "' + gKey + '", which is not allowed by the schema');
          }
          return; // no reason to do more
        }
        if (val !== void 0) {
          // Autoconvert values if requested and if possible
          var wasAutoConverted = false;
          if (options.autoConvert && this.operator !== "$unset" && def) {
            var newVal = typeconvert(val, def.type);
            // trim strings
            if (options.trimStrings && typeof newVal === "string") {
              newVal = newVal.trim();
            }
            if (newVal !== void 0 && newVal !== val) {
              // remove empty strings
              if (options.removeEmptyStrings && (!this.operator || this.operator === "$set") && typeof newVal === "string" && !newVal.length) {
                // For a document, we remove any fields that are being set to an empty string
                newVal = void 0;
                // For a modifier, we $unset any fields that are being set to an empty string
                if (this.operator === "$set" && this.position.match(/\[.+?\]/g).length < 2) {

                  p = this.position.replace("$set", "$unset");
                  mDoc.setValueForPosition(p, "");
                }
              }

              // Change value; if undefined, will remove it
              SimpleSchema.debug && console.info('SimpleSchema.clean: autoconverted value ' + val + ' from ' + typeof val + ' to ' + typeof newVal + ' for ' + gKey);
              this.updateValue(newVal);
              wasAutoConverted = true;
            }
          }
          if (!wasAutoConverted) {
            // trim strings
            if (options.trimStrings && typeof val === "string" && (!def || (def && def.trim !== false))) {
              this.updateValue(val.trim());
            }
            // remove empty strings
            if (options.removeEmptyStrings && (!this.operator || this.operator === "$set") && typeof val === "string" && !val.length) {
              // For a document, we remove any fields that are being set to an empty string
              this.remove();
              // For a modifier, we $unset any fields that are being set to an empty string. But only if we're not already within an entire object that is being set.
              if (this.operator === "$set" && this.position.match(/\[.+?\]/g).length < 2) {
                p = this.position.replace("$set", "$unset");
                mDoc.setValueForPosition(p, "");
              }
            }
          }
        }
      }
    }, {endPointsOnly: false});
  }

  // Set automatic values
  options.getAutoValues && getAutoValues.call(self, mDoc, options.isModifier, options.extendAutoValueContext);

  // Ensure we don't have any operators set to an empty object
  // since MongoDB 2.6+ will throw errors.
  if (options.isModifier) {
    for (var op in doc) {
      if (doc.hasOwnProperty(op) && _.isEmpty(doc[op])) {
        delete doc[op];
      }
    }
  }

  return doc;
};

// Returns the entire schema object or just the definition for one key
// in the schema.
SimpleSchema.prototype.schema = function(key) {
  var self = this;
  // if not null or undefined (more specific)
  if (key !== null && key !== void 0) {
    return self._schema[SimpleSchema._makeGeneric(key)];
  } else {
    return self._schema;
  }
};

// Returns the evaluated definition for one key in the schema
// key = non-generic key
// [propList] = props to include in the result, for performance
// [functionContext] = used for evaluating schema options that are functions
SimpleSchema.prototype.getDefinition = function(key, propList, functionContext) {
  var self = this;
  var defs = self.schema(key);
  if (!defs) {
    return;
  }

  if (_.isArray(propList)) {
    defs = _.pick(defs, propList);
  } else {
    defs = _.clone(defs);
  }

  // For any options that support specifying a function,
  // evaluate the functions.
  _.each(['min', 'max', 'minCount', 'maxCount', 'allowedValues', 'optional', 'label'], function (prop) {
    if (_.isFunction(defs[prop])) {
      defs[prop] = defs[prop].call(functionContext || {});
    }
  });

  // Inflect label if not defined
  defs.label = defs.label || inflectedLabel(key);

  return defs;
};

// Check if the key is a nested dot-syntax key inside of a blackbox object
SimpleSchema.prototype.keyIsInBlackBox = function(key) {
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

// Use to dynamically change the schema labels.
SimpleSchema.prototype.labels = function(labels) {
  var self = this;
  _.each(labels, function(label, fieldName) {
    if (!_.isString(label) && !_.isFunction(label)) {
      return;
    }

    if (!(fieldName in self._schema)) {
      return;
    }

    self._schema[fieldName].label = label;
    self._depsLabels[fieldName] && self._depsLabels[fieldName].changed();
  });
};

// should be used to safely get a label as string
SimpleSchema.prototype.label = function(key) {
  var self = this;

  // Get all labels
  if (key === null || key === void 0) {
    var result = {};
    _.each(self.schema(), function(def, fieldName) {
      result[fieldName] = self.label(fieldName);
    });
    return result;
  }

  // Get label for one field
  var def = self.getDefinition(key);
  if (def) {
    var genericKey = SimpleSchema._makeGeneric(key);
    self._depsLabels[genericKey] && self._depsLabels[genericKey].depend();
    return def.label;
  }

  return null;
};

// Global messages

SimpleSchema._globalMessages = {
  required: "[label] is required",
  minString: "[label] must be at least [min] characters",
  maxString: "[label] cannot exceed [max] characters",
  minNumber: "[label] must be at least [min]",
  maxNumber: "[label] cannot exceed [max]",
  minNumberExclusive: "[label] must be greater than [min]",
  maxNumberExclusive: "[label] must be less than [max]",
  minDate: "[label] must be on or after [min]",
  maxDate: "[label] cannot be after [max]",
  badDate: "[label] is not a valid date",
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
  regEx: [
    {msg: "[label] failed regular expression validation"},
    {exp: SimpleSchema.RegEx.Email, msg: "[label] must be a valid e-mail address"},
    {exp: SimpleSchema.RegEx.WeakEmail, msg: "[label] must be a valid e-mail address"},
    {exp: SimpleSchema.RegEx.Domain, msg: "[label] must be a valid domain"},
    {exp: SimpleSchema.RegEx.WeakDomain, msg: "[label] must be a valid domain"},
    {exp: SimpleSchema.RegEx.IP, msg: "[label] must be a valid IPv4 or IPv6 address"},
    {exp: SimpleSchema.RegEx.IPv4, msg: "[label] must be a valid IPv4 address"},
    {exp: SimpleSchema.RegEx.IPv6, msg: "[label] must be a valid IPv6 address"},
    {exp: SimpleSchema.RegEx.Url, msg: "[label] must be a valid URL"},
    {exp: SimpleSchema.RegEx.Id, msg: "[label] must be a valid alphanumeric ID"}
  ],
  keyNotInSchema: "[key] is not allowed by the schema"
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

  // We proceed even if we can't get a definition because it might be a keyNotInSchema error
  def = def || self.getDefinition(key, ['regEx', 'label', 'minCount', 'maxCount', 'min', 'max', 'type']) || {};

  // Adjust for complex types, currently only regEx,
  // where we might have regEx.1 meaning the second
  // expression in the array.
  var firstTypePeriod = type.indexOf("."), index = null;
  if (firstTypePeriod !== -1) {
    index = type.substring(firstTypePeriod + 1);
    index = parseInt(index, 10);
    type = type.substring(0, firstTypePeriod);
  }

  // Which regExp is it?
  var regExpMatch;
  if (type === "regEx") {
    if (index !== null && index !== void 0 && !isNaN(index)) {
      regExpMatch = def.regEx[index];
    } else {
      regExpMatch = def.regEx;
    }
    if (regExpMatch) {
      regExpMatch = regExpMatch.toString();
    }
  }

  // Prep some strings to be used when finding the correct message for this error
  var typePlusKey = type + " " + key;
  var genericKey = SimpleSchema._makeGeneric(key);
  var typePlusGenKey = type + " " + genericKey;

  // reactively update when message templates are changed
  SimpleSchema._depsGlobalMessages.depend();
  self._depsMessages.depend();

  // Prep a function that finds the correct message for regEx errors
  function findRegExError(message) {
    if (type !== "regEx" || !_.isArray(message)) {
      return message;
    }
    // Parse regEx messages, which are provided in a special object array format
    // [{exp: RegExp, msg: "Foo"}]
    // Where `exp` is optional

    var msgObj;
    // First see if there's one where exp matches this expression
    if (regExpMatch) {
      msgObj = _.find(message, function (o) {
        return o.exp && o.exp.toString() === regExpMatch;
      });
    }

    // If not, see if there's a default message defined
    if (!msgObj) {
      msgObj = _.findWhere(message, {exp: null});
      if (!msgObj) {
        msgObj = _.findWhere(message, {exp: void 0});
      }
    }

    return msgObj ? msgObj.msg : null;
  }

  // Try finding the correct message to use at various levels, from most
  // specific to least specific.
  var message = self._messages[typePlusKey] ||                  // (1) Use schema-specific message for specific key
                self._messages[typePlusGenKey] ||               // (2) Use schema-specific message for generic key
                self._messages[type];                           // (3) Use schema-specific message for type
  message = findRegExError(message);

  if (!message) {
    message = SimpleSchema._globalMessages[typePlusKey] ||      // (4) Use global message for specific key
              SimpleSchema._globalMessages[typePlusGenKey] ||   // (5) Use global message for generic key
              SimpleSchema._globalMessages[type];               // (6) Use global message for type
    message = findRegExError(message);
  }

  if (!message) {
    return "Unknown validation error";
  }

  // Now replace all placeholders in the message with the correct values

  // [key]
  message = message.replace("[key]", key);

  // [label]
  // The call to self.label() establishes a reactive dependency, too
  message = message.replace("[label]", self.label(key));

  // [minCount]
  if (typeof def.minCount !== "undefined") {
    message = message.replace("[minCount]", def.minCount);
  }

  // [maxCount]
  if (typeof def.maxCount !== "undefined") {
    message = message.replace("[maxCount]", def.maxCount);
  }

  // [value]
  if (value !== void 0 && value !== null) {
    message = message.replace("[value]", value.toString());
  } else {
    message = message.replace("[value]", 'null');
  }

  // [min] and [max]
  var min = def.min;
  var max = def.max;
  if (def.type === Date || def.type === [Date]) {
    if (typeof min !== "undefined") {
      message = message.replace("[min]", Utility.dateToDateString(min));
    }
    if (typeof max !== "undefined") {
      message = message.replace("[max]", Utility.dateToDateString(max));
    }
  } else {
    if (typeof min !== "undefined") {
      message = message.replace("[min]", min);
    }
    if (typeof max !== "undefined") {
      message = message.replace("[max]", max);
    }
  }

  // [type]
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
      if (compare1 === schemaKey + '.$') {
        return false;
      }

      // Otherwise
      if (compare2 === schemaKey + '.') {
        return true;
      }
    }

    return false;
  });
};

SimpleSchema.prototype.newContext = function() {
  return new SimpleSchemaValidationContext(this);
};

// Returns all the child keys for the object identified by the generic prefix,
// or all the top level keys if no prefix is supplied.
SimpleSchema.prototype.objectKeys = function(keyPrefix) {
  var self = this;
  if (!keyPrefix) {
    return self._firstLevelSchemaKeys;
  }
  return self._objectKeys[keyPrefix + "."] || [];
};

SimpleSchema.prototype.validate = function (obj, options) {
  if (Package.check && Package['audit-argument-checks']) {
    // Call check but ignore the error to silence audit-argument-checks
    try { check(obj); } catch (e) { /* ignore error */ }
  }

  var validationContext = this.newContext();
  var isValid = validationContext.validate(obj, options);

  if (isValid) return;

  var errors = validationContext.invalidKeys().map(function (error) {
    return {
      name: error.name,
      type: error.type,
      details: {
        value: error.value
      }
    };
  });

  // In order for the message at the top of the stack trace to be useful,
  // we set it to the first validation error message.
  var message = validationContext.keyErrorMessage(errors[0].name);

  throw new Package['mdg:validation-error'].ValidationError(errors, message);
};

SimpleSchema.prototype.validator = function (options) {
  var self = this;
  options = options || {};
  return function (obj) {
    if (options.clean === true) self.clean(obj, options);
    self.validate(obj);
  };
};
