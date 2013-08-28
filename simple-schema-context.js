SimpleSchemaValidationContext = function(ss) {
    var self = this;
    self._simpleSchema = ss;
    self._schema = ss.schema();
    self._schemaKeys = _.keys(self._schema);
    self._invalidKeys = [];
    //set up validation dependencies
    self._deps = {};
    self._depsAny = new Deps.Dependency;
    _.each(self._schemaKeys, function(name) {
        self._deps[name] = new Deps.Dependency;
    });
};

//validates the object against the simple schema and sets a reactive array of error objects
SimpleSchemaValidationContext.prototype.validate = function(doc, options) {
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
                        invalidKeys = _.union(invalidKeys, validateOne(operator, def, keyName, keyLabel, modObj[keyName], self._simpleSchema, doc));
                    }
                });
            });
        } else {
            //flatten the object to one level, using mongo operator dot notation
            doc = self._simpleSchema.collapseObj(doc);

            //all keys must pass validation check
            _.each(self._schema, function(def, keyName) {
                var keyValue = doc[keyName];
                var keyLabel = def.label || keyName;
                invalidKeys = _.union(invalidKeys, validateOne(null, def, keyName, keyLabel, keyValue, self._simpleSchema, doc));
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
};

//validates doc against self._schema for one key and sets a reactive array of error objects
SimpleSchemaValidationContext.prototype.validateOne = function(doc, keyName, options) {
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
                    invalidKeys = _.union(invalidKeys, validateOne(operator, def, keyName, keyLabel, modObj[keyName], self._simpleSchema, doc));
                }
            });
        } else {
            //flatten the object to one level, using mongo operator dot notation
            doc = self._simpleSchema.collapseObj(doc);

            var keyValue = doc[keyName];
            var keyLabel = def.label || keyName;
            invalidKeys = validateOne(null, def, keyName, keyLabel, keyValue, self._simpleSchema, doc);
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
};

