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
    self._validators = [];
    //set up default message for each error type
    self._messages = defaultMessages;
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
    _.each(obj, function (val, key) {
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

SimpleSchema.prototype.messageForError = function(type, key, def, value) {
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

var isModifier = function(obj) {
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