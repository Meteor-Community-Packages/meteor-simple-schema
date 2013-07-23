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
};

var builtInCheck = check;
//@export check
check = function(/*arguments*/) {
    var args = _.toArray(arguments), invalidFields;
    if (args && _.isObject(args[0]) && args[1] instanceof SimpleSchema) {
        invalidFields = args[1].validate(args[0]);
        if (invalidFields.length && Match) {
            throw new Match.Error("One or more properties do not match the schema.");
        }
        return;
    }
    builtInCheck.apply(this, arguments);
};

//validates doc against self._schema and returns an array of error objects
SimpleSchema.prototype.validate = function(doc) {
    var self = this, invalidFields = [];
    var isSetting = "$set" in doc;
    var isUnsetting = "$unset" in doc;

    //all fields must pass validation check
    _.each(self._schema, function(def, fieldName) {
        var fieldValue;
        var fieldLabel = def.label || fieldName;

        //first check unsetting
        if (isUnsetting && fieldName in doc.$unset) {
            fieldValue = doc.$unset[fieldName];
            if (fieldValue === void 0 || fieldValue === null || (typeof fieldValue === "string" && fieldValue.length === 0)) {
                if (!def.optional) {
                    invalidFields.push({name: fieldName, message: fieldLabel + " is required"});
                } //else it's valid, and no need to perform further checks on this field
            }
        }

        //next check setting or inserting
        if (isSetting) {
            fieldValue = doc.$set[fieldName];
        } else {
            fieldValue = doc[fieldName];
        }

        invalidFields = _.union(invalidFields, validateOne(def, fieldName, fieldLabel, fieldValue, isSetting));
    });

    return invalidFields;
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
    _.each(self._schema, function(def, fieldName) {
        if (fieldName in doc) {
            if (_.isArray(doc[fieldName])) {
                for (var i = 0, ln = doc[fieldName].length; i < ln; i++) {
                    doc[fieldName][i] = typeconvert(doc[fieldName][i], def.type[0]); //typeconvert
                }
            } else {
                doc[fieldName] = typeconvert(doc[fieldName], def.type); //typeconvert
            }
        } else if ("$set" in doc && fieldName in doc.$set) {
            if (_.isArray(doc[fieldName])) {
                for (var i = 0, ln = doc[fieldName].length; i < ln; i++) {
                    doc.$set[fieldName][i] = typeconvert(doc.$set[fieldName][i], def.type[0]); //typeconvert
                }
            } else {
                doc.$set[fieldName] = typeconvert(doc.$set[fieldName], def.type); //typeconvert
            }
        }
    });
    return doc;
};

var validateOne = function(def, fieldName, fieldLabel, fieldValue, isSetting) {
    var invalidFields = [];
    //when inserting required fields, fieldValue must not be undefined, null, or an empty string
    //when updating ($setting) required fields, fieldValue can be undefined, but may not be null or an empty string
    if ((!isSetting && fieldValue === void 0) || fieldValue === null || (typeof fieldValue === "string" && fieldValue.length === 0)) {
        if (!def.optional) {
            invalidFields.push({name: fieldName, message: fieldLabel + " is required"});
        } //else it's valid, and no need to perform further checks on this field
        return invalidFields;
    }

    //if we got to this point and fieldValue is undefined, no more checking is necessary for this field
    if (fieldValue === void 0) {
        return invalidFields;
    }

    if (def.type === String) {
        if (typeof fieldValue !== "string") {
            invalidFields.push({name: fieldName, message: fieldLabel + " must be a string"});
        } else if (def.regEx && !def.regEx.test(fieldValue)) {
            invalidFields.push({name: fieldName, message: fieldLabel + " " + def.regExMessage});
        } else if (def.max && def.max < fieldValue.length) {
            invalidFields.push({name: fieldName, message: fieldLabel + " cannot exceed " + def.max + " characters"});
        } else if (def.min && def.min > fieldValue.length) {
            invalidFields.push({name: fieldName, message: fieldLabel + " must be at least " + def.min + " characters"});
        }
    } else if (def.type === Number) {
        if (typeof fieldValue !== "number") {
            invalidFields.push({name: fieldName, message: fieldLabel + " must be a number"});
        } else if (def.max && def.max < fieldValue) {
            invalidFields.push({name: fieldName, message: fieldLabel + " cannot exceed " + def.max});
        } else if (def.min && def.min > fieldValue) {
            invalidFields.push({name: fieldName, message: fieldLabel + " must be at least " + def.min});
        } else if (!def.decimal && fieldValue.toString().indexOf(".") > -1) {
            invalidFields.push({name: fieldName, message: fieldLabel + " must be an integer"});
        }
    } else if (def.type === Boolean) {
        if (typeof fieldValue !== "boolean") {
            invalidFields.push({name: fieldName, message: fieldLabel + " must be a boolean"});
        }
    } else if (def.type instanceof Function) {
        if (!(fieldValue instanceof def.type)) {
            invalidFields.push({name: fieldName, message: fieldLabel + " must be a " + def.type.name});
        }
        if (def.type === Date) {
            if (_.isDate(def.min) && def.min.getTime() > fieldValue.getTime()) {
                invalidFields.push({name: fieldName, message: fieldLabel + " must be on or after " + dateToFieldDateString(def.min)});
            } else if (_.isDate(def.max) && def.max.getTime() < fieldValue.getTime()) {
                invalidFields.push({name: fieldName, message: fieldLabel + " must be on or before " + dateToFieldDateString(def.max)});
            }
        }
    }

    //if it's an array, loop through it and call validateOne recursively
    if (_.isArray(def.type)) {
        if (!_.isArray(fieldValue)) {
            invalidFields.push({name: fieldName, message: fieldLabel + " must be an array"});
        } else if (def.min && fieldValue.length < def.min) {
            invalidFields.push({name: fieldName, message: "You must specify at least " + def.min + " values"});
        } else if (def.max && fieldValue.length > def.max) {
            invalidFields.push({name: fieldName, message: "You cannot specify more than " + def.max + " values"});
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
            for (var i = 0, ln = fieldValue.length; i < ln; i++) {
                loopVal = fieldValue[i];
                invalidFields = _.union(invalidFields, validateOne(childDef, fieldName, fieldLabel, loopVal, isSetting));
                if (invalidFields.length) {
                    break;
                }
            }
        }
    } else {
        //check to make sure the value is allowed
        //this is the last thing we want to do for all data types, except for arrays
        if (def.allowedValues) {
            if (!_.contains(def.allowedValues, fieldValue)) {
                invalidFields.push({name: fieldName, message: fieldValue + " is not an allowed value"});
            }
        } else if (def.valueIsAllowed && def.valueIsAllowed instanceof Function) {
            if (!def.valueIsAllowed(fieldValue)) {
                invalidFields.push({name: fieldName, message: fieldValue + " is not an allowed value"});
            }
        }
    }
    
    return invalidFields;
};

var dateToFieldDateString = function(date) {
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