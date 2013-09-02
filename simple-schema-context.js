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
    var self = this;
    options = _.extend({
        modifier: false
    }, options || {});

    var invalidKeys = doValidation(doc, options.modifier, null, self._simpleSchema, self._schema);

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
    var d = self._deps;
    _.each(changedKeys, function(name) {
        if (name in d) {
            d[name].changed();
        }
    });
    if (changedKeys.length) {
        self._depsAny.changed();
    }
};

//validates doc against self._schema for one key and sets a reactive array of error objects
SimpleSchemaValidationContext.prototype.validateOne = function(doc, keyName, options) {
    var self = this;
    options = _.extend({
        modifier: false
    }, options || {});

    var invalidKeys = doValidation(doc, options.modifier, keyName, self._simpleSchema, self._schema);

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
var validateOne = function(operator, def, keyName, keyValue, ss, fullDoc) {
    var invalidKeys = [], requiredError;
    
    if (operator === "$pushAll")
        throw new Error("$pushAll is deprecated; use $each");
    
    if (operator === "$pull" || operator === "$pullAll" || operator === "$pop") {
        //these don't require any validation
        return invalidKeys;
    }

    if (!def) {
        invalidKeys.push({name: keyName, type: "keyNotInSchema", message: ss.messageForError("keyNotInSchema", keyName, def, keyValue)});
        return invalidKeys;
    }

    //handle $each values
    if (_.isObject(keyValue) && ("$each" in keyValue)) {
        keyValue = keyValue.$each;
    }

    //we did most "required" validation previously, but it is easier to do
    //required keys in objects that are in arrays now
    if (keyName.indexOf(".$.") !== -1) {
        if (!operator || operator === "$setOnInsert") {
            requiredError = validateRequired(keyName, keyValue, def, ss);
        } else if (operator === "$set") {
            if (keyValue !== void 0) {
                requiredError = validateRequired(keyName, keyValue, def, ss);
            }
        } else if (!def.optional && (operator === "$unset" || operator === "$rename")) {
            requiredError = {name: keyName, type: "required", message: ss.messageForError("required", keyName, def)};
        }

        if (requiredError) {
            invalidKeys.push(requiredError);
            return invalidKeys; //once we've logged a required error for the key, no further checking is necessary
        }
    }

    //no further checks are necessary for null or undefined values,
    //regardless of whether the key is required or not
    if (keyValue === void 0 || keyValue === null) {
        return invalidKeys;
    }

    //for $rename, the only further checking we need to do is to make sure that the new
    //name is allowed by the schema
    if (operator === "$rename") {
        if (!ss.allowsKey(keyValue)) {
            invalidKeys.push({name: keyValue, type: "keyNotInSchema", message: ss.messageForError("keyNotInSchema", keyValue, null)});
        }
        return invalidKeys;
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
    } else if (_.isArray(def.type)) {
        if (!_.isArray(keyValue)) {
            invalidKeys.push({name: keyName, type: "expectedArray", message: ss.messageForError("expectedArray", keyName, def)});
        }
    }

    //Custom Validation
    var validatorCount = ss._validators.length;
    if (validatorCount) {
        for (var i = 0, validator, result; i < validatorCount; i++) {
            validator = ss._validators[i];
            result = validator(keyName, keyValue, def, operator);
            if (result !== true && typeof result === "string") {
                invalidKeys.push({name: keyName, type: result, message: ss.messageForError(result, keyName, def)});
            }
        }
    }

    //if it's an array, loop through it and validate each value in the array
    if (_.isArray(def.type) && _.isArray(keyValue)) {
        var childDef = _.clone(def), loopVal;
        childDef.type = def.type[0]; //strip array off of type
        for (var i = 0, ln = keyValue.length; i < ln; i++) {
            loopVal = keyValue[i];
            invalidKeys = _.union(invalidKeys, validateOne(operator, childDef, keyName, loopVal, ss, fullDoc));
            if (invalidKeys.length) {
                break;
            }
        }
    } else if (!invalidKeys.length) {
        //check to make sure the value is allowed
        //this is the last thing we want to do for all data types, except for arrays, if we haven't already logged another error
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
    if (typeof str !== "string") {
        return false;
    }
    return (/^\s*$/).test(str);
};

var isBlankNullOrUndefined = function(str) {
    return (str === void 0 || str === null || isBlank(str));
};

var validateRequired = function(keyName, keyValue, def, ss) {
    if (!def.optional && isBlankNullOrUndefined(keyValue)) {
        return {name: keyName, type: "required", message: ss.messageForError("required", keyName, def)};
    }
};

var validateArray = function(keyName, keyValue, def, ss) {
    if (_.isArray(def.type) && !isBlankNullOrUndefined(keyValue)) {
        if (!_.isArray(keyValue)) {
            return {name: keyName, type: "expectedArray", message: ss.messageForError("expectedArray", keyName, def)};
        } else if (def.minCount && keyValue.length < def.minCount) {
            return {name: keyName, type: "minCount", message: ss.messageForError("minCount", keyName, def)};
        } else if (def.maxCount && keyValue.length > def.maxCount) {
            return {name: keyName, type: "maxCount", message: ss.messageForError("maxCount", keyName, def)};
        }
    }
};

var getRequiredAndArrayErrors = function(doc, keyName, def, ss, hasModifiers, hasSet, hasSetOnInsert, hasUnset, hasRename) {
    var keyValue, requiredError, arrayError;

    if (hasModifiers) {
        //Do required checks for modifiers. The general logic is this:
        //if required, then:
        //-in $set and $setOnInsert, val must not be null or empty string, AND
        //-in $unset, key must not be present, AND
        //-in $rename, key must not be present
        //But make sure only one required error is logged per keyName
        if (hasSet) {
            keyValue = doc.$set[keyName];

            //check for missing required, unless undefined,
            //except validate required keys in objects in arrays later, when looping through doc ("foo.$.bar")
            if (keyValue !== void 0 && keyName.indexOf(".$.") === -1) {
                requiredError = validateRequired(keyName, keyValue, def, ss);
            }
        }

        if (!requiredError && hasSetOnInsert) {
            //validate $setOnInsert exactly like an insert doc

            //keyName might be implied by another key in doc
            //(e.g., "name.first" implies "name")
            //if so, assume that it is set in the original object,
            //so don't log any errors
            //(this check only applies to non-modifier objects)
            if (!(keyName in doc)) {
                var shouldQuit = false;
                _.each(doc, function(val, key) {
                    if (key.indexOf(keyName + '.') !== -1) {
                        shouldQuit = true;
                    }
                });
                if (shouldQuit) {
                    return [];
                }
            }

            //Do required checks for normal objects. The general logic is this:
            //if required, then the key must be present and it's value
            //must not be undefined, null, or an empty string
            keyValue = doc.$setOnInsert[keyName];

            //check for missing required,
            //except validate required keys in objects in arrays later, when looping through doc ("foo.$.bar")
            if (keyName.indexOf(".$.") === -1) {
                requiredError = validateRequired(keyName, keyValue, def, ss);
            }
        }

        if (!requiredError && hasUnset && !def.optional && (keyName in doc.$unset)) {
            requiredError = {name: keyName, type: "required", message: ss.messageForError("required", keyName, def)};
        }

        if (!requiredError && hasRename && !def.optional && (keyName in doc.$rename)) {
            requiredError = {name: keyName, type: "required", message: ss.messageForError("required", keyName, def)};
        }
    } else {
        //keyName might be implied by another key in doc
        //(e.g., "name.first" implies "name")
        //if so, assume that it is set in the original object,
        //so don't log any errors
        //(this check only applies to non-modifier objects)
        if (!(keyName in doc)) {
            var shouldQuit = false;
            _.each(doc, function(val, key) {
                if (key.indexOf(keyName + '.') !== -1) {
                    shouldQuit = true;
                }
            });
            if (shouldQuit) {
                return [];
            }
        }

        //Do required checks for normal objects. The general logic is this:
        //if required, then the key must be present and it's value
        //must not be undefined, null, or an empty string
        keyValue = doc[keyName];

        //check for missing required,
        //except validate required keys in objects in arrays later, when looping through doc ("foo.$.bar")
        if (keyName.indexOf(".$.") === -1) {
            requiredError = validateRequired(keyName, keyValue, def, ss);
        }
    }

    if (requiredError) {
        return [requiredError]; //once we've logged a required error for the key, no further checking is necessary
    }

    //Second do array checks

    if (hasModifiers) {
        if (hasSet) {
            keyValue = doc.$set[keyName];
            arrayError = validateArray(keyName, keyValue, def, ss);
        }

        if (!arrayError && hasSetOnInsert) {
            keyValue = doc.$setOnInsert[keyName];
            arrayError = validateArray(keyName, keyValue, def, ss);
        }
    } else {
        arrayError = validateArray(keyName, keyValue, def, ss);
    }

    if (arrayError) {
        return [arrayError];
    }

    return [];
};

var validateObj = function(obj, keyToValidate, invalidKeys, ss, schema, operator) {
    _.each(obj, function(val, key) {
        //replace .Number. with .$. in key
        var schemaKey = key.replace(/\.[0-9]+\./g, '.$.');

        if (keyToValidate && keyToValidate !== schemaKey) {
            return;
        }

        //do no further checks if we've already logged one error for this key
        if (_.findWhere(invalidKeys, {name: schemaKey})) {
            return;
        }

        var def = schema[schemaKey];
        invalidKeys = _.union(invalidKeys, validateOne(operator, def, schemaKey, val, ss, obj));
    });
    return invalidKeys;
};

var doValidation = function(doc, isModifier, keyToValidate, ss, schema) {
    //check arguments
    if (!_.isObject(doc)) {
        throw new Error("The first argument of validate() or validateOne() must be an object");
    }
    
    if (!isModifier && looksLikeModifier(doc)) {
        throw new Error("When the validation object contains mongo operators, you must set the modifier option to true");
    }

    var invalidKeys = [];
    var hasSet = ("$set" in doc);
    var hasSetOnInsert = ("$setOnInsert" in doc);
    var hasUnset = ("$unset" in doc);
    var hasRename = ("$rename" in doc);

    if (!isModifier) {
        //flatten the object to one level, using mongo operator dot notation
        doc = ss.collapseObj(doc);
    }

    //first, loop through schema to do required and array checks
    var found = false;
    _.each(schema, function(def, keyName) {
        if (keyToValidate) {
            if (keyToValidate === keyName) {
                found = true;
            } else {
                return;
            }
        }
        invalidKeys = _.union(invalidKeys, getRequiredAndArrayErrors(doc, keyName, def, ss, isModifier, hasSet, hasSetOnInsert, hasUnset, hasRename));
    });

    if (keyToValidate && !found) {
        throw new Error("The schema contains no key named " + keyToValidate);
    }

    if (isModifier) {
        //second, loop through present modifiers
        _.each(doc, function(modObj, operator) {
            if (operator.substring(0, 1) !== "$") {
                throw new Error("When the modifier option is true, all validation object keys must be operators");
            }
            invalidKeys = _.union(invalidKeys, validateObj(modObj, keyToValidate, invalidKeys, ss, schema, operator));
        });
    } else {
        //second, loop through doc and validate all keys that are present
        invalidKeys = _.union(invalidKeys, validateObj(doc, keyToValidate, invalidKeys, ss, schema, null));
    }

    return invalidKeys;
};