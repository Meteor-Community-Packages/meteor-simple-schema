/**
 * @method SimpleSchema.prototype.clean
 * @param {Object} doc - Document or modifier to clean. Referenced object will be modified in place.
 * @param {Object} [options]
 * @param {Boolean} [options.filter=true] - Do filtering?
 * @param {Boolean} [options.autoConvert=true] - Do automatic type converting?
 * @param {Boolean} [options.removeEmptyStrings=true] - Remove keys in normal object or $set where the value is an empty string?
 * @param {Boolean} [options.removeNullsFromArrays=false] - Remove keys all null items from all arrays
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
    isModifier: Utility.looksLikeModifier(doc),
  }, self._cleanOptions, options);

  var mDoc = new MongoObject(doc, self._blackboxKeys);

  // Clean loop
  if (options.filter || options.autoConvert || options.removeEmptyStrings || options.trimStrings) {
    var removedPositions = []; // For removing now-empty objects after

    mDoc.forEachNode(function() {
      var gKey = this.genericKey, p, def, val;

      function trimAndRemoveStrings() {
        // trim strings
        if (options.trimStrings && typeof val === "string" && (!def || (def && def.trim !== false))) {
          val = val.trim();
          this.updateValue(val);
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

      if (gKey) {
        def = self._schema[gKey];
        val = this.value;
        // Filter out props if necessary; any property is OK for $unset because we want to
        // allow conversions to remove props that have been removed from the schema.
        if ((options.filter && this.operator !== "$unset" && !self.allowsKey(gKey)) ||
            (options.removeNullsFromArrays && this.isArrayItem)) {
          // XXX Special handling for $each; maybe this could be made nicer
          if (this.position.slice(-7) === "[$each]") {
            mDoc.removeValueForPosition(this.position.slice(0, -7));
            removedPositions.push(this.position.slice(0, -7));
          } else {
            this.remove();
            removedPositions.push(this.position);
          }
          if (SimpleSchema.debug) {
            console.info('SimpleSchema.clean: filtered out value that would have affected key "' + gKey + '", which is not allowed by the schema');
          }
          return; // no reason to do more
        }
        if (val !== void 0) {
          // Autoconvert values if requested and if possible
          if (options.autoConvert && this.operator !== "$unset" && def) {
            var newVal = typeconvert(val, def.type);
            if (newVal !== void 0 && newVal !== val) {
              SimpleSchema.debug && console.info('SimpleSchema.clean: autoconverted value ' + val + ' from ' + typeof val + ' to ' + typeof newVal + ' for ' + gKey);
              val = newVal;
              this.updateValue(newVal);
            }
          }
          trimAndRemoveStrings.call(this);
        }
      }
    }, {endPointsOnly: false});

    // Remove any objects that are now empty after filtering
    _.each(removedPositions, function (removedPosition) {
      var lastBrace = removedPosition.lastIndexOf('[');
      if (lastBrace > -1) {
        var removedPositionParent = removedPosition.slice(0, lastBrace);
        var value = mDoc.getValueForPosition(removedPositionParent);
        if (_.isEmpty(value)) mDoc.removeValueForPosition(removedPositionParent);
      }
    });

    mDoc.removeArrayItems();
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
 * Converts value to proper type
 *
 * @param {Any} value Value to try to convert
 * @param {Any} type  A type
 * @returns {Any} Value converted to type.
 */
function typeconvert(value, type) {
  var parsedDate;

  // Can't and shouldn't convert arrays or objects
  if (_.isArray(value) || (_.isObject(value) && !(value instanceof Date))) return value;

  // Convert to String type
  if (type === String) {
    if (Utility.isNotNullOrUndefined(value)) return value.toString();
    return value;
  }

  // Conver to Number type
  if (type === Number) {
    if (typeof value === "string" && !_.isEmpty(value)) {
      // Try to convert numeric strings to numbers
      var numberVal = Number(value);
      if (!isNaN(numberVal)) return numberVal;
    }
    // Leave it a string; will fail validation
    return value;
  }

  // If target type is a Date we can safely convert from either a
  // number (Integer value representing the number of milliseconds
  // since 1 January 1970 00:00:00 UTC) or a string that can be parsed
  // by Date.
  if (type === Date) {
    if (typeof value === "string") {
      parsedDate = Date.parse(value);
      if (isNaN(parsedDate) === false) return new Date(parsedDate);
    }
    if (typeof value === "number") return new Date(value);
  }

  // If an array is what you want, I'll give you an array
  if (type === Array) return [value];

  // Could not convert
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

  // On the client we can add the userId if not already in the custom context
  if (Meteor.isClient && extendedAutoValueContext.userId === void 0) {
    extendedAutoValueContext.userId = (Meteor.userId && Meteor.userId()) || null;
  }

  function runAV(func) {
    var affectedKey = this.key;

    // If already called for this key, skip it
    if (_.contains(doneKeys, affectedKey)) return;

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

    if (doUnset) mDoc.removeValueForPosition(this.position);

    if (autoValue === void 0) return;

    // If the user's auto value is of the pseudo-modifier format, parse it
    // into operator and value.
    if (isModifier) {
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

      if (op) {
        // Update/change value
        mDoc.removeValueForPosition(this.position);
        mDoc.setValueForPosition(op + '[' + affectedKey + ']', newValue);
        return;
      }
    }

    // Update/change value
    mDoc.setValueForPosition(this.position, autoValue);
  }

  _.each(self._autoValues, function(func, fieldName) {
    // AV should run for the exact key only, for each array item if under array
    // should run whenever
    // 1 it is set
    // 2 it will be set by an ancestor field being set
    // 3 it is not set and is not within an array
    // 4 it is not set and is within an array, run for each array item that is set
    // 5 if doing $set[a.$] or $set[a.$.b]

    var test = fieldName, positions = [], lastDot;
    var lastDollar = fieldName.lastIndexOf('$');
    var isOrIsWithinArray = lastDollar !== -1;

    // We always need to start by checking the array itself in case
    // it has items that have objects that need AV run. If not, we
    // will later check for the exact field name.
    if (isOrIsWithinArray) test = fieldName.slice(0, lastDollar + 1);

    while (positions.length === 0 && test.length > 0) {
      positions = mDoc.getPositionsInfoForGenericKey(test);
      if (positions.length > 0) {
        if (fieldName !== test && fieldName.indexOf('.$.') > -1) {
          var lastPart = '';
          if (fieldName.indexOf(test + '.') === 0) {
            lastPart = fieldName.replace(test + '.', '');
          }
          positions = _.map(positions, function (position) {
            position.key = position.key + '.' + lastPart;
            position.position = position.position + '[' + lastPart + ']';
            position.value = mDoc.getValueForPosition(position.position);
            return position;
          });
        }
      } else {
        lastDot = test.lastIndexOf('.');
        if (lastDot > -1) {
          test = test.slice(0, lastDot);
        } else {
          test = '';
        }
      }
    }

    if (positions.length === 0) {
      if (isOrIsWithinArray) {
        positions = mDoc.getPositionsInfoForGenericKey(fieldName);
      } else {
        // Not set directly or indirectly
        positions.push({
          key: fieldName,
          value: undefined,
          operator: isModifier ? '$set' : null,
          position: isModifier ? '$set[' + fieldName + ']' : MongoObject._keyToPosition(fieldName)
        });
      }
    }

    // Run the autoValue function once for each place in the object that
    // has a value or that potentially should.
    _.each(positions, function(position) {
      runAV.call(position, func);
    });
  });
}
