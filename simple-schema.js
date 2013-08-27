//URL RegEx from https://gist.github.com/dperini/729294
//http://mathiasbynens.be/demo/url-regex

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
    regEx: "[label] failed regular expression validation"
};

//exported
SimpleSchema = function(schema) {
    var self = this;
    self._schema = schema || {};
    self._schemaKeys = _.keys(schema);
    self._invalidKeys = [];
    self._validators = [];
    //set up default message for each error type
    self._messages = defaultMessages;
    //regEx messages were previously defined in the schema
    //we'll continue to support that by copying them to _messages at this point
    _.each(self._schemaKeys, function(key) {
        if (self._schema[key].regExMessage) {
            self._messages["regEx " + key] = "[label] " + self._schema[key].regExMessage;
            delete self._schema[key].regExMessage;
        }
    });
    //set up validation dependencies
    self._deps = {};
    self._depsAny = new Deps.Dependency;
    _.each(self._schemaKeys, function(name) {
        self._deps[name] = new Deps.Dependency;
    });
};

// Inherit from Match.Where
// This allow SimpleSchema instance to be recognized as a Match.Where instance as well
// as a SimpleSchema instance
SimpleSchema.prototype = new Match.Where();

// If an object is an instance of Match.Where, Meteor build-in check API will look at
// the function named `condition` and will pass it the document to validate
SimpleSchema.prototype.condition = function(doc) {
    var self = this;
    self.validate(doc);
    if (!self.valid())
        throw new Match.Error("One or more properties do not match the schema.");
    return true;
};

// [backwards compatibility]
// return a function that can be use as the second parameter of the build-in check function
SimpleSchema.prototype.match = function() {
    console.warn('There is no more need to call the .match() method on an object to check it.');
    console.warn('see https://github.com/aldeed/meteor-simple-schema#other-methods');
    var self = this;
    return Match.Where(function(doc) {
        self.validate(doc);
        if (!self.valid()) {
            throw new Match.Error("One or more properties do not match the schema.");
        }
        return true;
    });
};

// [backwards compatibility]
// checkSchema - exported
checkSchema = function(/*arguments*/) {
    console.warn('checkSchema is obsolete. Please have a look at the simple-schema documentation.');
    console.warn('https://github.com/aldeed/meteor-simple-schema#other-methods');

    var args = _.toArray(arguments);
    if (!args || !_.isObject(args[0]) || !args[1] instanceof SimpleSchema) {
        throw new Error("Invalid arguments");
    }
    args[1].validate(args[0]);
    if (!args[1].valid() && Match) {
        throw new Match.Error("One or more properties do not match the schema.");
    }
};

SimpleSchema.prototype.validator = function(func) {
    this._validators.push(func);
};

//validates doc against self._schema and sets a reactive array of error objects
SimpleSchema.prototype.validate = function(doc, options) {
    var self = this, invalidKeys = [];
    options = _.extend({
        modifier: false
    }, options || {});

    if (typeof doc === "object") {
        if (options.modifier) {
            //all keys must pass validation check in all operator objects
            _.each(self._schema, function(def, keyName) {
                var keyLabel = def.label || keyName;

                //loop through present modifiers
                _.each(doc, function(modObj, operator) {
                    if (operator.substring(0, 1) !== "$") {
                        throw new Error("When the modifier option is true, all validation object keys must be operators");
                    }
                    if (keyName in modObj) {
                        invalidKeys = _.union(invalidKeys, validateOne(operator, def, keyName, keyLabel, modObj[keyName], self, doc));
                    }
                });
            });
        } else {
            //flatten the object to one level, using mongo operator dot notation
            doc = collapseObj(doc, self._schemaKeys);

            //all keys must pass validation check
            _.each(self._schema, function(def, keyName) {
                var keyValue = doc[keyName];
                var keyLabel = def.label || keyName;
                invalidKeys = _.union(invalidKeys, validateOne(null, def, keyName, keyLabel, keyValue, self, doc));
            });
        }
    }

    //now update self._invalidKeys and dependencies

    //note any currently invalid keys so that we can mark them as changed
    //due to new validation (they may be valid now, or invalid in a different way)
    var removedKeys = _.pluck(self._invalidKeys, "name");

    //update
    self._invalidKeys = invalidKeys;

    //add newly invalid keys to changedKeys
    var addedKeys = _.pluck(self._invalidKeys, "name");

    //mark all changed keys as changed
    var changedKeys = _.union(addedKeys, removedKeys);
    _.each(changedKeys, function(name) {
        self._deps[name].changed();
    });
    if (changedKeys.length) {
        self._depsAny.changed();
    }

    return invalidKeys;
};

