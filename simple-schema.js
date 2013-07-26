//URL RegEx from https://gist.github.com/dperini/729294
//http://mathiasbynens.be/demo/url-regex

//@export SchemaRegEx
SchemaRegEx = {
    Email: /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/,
    Url: /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i
};

//@export SimpleSchema
SimpleSchema = function(schema) {
    var self = this;
    self._schema = schema || {};
    self._invalidKeys = [];
    //set up validation dependencies
    self._deps = {};
    self._depsAny = new Deps.Dependency;
    var keyNames = _.keys(schema);
    _.each(keyNames, function(name) {
        self.deps[name] = new Deps.Dependency;
    });
};

var builtInCheck = check;
//@export check
check = function(/*arguments*/) {
    var args = _.toArray(arguments), invalidKeys;
    if (args && _.isObject(args[0]) && args[1] instanceof SimpleSchema) {
        invalidKeys = args[1].validate(args[0]);
        if (invalidKeys.length && Match) {
            throw new Match.Error("One or more properties do not match the schema.");
        }
        return;
    }
    builtInCheck.apply(this, arguments);
};

//validates doc against self._schema and returns an array of error objects
SimpleSchema.prototype.validate = function(doc) {
    var self = this, invalidKeys = [];
    var isSetting = "$set" in doc;
    var isUnsetting = "$unset" in doc;

    //if inserting, we need to flatten the object to one level, using mongo $set dot notation
    if (!isSetting && !isUnsetting) {
        doc = collapseObj(doc, _.keys(self._schema));
    }

    //all keys must pass validation check
    _.each(self._schema, function(def, keyName) {
        var keyValue;
        var keyLabel = def.label || keyName;

        //first check unsetting
        if (isUnsetting) {
            if (keyName in doc.$unset && !def.optional) {
                invalidKeys.push({name: keyName, message: keyLabel + " is required"});
            } //else it's valid, and no need to perform further checks on this key
            return;
        }

        //next check setting or inserting
        if (isSetting) {
            keyValue = doc.$set[keyName];
        } else {
            keyValue = doc[keyName];
        }

        invalidKeys = _.union(invalidKeys, validateOne(def, keyName, keyLabel, keyValue, isSetting));
    });

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
    self._depsAny.changed();

    return;
};

//returns doc with all properties that are not in the schema removed
SimpleSchema.prototype.filter = function(doc) {
    //TODO make sure this works with descendent objects
    var newDoc, self = this;
    if ("$set" in doc) {
        //for $set, filter only that obj
        newDoc = doc;
        newDoc.$set = _.pick(doc.$set, _.keys(self._schema));
    } else {
        newDoc = _.pick(doc, _.keys(self._schema));
    }
    return newDoc;
};

//automatic type conversion to match desired type, if possible
SimpleSchema.prototype.autoTypeConvert = function(doc) {
    var self = this;
    _.each(self._schema, function(def, keyName) {
        if (keyName in doc) {
            if (_.isArray(doc[keyName])) {
                for (var i = 0, ln = doc[keyName].length; i < ln; i++) {
                    doc[keyName][i] = typeconvert(doc[keyName][i], def.type[0]); //typeconvert
                }
            } else {
                doc[keyName] = typeconvert(doc[keyName], def.type); //typeconvert
            }
        } else if ("$set" in doc && keyName in doc.$set) {
            if (_.isArray(doc[keyName])) {
                for (var i = 0, ln = doc[keyName].length; i < ln; i++) {
                    doc.$set[keyName][i] = typeconvert(doc.$set[keyName][i], def.type[0]); //typeconvert
                }
            } else {
                doc.$set[keyName] = typeconvert(doc.$set[keyName], def.type); //typeconvert
            }
        }
    });
    return doc;
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
    self._depsAny.depend();
    return !this._invalidKeys.length;
};

SimpleSchema.prototype.invalidKeys = function() {
    self._depsAny.depend();
    return this._invalidKeys;
};

SimpleSchema.prototype.keyIsInvalid = function(name) {
    self._deps[name].depend();
    return !!this._invalidKeys[name];
};

SimpleSchema.prototype.keyErrorMessage = function(name) {
    self._deps[name].depend();
    var errorObj = this._invalidKeys[name];
    return errorObj ? errorObj.message : "";
};

SimpleSchema.prototype.schema = function(key) {
    if (key) {
        return this._schema[key];
    } else {
        return this._schema;
    }
};

