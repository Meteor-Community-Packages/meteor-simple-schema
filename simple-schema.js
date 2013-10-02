//URL RegEx from https://gist.github.com/dperini/729294
//http://mathiasbynens.be/demo/url-regex

if (Meteor.isServer) {
  S = Npm.require("string");
}
if (Meteor.isClient) {
  S = window.S;
}

//exported
SchemaRegEx = {
  Email: /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/,
  Url: /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i
};

var defaultMessages = {
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

//exported
SimpleSchema = function(schema, options) {
  var self = this, requiredSchemaKeys = [], firstLevelRequiredSchemaKeys = [];
  options = options || {};
  schema = inflectLabels(addImplicitKeys(expandSchema(schema)));
  self._schema = schema || {};
  self._schemaKeys = []; //for speedier checking
  self._validators = [];
  //set up default message for each error type
  self._messages = defaultMessages;

  console.log(schema);

  //set schemaDefinition validator
  var schemaDefinition = {
    type: Match.Any,
    label: Match.Optional(String),
    optional: Match.Optional(Boolean),
    min: Match.Optional(Match.OneOf(Number, Date, Function)),
    max: Match.Optional(Match.OneOf(Number, Date, Function)),
    minCount: Match.Optional(Number),
    maxCount: Match.Optional(Number),
    allowedValues: Match.Optional([Match.Any]),
    valueIsAllowed: Match.Optional(Function),
    decimal: Match.Optional(Boolean),
    regEx: Match.Optional(RegExp)
  };

  if (typeof options.additionalKeyPatterns === "object")
    _.extend(schemaDefinition, options.additionalKeyPatterns);

  _.each(schema, function(definition, fieldName) {
    // Validate the field definition
    if (!Match.test(definition, schemaDefinition)) {
      throw new Error('Invalid definition for ' + fieldName + ' field.');
    }
    self._schemaKeys.push(fieldName);

    if (!definition.optional) {
      requiredSchemaKeys.push(fieldName);
      firstLevelRequiredSchemaKeys.push(fieldName.split(".")[0]);
    }
  });

  self._requiredSchemaKeys = requiredSchemaKeys; //for speedier checking
  self._firstLevelRequiredSchemaKeys = firstLevelRequiredSchemaKeys;
  self._requiredObjectKeys = requiredObjectKeys(schema, requiredSchemaKeys);
};

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

  var context = self.newContext();
  context.validate(obj, {modifier: isModifier});
  if (!context.isValid())
    throw new Match.Error("One or more properties do not match the schema.");
  return true;
};

SimpleSchema.prototype.validator = function(func) {
  this._validators.push(func);
};

//filter and automatically type convert
SimpleSchema.prototype.clean = function(doc, options) {
  //TODO make sure this works with descendent objects
  var newDoc, self = this;

  //by default, doc will be filtered and autoconverted
  options = _.extend({
    filter: true,
    autoConvert: true
  }, options || {});

  //delete deprecated operators
  if ("$pushAll" in doc) {
    delete doc.$pushAll;
  }
  if ("$pullAll" in doc) {
    delete doc.$pullAll;
  }

  //collapse
  var cDoc = collapseObj(doc, self._schemaKeys);

  //clean
  newDoc = {};
  _.each(cDoc, function(val, key) {
    var okToAdd = true;

    //filter
    if (options.filter === true) {
      okToAdd = self.allowsKey(key);
    }

    if (okToAdd) {
      //autoconvert
      if (options.autoConvert === true) {
        var def = self._schema[key];
        if (def) {
          var type = def.type;
          if (_.isArray(type)) {
            type = type[0];
          }
          if (looksLikeModifier(val)) {
            //convert modifier values
            _.each(val, function(opVal, op) {
              if (_.isArray(opVal)) {
                for (var i = 0, ln = opVal.length; i < ln; i++) {
                  opVal[i] = typeconvert(opVal[i], type); //typeconvert
                }
              } else if (_.isObject(opVal) && ("$each" in opVal)) {
                for (var i = 0, ln = opVal.$each.length; i < ln; i++) {
                  opVal.$each[i] = typeconvert(opVal.$each[i], type); //typeconvert
                }
              } else {
                opVal = typeconvert(opVal, type); //typeconvert
              }
              val[op] = opVal;
            });
          } else if (_.isArray(val)) {
            for (var i = 0, ln = val.length; i < ln; i++) {
              val[i] = typeconvert(val[i], type); //typeconvert
            }
          } else {
            val = typeconvert(val, type); //typeconvert
          }
        }
      }

      newDoc[key] = val;
    }
  });

  //expand
  newDoc = expandObj(newDoc);

  return newDoc;
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
    if (typeof value === "string") {
      //try to convert numeric strings to numbers
      var floatVal = parseFloat(value);
      if (!isNaN(floatVal)) {
        return floatVal;
      } else {
        return value; //leave string; will fail validation
      }
    }
    return value;
  }
  return value;
};