//validates doc against self._schema for one key and sets a reactive array of error objects
SimpleSchema.prototype.validateOne = function(doc, keyName, options) {
    var self = this, invalidKeys = [];
    options = _.extend({
        modifier: false
    }, options || {});

    //key must pass validation check
    var def = self._schema[keyName];
    if (!def) {
        throw new Error("The schema contains no key named " + keyName);
    }

    if (typeof doc === "object") {
        if (options.modifier) {
            var keyLabel = def.label || keyName;

            //loop through present modifiers
            _.each(doc, function(modObj, operator) {
                if (operator.substring(0, 1) !== "$") {
                    throw new Error("When the modifier option is true, all validation object keys must be operators");
                }
                if (keyName in modObj) {
                    invalidKeys = _.union(invalidKeys, validateOne(operator, def, keyName, keyLabel, modObj[keyName], self, doc));
                }
            });
        } else {
            //flatten the object to one level, using mongo operator dot notation
            doc = collapseObj(doc, self._schemaKeys);

            var keyValue = doc[keyName];
            var keyLabel = def.label || keyName;
            invalidKeys = validateOne(null, def, keyName, keyLabel, keyValue, self, doc);
        }
    }

    //now update self._invalidKeys and dependencies

    //remove objects from self._invalidKeys where name = keyName
    var newInvalidKeys = [];
    for (var i = 0, ln = self._invalidKeys.length, k; i < ln; i++) {
        k = self._invalidKeys[i];
        if (k.name !== keyName) {
            newInvalidKeys.push(k);
        }
    }
    self._invalidKeys = newInvalidKeys;

    //merge invalidKeys into self._invalidKeys
    for (var i = 0, ln = invalidKeys.length, k; i < ln; i++) {
        k = invalidKeys[i];
        self._invalidKeys.push(k);
    }

    //mark key as changed due to new validation (they may be valid now, or invalid in a different way)
    self._deps[keyName].changed();
    self._depsAny.changed();

    return invalidKeys;
};

//returns doc with all properties that are not in the schema removed
SimpleSchema.prototype.filter = function(doc) {
    console.warn("SimpleSchema.filter() is deprecated. Use SimpleSchema.clean().");
    return this.clean(doc, {autoConvert: false});
};