var validateOne = function(def, keyName, keyLabel, keyValue, isSetting) {
    var invalidKeys = [];
    //when inserting required keys, keyValue must not be undefined, null, or an empty string
    //when updating ($setting) required keys, keyValue can be undefined, but may not be null or an empty string
    if ((!isSetting && keyValue === void 0) || keyValue === null || (typeof keyValue === "string" && isBlank(keyValue))) {
        if (!def.optional) {
            invalidKeys.push({name: keyName, message: keyLabel + " is required"});
        } //else it's valid, and no need to perform further checks on this key
        return invalidKeys;
    }

    //if we got to this point and keyValue is undefined, no more checking is necessary for this key
    if (keyValue === void 0) {
        return invalidKeys;
    }

    if (def.type === String) {
        if (typeof keyValue !== "string") {
            invalidKeys.push({name: keyName, message: keyLabel + " must be a string"});
        } else if (def.regEx && !def.regEx.test(keyValue)) {
            invalidKeys.push({name: keyName, message: keyLabel + " " + def.regExMessage});
        } else if (def.max && def.max < keyValue.length) {
            invalidKeys.push({name: keyName, message: keyLabel + " cannot exceed " + def.max + " characters"});
        } else if (def.min && def.min > keyValue.length) {
            invalidKeys.push({name: keyName, message: keyLabel + " must be at least " + def.min + " characters"});
        }
    } else if (def.type === Number) {
        if (typeof keyValue !== "number") {
            invalidKeys.push({name: keyName, message: keyLabel + " must be a number"});
        } else if (def.max && def.max < keyValue) {
            invalidKeys.push({name: keyName, message: keyLabel + " cannot exceed " + def.max});
        } else if (def.min && def.min > keyValue) {
            invalidKeys.push({name: keyName, message: keyLabel + " must be at least " + def.min});
        } else if (!def.decimal && keyValue.toString().indexOf(".") > -1) {
            invalidKeys.push({name: keyName, message: keyLabel + " must be an integer"});
        }
    } else if (def.type === Boolean) {
        if (typeof keyValue !== "boolean") {
            invalidKeys.push({name: keyName, message: keyLabel + " must be a boolean"});
        }
    } else if (def.type === Object) {
        if (typeof keyValue !== "object") {
            invalidKeys.push({name: keyName, message: keyLabel + " must be an object"});
        }
    } else if (def.type instanceof Function) {
        if (!(keyValue instanceof def.type)) {
            invalidKeys.push({name: keyName, message: keyLabel + " must be a " + def.type.name});
        }
        if (def.type === Date) {
            if (_.isDate(def.min) && def.min.getTime() > keyValue.getTime()) {
                invalidKeys.push({name: keyName, message: keyLabel + " must be on or after " + dateToDateString(def.min)});
            } else if (_.isDate(def.max) && def.max.getTime() < keyValue.getTime()) {
                invalidKeys.push({name: keyName, message: keyLabel + " must be on or before " + dateToDateString(def.max)});
            }
        }
    }

    //if it's an array, loop through it and call validateOne recursively
    if (_.isArray(def.type)) {
        if (!_.isArray(keyValue)) {
            invalidKeys.push({name: keyName, message: keyLabel + " must be an array"});
        } else if (def.min && keyValue.length < def.min) {
            invalidKeys.push({name: keyName, message: "You must specify at least " + def.min + " values"});
        } else if (def.max && keyValue.length > def.max) {
            invalidKeys.push({name: keyName, message: "You cannot specify more than " + def.max + " values"});
        } else {
            //if it's an array with the right number of values, etc., then we need to go through them all and
            //validate each value in the array
            var childDef = _.clone(def), loopVal;
            childDef.type = def.type[0]; //strip array off of type
            //min and max only apply to the array
            if ("min" in childDef) {
                delete childDef.min;
            }
            if ("max" in childDef) {
                delete childDef.max;
            }
            for (var i = 0, ln = keyValue.length; i < ln; i++) {
                loopVal = keyValue[i];
                invalidKeys = _.union(invalidKeys, validateOne(childDef, keyName, keyLabel, loopVal, isSetting));
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
                invalidKeys.push({name: keyName, message: keyValue + " is not an allowed value"});
            }
        } else if (def.valueIsAllowed && def.valueIsAllowed instanceof Function) {
            if (!def.valueIsAllowed(keyValue)) {
                invalidKeys.push({name: keyName, message: keyValue + " is not an allowed value"});
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
        if (typeof value !== "string") {
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

//collapses object into one level, with dot notation following the mongo $set syntax
var collapseObj = function(doc, skip) {
    var res = {};
    (function recurse(obj, current) {
        if (_.isArray(obj)) {
            for (var i = 0, ln = obj.length; i < ln; i++) {
                var value = obj[i];
                var newKey = (current ? current + "." + i : i);  // joined index with dot
                if (value && (typeof value === "object" || _.isArray(value)) && !_.contains(skip, newKey)) {
                    recurse(value, newKey);  // it's a nested object or array, so do it again
                } else {
                    res[newKey] = value;  // it's not an object or array, so set the property
                }
            }
        } else {
            for (var key in obj) {
                var value = obj[key];
                var newKey = (current ? current + "." + key : key);  // joined key with dot
                if (value && (typeof value === "object" || _.isArray(value)) && !_.contains(skip, newKey)) {
                    recurse(value, newKey);  // it's a nested object or array, so do it again
                } else {
                    res[newKey] = value;  // it's not an object or array, so set the property
                }
            }
        }
    })(doc);
    return res;
};