SimpleSchema.prototype.schema = function(key) {
  var self = this;
  if (key) {
    return self._schema[key];
  } else {
    return self._schema;
  }
};

SimpleSchema.prototype.messages = function(messages) {
  this._messages = defaultMessages; //make sure we're always extending the defaults, even if called more than once
  _.extend(this._messages, messages);
};

SimpleSchema.prototype.labels = function(labels) {
  var self = this;
  _.each(labels, function (label, fieldName) {
    if (typeof label !== "string")
      return;
    
    if (!(fieldName in self._schema))
      return;
    
    self._schema[fieldName]["label"] = label;
  });
};

SimpleSchema.prototype.messageForError = function(type, key, def, value) {
  var self = this, typePlusKey = type + " " + key;
  var message = self._messages[typePlusKey] || self._messages[type];
  if (!message) {
    return "Unknown validation error";
  }
  if (!def) {
    def = self._schema[key] || {};
  }
  var label = def.label;
  message = message.replace("[label]", label);
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

//Returns true if key is allowed by the schema.
//Supports implied schema keys and handles arrays (.Number. -> .$.)
//* key should be in format returned by collapseObj
//* will allow all $ keys
SimpleSchema.prototype.allowsKey = function(key) {
  var self = this;
  var schemaKeys = self._schemaKeys;

  //all all modifier keys
  if (key.substring(0, 1) === "$") {
    return true;
  }

  //replace .Number. with .$. in key
  var re = /\.[0-9]+\./g;
  key = key.replace(re, '.$.');

  //check schema
  var allowed = false;
  for (var i = 0, ln = schemaKeys.length, schemaKey; i < ln; i++) {
    schemaKey = schemaKeys[i];
    if (schemaKey === key) {
      allowed = true;
      break;
    }

    //check whether key is implied by this schema key
    //(the key in schema starts with key followed by dot)
    if (schemaKey.substring(0, key.length + 1) === key + ".") {
      allowed = true;
      break;
    }
  }

  return allowed;
};

SimpleSchema.prototype.newContext = function() {
  return new SimpleSchemaValidationContext(this);
};

SimpleSchema.prototype.collapseObj = function(doc) {
  return collapseObj(doc);
};

SimpleSchema.prototype.expandObj = function(doc) {
  return expandObj(doc);
};

SimpleSchema.prototype.requiredObjectKeys = function(keyPrefix) {
  var self = this;
  if (!keyPrefix) {
    return self._requiredObjectKeys;
  }
  return self._requiredObjectKeys[keyPrefix] || [];
};

SimpleSchema.prototype.requiredSchemaKeys = function(keyPrefix) {
  return this._requiredSchemaKeys;
};

SimpleSchema.prototype.firstLevelRequiredSchemaKeys = function(keyPrefix) {
  return this._firstLevelRequiredSchemaKeys;
};

//tests whether it's an Object as opposed to something that inherits from Object
var isBasicObject = function(obj) {
  return _.isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;
};

var collapseObj = function(doc, skip) {
  var res = {};
  (function recurse(obj, current, currentOperator) {
    if (_.isArray(obj)) {
      if (obj.length && _.isObject(obj[0]) && !_.contains(skip, newKey)) {
        for (var i = 0, ln = obj.length; i < ln; i++) {
          var value = obj[i];
          var newKey = (current ? current + "." + i : i);  // joined index with dot
          recurse(value, newKey, currentOperator);  // it's a nested object or array of objects, so do it again
        }
      } else {
        res[current] = obj;  // it's not an object or array of objects, so set the property
      }
    } else {
      for (var key in obj) {
        var value = obj[key];

        var newKey = (current ? current + "." + key : key);  // joined key with dot
        if (isBasicObject(value) && !_.isEmpty(value) && !_.contains(skip, newKey)) {
          //nested non-empty object so recurse into it
          if (key.substring(0, 1) === "$") {
            //handle mongo operator keys a bit differently
            recurse(value, current, key);
          } else {
            //not a mongo operator key
            recurse(value, newKey, currentOperator);
          }
        } else if (value && _.isArray(value) && value.length && !_.contains(skip, newKey)) {
          //nested non-empty array, so recurse into it
          recurse(value, newKey, currentOperator);
        } else {
          // it's not an object or array, or we've said we
          // want to keep it as an object or array (skip),
          // or it's an empty object or array,
          // so set the property now and stop recursing
          if (currentOperator) {
            res[newKey] = res[newKey] || {};
            res[newKey][currentOperator] = value;
          } else {
            res[newKey] = value;
          }
        }
      }
    }
  })(doc);
  return res;
};

//opposite of collapseObj
var expandObj = function(doc) {
  var newDoc = doc;
  _.each(newDoc, function(val, key) {
    delete newDoc[key];
    if (_.isObject(val) && looksLikeModifier(val)) {
      for (var operator in val) {
        if (val.hasOwnProperty(operator)) {
          newDoc[operator] = newDoc[operator] || {};
          newDoc[operator][key] = val[operator];
        }
      }
    } else {
      expandKey(val, key, newDoc);
    }
  });
  return newDoc;
};

//called by expandObj
var expandKey = function(val, key, obj) {
  var nextPiece;
  var subkeys = key.split(".");
  var subkeylen = subkeys.length;
  var current = obj;
  for (var i = 0, subkey; i < subkeylen; i++) {
    subkey = subkeys[i];
    if (current[subkey] && !_.isObject(current[subkey])) {
      break; //already set for some reason; leave it alone
    }
    if (i === subkeylen - 1) {
      //last iteration; time to set the value
      current[subkey] = val;
    } else {
      //see if the next piece is a number
      nextPiece = subkeys[i + 1];
      nextPiece = parseInt(nextPiece, 10);
      if (isNaN(nextPiece) && !_.isObject(current[subkey])) {
        current[subkey] = {};
      } else if (!_.isArray(current[subkey])) {
        current[subkey] = [];
      }
    }
    current = current[subkey];
  }
};

looksLikeModifier = function(obj) {
  var ret = false;
  for (var key in obj) {
    if (obj.hasOwnProperty(key) && key.substring(0, 1) === "$") {
      ret = true;
      break;
    }
  }
  return ret;
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

//flatten schema by inserting nested definitions
var expandSchema = function(schema) {
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
}

var addImplicitKeys = function(schema) {
  //if schema contains key like "foo.$.bar" but not "foo", add "foo"
  var arrayKeysToAdd = [], objectKeysToAdd = [], newKey, key, nextThree;

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

  return schema;
};

//gets an object that lists all of the required keys for each object parent key
var requiredObjectKeys = function(schema, requiredSchemaKeys) {
  var keyPrefix, remainingText, rKeys = {}, loopArray;
  _.each(schema, function(definition, fieldName) {
    if (_.isArray(definition.type) && definition.type[0] === Object) {
      //array of objects
      keyPrefix = fieldName + ".$.";
    } else if (definition.type === Object) {
      //object
      keyPrefix = fieldName + ".";
    } else {
      return;
    }

    loopArray = [];
    _.each(requiredSchemaKeys, function(fieldName2) {
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
    if (typeof definition.label === "string") {
      editedSchema[fieldName] = definition;
      return;
    }

    var label = fieldName, lastPeriod = label.lastIndexOf(".");
    if (lastPeriod !== -1) {
      label = label.substring(lastPeriod + 1);
    }
    definition.label = S(label).humanize().s;
    editedSchema[fieldName] = definition;
  });

  return editedSchema;
};