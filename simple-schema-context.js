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
var validateOne = function(operator, def, keyName, arrayPos, keyValue, ss, fullDoc) {
    var invalidKeys = [], requiredError;

    if (operator === "$pushAll")
        throw new Error("$pushAll is deprecated; use $each");

    if (operator === "$pull" || operator === "$pullAll" || operator === "$pop") {
        //these don't require any validation
        return invalidKeys;
    }

    //replace .Number. with .$. in key
    var schemaKeyName = keyName.replace(/\.[0-9]+\./g, '.$.');

    def = def || ss.schema(schemaKeyName);

    if (!def) {
        invalidKeys.push({name: schemaKeyName, type: "keyNotInSchema", message: ss.messageForError("keyNotInSchema", schemaKeyName, def, keyValue)});
        return invalidKeys;
    }

    var expectedType = def.type;
    var isEach = false;
    if (_.isObject(keyValue)) {
        //handle $each values
        if ("$each" in keyValue) {
            keyValue = keyValue.$each;
            isEach = true;
        }
    }

    //handle $push and $addToSet where value is an object
    if (!isEach && (operator === "$push" || operator === "$addToSet") && _.isArray(expectedType)) {
        expectedType = expectedType[0];
        arrayPos = "$";
    }

    //we did most "required" validation previously, but it is easier to do
    //required keys in objects that are in arrays now
    var dollarPos = schemaKeyName.indexOf(".$.");
    if (dollarPos !== -1) {
        if (!operator || operator === "$setOnInsert") {
            requiredError = validateRequired(schemaKeyName, keyValue, def, ss);
        } else if (operator === "$set") {
            if (keyValue !== void 0) {
                requiredError = validateRequired(schemaKeyName, keyValue, def, ss);
            }
        } else if (!def.optional && (operator === "$unset" || operator === "$rename")) {
            requiredError = {name: schemaKeyName, type: "required", message: ss.messageForError("required", schemaKeyName, def)};
        }

        if (requiredError) {
            invalidKeys.push(requiredError);
            return invalidKeys; //once we've logged a required error for the key, no further checking is necessary
        }
    }

    //no further checks are necessary for null or undefined values,
    //regardless of whether the key is required or not;
    //also no further checks are needed for $unset because the value of a $unset key does not matter
    //and we've already done the checks for requiredness
    if (keyValue === void 0 || keyValue === null || operator === "$unset") {
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

    //handle keys that expect arrays
    if (_.isArray(expectedType)) {
        //if it's an array, loop through it and validate each value in the array
        if (_.isArray(keyValue)) {
            var childDef = _.clone(def), loopVal;
            childDef.type = def.type[0]; //strip array off of type
            for (var i = 0, ln = keyValue.length; i < ln; i++) {
                loopVal = keyValue[i];
                invalidKeys = _.union(invalidKeys, validateOne(operator, childDef, schemaKeyName, i, loopVal, ss, fullDoc));
                if (invalidKeys.length) {
                    break;
                }
            }
        } else {
            invalidKeys.push({name: schemaKeyName, type: "expectedArray", message: ss.messageForError("expectedArray", schemaKeyName, def)});
        }
        return invalidKeys;
    }

    //For any keys that do not expect arrays, continue with more checks

    //Type Checking
    if (expectedType === String) {
        if (typeof keyValue !== "string") {
            invalidKeys.push({name: schemaKeyName, type: "expectedString", message: ss.messageForError("expectedString", schemaKeyName, def)});
        } else if (def.regEx && !def.regEx.test(keyValue)) {
            invalidKeys.push({name: schemaKeyName, type: "regEx", message: ss.messageForError("regEx", schemaKeyName, def, keyValue)});
        } else if (def.max && def.max < keyValue.length) {
            invalidKeys.push({name: schemaKeyName, type: "maxString", message: ss.messageForError("maxString", schemaKeyName, def, keyValue)});
        } else if (def.min && def.min > keyValue.length) {
            invalidKeys.push({name: schemaKeyName, type: "minString", message: ss.messageForError("minString", schemaKeyName, def, keyValue)});
        }
    } else if (expectedType === Number) {
        if (typeof keyValue !== "number") {
            invalidKeys.push({name: schemaKeyName, type: "expectedNumber", message: ss.messageForError("expectedNumber", schemaKeyName, def)});
        } else if (def.max && def.max < keyValue) {
            invalidKeys.push({name: schemaKeyName, type: "maxNumber", message: ss.messageForError("maxNumber", schemaKeyName, def, keyValue)});
        } else if (def.min && def.min > keyValue) {
            invalidKeys.push({name: schemaKeyName, type: "minNumber", message: ss.messageForError("minNumber", schemaKeyName, def, keyValue)});
        } else if (!def.decimal && keyValue.toString().indexOf(".") > -1) {
            invalidKeys.push({name: schemaKeyName, type: "noDecimal", message: ss.messageForError("noDecimal", schemaKeyName, def, keyValue)});
        }
    } else if (expectedType === Boolean) {
        if (typeof keyValue !== "boolean") {
            invalidKeys.push({name: schemaKeyName, type: "expectedBoolean", message: ss.messageForError("expectedBoolean", schemaKeyName, def)});
        }
    } else if (expectedType === Object) {
        if (!isBasicObject(keyValue)) {
            invalidKeys.push({name: schemaKeyName, type: "expectedObject", message: ss.messageForError("expectedObject", schemaKeyName, def)});
        } else {
            var keyPrefix = schemaKeyName + ".";
            if (arrayPos !== void 0 && arrayPos !== null) {
                keyPrefix += arrayPos + ".";
            }
            //validate each key in the object
            _.each(keyValue, function(v, k) {
                invalidKeys = _.union(invalidKeys, validateOne(operator, null, keyPrefix + k, null, v, ss, fullDoc));
            });
        }
    } else if (expectedType instanceof Function) {
        if (!(keyValue instanceof expectedType)) {
            invalidKeys.push({name: schemaKeyName, type: "expectedConstructor", message: ss.messageForError("expectedConstructor", schemaKeyName, def)});
        } else if (expectedType === Date) {
            if (_.isDate(def.min) && def.min.getTime() > keyValue.getTime()) {
                invalidKeys.push({name: schemaKeyName, type: "minDate", message: ss.messageForError("minDate", schemaKeyName, def)});
            } else if (_.isDate(def.max) && def.max.getTime() < keyValue.getTime()) {
                invalidKeys.push({name: schemaKeyName, type: "maxDate", message: ss.messageForError("maxDate", schemaKeyName, def)});
            }
        }
    }

    //stop if we've logged an error
    if (invalidKeys.length) {
        return invalidKeys;
    }

    //Custom Validation
    var validatorCount = ss._validators.length;
    if (validatorCount) {
        for (var i = 0, validator, result; i < validatorCount; i++) {
            validator = ss._validators[i];
            result = validator(schemaKeyName, keyValue, def, operator);
            if (result !== true && typeof result === "string") {
                invalidKeys.push({name: schemaKeyName, type: result, message: ss.messageForError(result, schemaKeyName, def)});
                break;
            }
        }
    }

    //stop if we've logged an error
    if (invalidKeys.length) {
        return invalidKeys;
    }

    //check to make sure the value is allowed
    //this is the last thing we want to do for all data types, except for arrays, if we haven't already logged another error
    if (def.allowedValues) {
        if (!_.contains(def.allowedValues, keyValue)) {
            invalidKeys.push({name: schemaKeyName, type: "notAllowed", message: ss.messageForError("notAllowed", schemaKeyName, def, keyValue)});
        }
    } else if (def.valueIsAllowed && def.valueIsAllowed instanceof Function) {
        if (!def.valueIsAllowed(keyValue, fullDoc, operator)) {
            invalidKeys.push({name: schemaKeyName, type: "notAllowed", message: ss.messageForError("notAllowed", schemaKeyName, def, keyValue)});
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

var getRequiredAndArrayErrors = function(doc, keyName, def, ss, hasModifiers, hasSet, hasSetOnInsert, hasUnset, hasRename, hasPush, hasAddToSet) {
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

var validateObj = function(obj, keyToValidate, invalidKeys, ss, operator) {
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

        invalidKeys = _.union(invalidKeys, validateOne(operator, null, key, null, val, ss, obj));
    });
    return invalidKeys;
};

var addNullKeys = function(doc, schema) {
    //to account for missing required keys in objects that are in arrays,
    //we will loop through and set any missing keys to null; this will make
    //sure that the "required" errors are logged for them
    var keysToAdd = [];
    _.each(doc, function(docVal, docKey) {
        var pieces = docKey.split('.');
        var tryKey;
        _.each(pieces, function(piece) {
            tryKey = tryKey ? tryKey + '.' + piece : piece;
            var numPiece = parseInt(piece, 10);
            if (!isNaN(numPiece)) {
                var keyBase = tryKey.replace(/\.[0-9]+/g, '.$.');
                _.each(schema, function(subDef, k) {
                    if (!subDef.optional && k.startsWith(keyBase)) {
                        k = k.substring(0, keyBase.length - 3) + "." + piece + "." + k.substring(keyBase.length - 1 + piece.length);
                        if (!doc.hasOwnProperty(k)) {
                            keysToAdd.push(k);
                        }
                    }
                });
            }
        });
    });

    _.each(keysToAdd, function(keyToAdd) {
        doc[keyToAdd] = null;
    });

    return doc;
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
    var hasPush = ("$push" in doc);
    var hasAddToSet = ("$addToSet" in doc);

    if (!isModifier) {
        //flatten the object to one level, using mongo operator dot notation
        doc = ss.collapseObj(doc);
        doc = addNullKeys(doc, schema);
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
        invalidKeys = _.union(invalidKeys, getRequiredAndArrayErrors(doc, keyName, def, ss, isModifier, hasSet, hasSetOnInsert, hasUnset, hasRename, hasPush, hasAddToSet));
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
            if (operator === "$setOnInsert") {
                //because $setOnInsert should validate like insert, we need to do this here, too
                modObj = ss.collapseObj(modObj);
                modObj = addNullKeys(modObj, schema);
            }
            invalidKeys = _.union(invalidKeys, validateObj(modObj, keyToValidate, invalidKeys, ss, operator));
        });
    } else {
        //second, loop through doc and validate all keys that are present
        invalidKeys = _.union(invalidKeys, validateObj(doc, keyToValidate, invalidKeys, ss, null));
    }

    return invalidKeys;
};

//create a .endsWith function for strings
if (typeof String.prototype.endsWith !== "function") {
    String.prototype.endsWith = function(suffix) {
        "use strict";
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

//create a .startsWith function for strings
if (typeof String.prototype.startsWith !== "function") {
    String.prototype.startsWith = function(str) {
        "use strict";
        return this.lastIndexOf(str, 0) === 0;
    };
}

//tests whether it's an Object as opposed to something that inherits from Object
var isBasicObject = function(obj) {
    return _.isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;
};