//automatic type conversion to match desired type, if possible
SimpleSchema.prototype.autoTypeConvert = function(doc) {
    console.warn("SimpleSchema.autoTypeConvert() is deprecated. Use SimpleSchema.clean().");
    return this.clean(doc, {filter: false});
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
                    if (isModifier(val)) {
                        //convert modifier values
                        _.each(val, function(opVal, op) {
                            if (_.isArray(opVal)) {
                                for (var i = 0, ln = opVal.length; i < ln; i++) {
                                    opVal[i] = typeconvert(opVal[i], type); //typeconvert
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

//reset the invalidKeys array
SimpleSchema.prototype.resetValidation = function() {
    var self = this;
    var removedKeys = _.pluck(self._invalidKeys, "name");
    self._invalidKeys = [];
    _.each(removedKeys, function(name) {
        self._deps[name].changed();
    });
};

SimpleSchema.prototype.valid = function() {
    var self = this;
    self._depsAny.depend();
    return !self._invalidKeys.length;
};

SimpleSchema.prototype.invalidKeys = function() {
    var self = this;
    self._depsAny.depend();
    return self._invalidKeys;
};

SimpleSchema.prototype.keyIsInvalid = function(name) {
    var self = this;
    self._deps[name].depend();
    return !!_.findWhere(self._invalidKeys, {name: name});
};

SimpleSchema.prototype.keyErrorMessage = function(name) {
    var self = this;
    self._deps[name].depend();
    var errorObj = _.findWhere(self._invalidKeys, {name: name});
    return errorObj ? errorObj.message : "";
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

SimpleSchema.prototype._messageForError = function(type, key, def, value) {
    var self = this, typePlusKey = type + " " + key;
    var message = self._messages[typePlusKey] || self._messages[type];
    if (!message) {
        return "Unknown validation error";
    }
    if (!def) {
        def = self._schema[key];
    }
    var label = def.label || key;
    message = message.replace("[label]", label);
    if (typeof def.minCount !== "undefined") {
        message = message.replace("[minCount]", def.minCount);
    }
    if (typeof def.maxCount !== "undefined") {
        message = message.replace("[maxCount]", def.maxCount);
    }
    if (typeof value !== "undefined") {
        message = message.replace("[value]", value.toString());
    }
    if (def.type === Date || def.type === [Date]) {
        if (typeof def.min !== "undefined") {
            message = message.replace("[min]", dateToDateString(def.min));
        }
        if (typeof def.max !== "undefined") {
            message = message.replace("[max]", dateToDateString(def.max));
        }
    } else {
        if (typeof def.min !== "undefined") {
            message = message.replace("[min]", def.min);
        }
        if (typeof def.max !== "undefined") {
            message = message.replace("[max]", def.max);
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

validateOne = function(operator, def, keyName, keyLabel, keyValue, ss, fullDoc) {
    var invalidKeys = [];

    if (operator === "$unset") {
        //unset

        //check if required
        if (!def.optional) {
            //for unsetting, value is irrelevant
            invalidKeys.push({name: keyName, type: "required", message: ss._messageForError("required", keyName, def)});
            return invalidKeys; //never do further checks for the same field after a "required" error
        }
        return invalidKeys; //the value of $unset does not matter and therefore needs no more checking beyond required/optional
    } else if (operator === "$set") {
        //set

        //check if required (undefined is not invalid for $set like it would be for an insert)
        if (keyValue === null || (typeof keyValue === "string" && isBlank(keyValue))) {
            if (!def.optional) {
                invalidKeys.push({name: keyName, type: "required", message: ss._messageForError("required", keyName, def)});
                return invalidKeys;
            }
            //whether required or not, the value is null so no further checks are necessary
            if (keyValue === null) {
                return invalidKeys;
            }
            //if it's an empty string, continue so that other checks like min length can be performed
        }

        if (keyValue === void 0) {
            return invalidKeys;
        }
    } else if (!operator) {
        //insert

        //check if required
        if (keyValue === void 0 || keyValue === null || (typeof keyValue === "string" && isBlank(keyValue))) {
            if (!def.optional) {
                invalidKeys.push({name: keyName, type: "required", message: ss._messageForError("required", keyName, def)});
                return invalidKeys;
            }
            //whether required or not, the value is null so no further checks are necessary
            if (keyValue === void 0 || keyValue === null) {
                return invalidKeys;
            }
            //if it's an empty string, continue so that other checks like min length can be performed
        }
    }

    //Type Checking
    if (def.type === String) {
        if (typeof keyValue !== "string") {
            invalidKeys.push({name: keyName, type: "expectedString", message: ss._messageForError("expectedString", keyName, def)});
        } else if (def.regEx && !def.regEx.test(keyValue)) {
            invalidKeys.push({name: keyName, type: "regEx", message: ss._messageForError("regEx", keyName, def, keyValue)});
        } else if (def.max && def.max < keyValue.length) {
            invalidKeys.push({name: keyName, type: "maxString", message: ss._messageForError("maxString", keyName, def, keyValue)});
        } else if (def.min && def.min > keyValue.length) {
            invalidKeys.push({name: keyName, type: "minString", message: ss._messageForError("minString", keyName, def, keyValue)});
        }
    } else if (def.type === Number) {
        if (typeof keyValue !== "number") {
            invalidKeys.push({name: keyName, type: "expectedNumber", message: ss._messageForError("expectedNumber", keyName, def)});
        } else if (def.max && def.max < keyValue) {
            invalidKeys.push({name: keyName, type: "maxNumber", message: ss._messageForError("maxNumber", keyName, def, keyValue)});
        } else if (def.min && def.min > keyValue) {
            invalidKeys.push({name: keyName, type: "minNumber", message: ss._messageForError("minNumber", keyName, def, keyValue)});
        } else if (!def.decimal && keyValue.toString().indexOf(".") > -1) {
            invalidKeys.push({name: keyName, type: "noDecimal", message: ss._messageForError("noDecimal", keyName, def, keyValue)});
        }
    } else if (def.type === Boolean) {
        if (typeof keyValue !== "boolean") {
            invalidKeys.push({name: keyName, type: "expectedBoolean", message: ss._messageForError("expectedBoolean", keyName, def)});
        }
    } else if (def.type === Object) {
        if (typeof keyValue !== "object") {
            invalidKeys.push({name: keyName, type: "expectedObject", message: ss._messageForError("expectedObject", keyName, def)});
        }
    } else if (def.type instanceof Function) {
        if (!(keyValue instanceof def.type)) {
            invalidKeys.push({name: keyName, type: "expectedConstructor", message: ss._messageForError("expectedConstructor", keyName, def)});
        }
        if (def.type === Date) {
            if (_.isDate(def.min) && def.min.getTime() > keyValue.getTime()) {
                invalidKeys.push({name: keyName, type: "minDate", message: ss._messageForError("minDate", keyName, def)});
            } else if (_.isDate(def.max) && def.max.getTime() < keyValue.getTime()) {
                invalidKeys.push({name: keyName, type: "maxDate", message: ss._messageForError("maxDate", keyName, def)});
            }
        }
    }

    //Custom Validation
    var validatorCount = ss._validators.length;
    if (validatorCount) {
        for (var i = 0, validator, result; i < validatorCount; i++) {
            validator = ss._validators[i];
            result = validator(keyName, keyValue, def);
            if (result !== true && typeof result === "string") {
                invalidKeys.push({name: keyName, type: result, message: ss._messageForError(result, keyName, def)});
            }
        }
    }

    //if it's an array, loop through it and call validateOne recursively
    if (_.isArray(def.type)) {
        if (!_.isArray(keyValue)) {
            invalidKeys.push({name: keyName, type: "expectedArray", message: ss._messageForError("expectedArray", keyName, def)});
        } else if (def.minCount && keyValue.length < def.minCount) {
            invalidKeys.push({name: keyName, type: "minCount", message: ss._messageForError("minCount", keyName, def)});
        } else if (def.maxCount && keyValue.length > def.maxCount) {
            invalidKeys.push({name: keyName, type: "maxCount", message: ss._messageForError("maxCount", keyName, def)});
        } else {
            //if it's an array with the right number of values, etc., then we need to go through them all and
            //validate each value in the array
            var childDef = _.clone(def), loopVal;
            childDef.type = def.type[0]; //strip array off of type
            for (var i = 0, ln = keyValue.length; i < ln; i++) {
                loopVal = keyValue[i];
                invalidKeys = _.union(invalidKeys, validateOne(operator, childDef, keyName, keyLabel, loopVal, ss, fullDoc));
                if (invalidKeys.length) {
                    break;
                }
            }
        }
    } else {
        //check to make sure the value is allowed
        //this is the last thing we want to do for all data types, except for arrays
        if (def.allowedValues) {
            if (!_.contains(def.allowedValues, keyValue)) {
                invalidKeys.push({name: keyName, type: "notAllowed", message: ss._messageForError("notAllowed", keyName, def, keyValue)});
            }
        } else if (def.valueIsAllowed && def.valueIsAllowed instanceof Function) {
            if (!def.valueIsAllowed(keyValue, fullDoc)) {
                invalidKeys.push({name: keyName, type: "notAllowed", message: ss._messageForError("notAllowed", keyName, def, keyValue)});
            }
        }
    }

    return invalidKeys;
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

var isBlank = function(str) {
    return (/^\s*$/).test(str);
};

SimpleSchema.prototype.collapseObj = function(doc) {
    return collapseObj(doc, this._schemaKeys);
};

SimpleSchema.prototype.expandObj = function(doc) {
    return expandObj(doc);
};

//collapses object into one level, with dot notation following the mongo $set syntax
var collapseObj = function(doc, skip) {
    var res = {};
    (function recurse(obj, current, currentOperator) {
        if (_.isArray(obj)) {
            for (var i = 0, ln = obj.length; i < ln; i++) {
                var value = obj[i];
                var newKey = (current ? current + "." + i : i);  // joined index with dot
                if (value && (typeof value === "object" || _.isArray(value)) && !_.contains(skip, newKey)) {
                    recurse(value, newKey, currentOperator);  // it's a nested object or array, so do it again
                } else {
                    res[newKey] = value;  // it's not an object or array, so set the property
                }
            }
        } else {
            for (var key in obj) {
                var value = obj[key];

                var newKey = (current ? current + "." + key : key);  // joined key with dot
                if (typeof value === "object" && !_.isEmpty(value) && !_.contains(skip, newKey)) {
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
        if (typeof val === "object" && isModifier(val)) {
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

isModifier = function(obj) {
    var ret = false;
    for (var key in obj) {
        if (obj.hasOwnProperty(key) && key.substring(0, 1) === "$") {
            ret = true;
            break;
        }
    }
    return ret;
};