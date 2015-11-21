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
SimpleSchema.prototype.clean = function (doc, options) {
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

/*
 * PRIVATE
 */

/**
 * [[Description]]
 * @param   {[[Type]]} value [[Description]]
 * @param   {[[Type]]} type  [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function typeconvert(value, type) {
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
}

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