//this is where all the validation happens for a particular key for a single operator
validateOne = function(operator, def, keyName, keyLabel, keyValue, ss, fullDoc) {
    var invalidKeys = [];

    if (operator === "$unset") {
        //unset

        //check if required
        if (!def.optional) {
            //for unsetting, value is irrelevant
            invalidKeys.push({name: keyName, type: "required", message: ss.messageForError("required", keyName, def)});
            return invalidKeys; //never do further checks for the same field after a "required" error
        }
        return invalidKeys; //the value of $unset does not matter and therefore needs no more checking beyond required/optional
    } else if (operator === "$set") {
        //set

        //check if required (undefined is not invalid for $set like it would be for an insert)
        if (keyValue === null || (typeof keyValue === "string" && isBlank(keyValue))) {
            if (!def.optional) {
                invalidKeys.push({name: keyName, type: "required", message: ss.messageForError("required", keyName, def)});
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
                invalidKeys.push({name: keyName, type: "required", message: ss.messageForError("required", keyName, def)});
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
            invalidKeys.push({name: keyName, type: "expectedString", message: ss.messageForError("expectedString", keyName, def)});
        } else if (def.regEx && !def.regEx.test(keyValue)) {
            invalidKeys.push({name: keyName, type: "regEx", message: ss.messageForError("regEx", keyName, def, keyValue)});
        } else if (def.max && def.max < keyValue.length) {
            invalidKeys.push({name: keyName, type: "maxString", message: ss.messageForError("maxString", keyName, def, keyValue)});
        } else if (def.min && def.min > keyValue.length) {
            invalidKeys.push({name: keyName, type: "minString", message: ss.messageForError("minString", keyName, def, keyValue)});
        }
    } else if (def.type === Number) {
        if (typeof keyValue !== "number") {
            invalidKeys.push({name: keyName, type: "expectedNumber", message: ss.messageForError("expectedNumber", keyName, def)});
        } else if (def.max && def.max < keyValue) {
            invalidKeys.push({name: keyName, type: "maxNumber", message: ss.messageForError("maxNumber", keyName, def, keyValue)});
        } else if (def.min && def.min > keyValue) {
            invalidKeys.push({name: keyName, type: "minNumber", message: ss.messageForError("minNumber", keyName, def, keyValue)});
        } else if (!def.decimal && keyValue.toString().indexOf(".") > -1) {
            invalidKeys.push({name: keyName, type: "noDecimal", message: ss.messageForError("noDecimal", keyName, def, keyValue)});
        }
    } else if (def.type === Boolean) {
        if (typeof keyValue !== "boolean") {
            invalidKeys.push({name: keyName, type: "expectedBoolean", message: ss.messageForError("expectedBoolean", keyName, def)});
        }
    } else if (def.type === Object) {
        if (typeof keyValue !== "object") {
            invalidKeys.push({name: keyName, type: "expectedObject", message: ss.messageForError("expectedObject", keyName, def)});
        }
    } else if (def.type instanceof Function) {
        if (!(keyValue instanceof def.type)) {
            invalidKeys.push({name: keyName, type: "expectedConstructor", message: ss.messageForError("expectedConstructor", keyName, def)});
        }
        if (def.type === Date) {
            if (_.isDate(def.min) && def.min.getTime() > keyValue.getTime()) {
                invalidKeys.push({name: keyName, type: "minDate", message: ss.messageForError("minDate", keyName, def)});
            } else if (_.isDate(def.max) && def.max.getTime() < keyValue.getTime()) {
                invalidKeys.push({name: keyName, type: "maxDate", message: ss.messageForError("maxDate", keyName, def)});
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
                invalidKeys.push({name: keyName, type: result, message: ss.messageForError(result, keyName, def)});
            }
        }
    }

    //if it's an array, loop through it and call validateOne recursively
    if (_.isArray(def.type)) {
        if (!_.isArray(keyValue)) {
            invalidKeys.push({name: keyName, type: "expectedArray", message: ss.messageForError("expectedArray", keyName, def)});
        } else if (def.minCount && keyValue.length < def.minCount) {
            invalidKeys.push({name: keyName, type: "minCount", message: ss.messageForError("minCount", keyName, def)});
        } else if (def.maxCount && keyValue.length > def.maxCount) {
            invalidKeys.push({name: keyName, type: "maxCount", message: ss.messageForError("maxCount", keyName, def)});
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
                invalidKeys.push({name: keyName, type: "notAllowed", message: ss.messageForError("notAllowed", keyName, def, keyValue)});
            }
        } else if (def.valueIsAllowed && def.valueIsAllowed instanceof Function) {
            if (!def.valueIsAllowed(keyValue, fullDoc, operator)) {
                invalidKeys.push({name: keyName, type: "notAllowed", message: ss.messageForError("notAllowed", keyName, def, keyValue)});
            }
        }
    }

    return invalidKeys;
};

//reset the invalidKeys array
SimpleSchemaValidationContext.prototype.resetValidation = function() {
    var self = this;
    var removedKeys = _.pluck(self._invalidKeys, "name");
    self._invalidKeys = [];
    _.each(removedKeys, function(name) {
        self._deps[name].changed();
    });
};

SimpleSchemaValidationContext.prototype.isValid = function() {
    var self = this;
    self._depsAny.depend();
    return !self._invalidKeys.length;
};

SimpleSchemaValidationContext.prototype.invalidKeys = function() {
    var self = this;
    self._depsAny.depend();
    return self._invalidKeys;
};

SimpleSchemaValidationContext.prototype.keyIsInvalid = function(name) {
    var self = this;
    self._deps[name].depend();
    return !!_.findWhere(self._invalidKeys, {name: name});
};

SimpleSchemaValidationContext.prototype.keyErrorMessage = function(name) {
    var self = this;
    self._deps[name].depend();
    var errorObj = _.findWhere(self._invalidKeys, {name: name});
    return errorObj ? errorObj.message : "";
};

var isBlank = function(str) {
    return (/^\s*$/).test(str);
};