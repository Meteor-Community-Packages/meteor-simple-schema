/*
 * @constructor
 * @param {Object} objOrModifier
 * @returns {undefined}
 */
MongoObject = function(objOrModifier) {
  var self = this;
  self._obj = objOrModifier;
  self._affectedKeys = {};
  self._genericAffectedKeys = {};

  function parseObj(val, currentPosition, affectedKey, operator, adjusted) {

    // Adjust for first-level modifier operators
    if (!operator && affectedKey && affectedKey.substring(0, 1) === "$") {
      operator = affectedKey;
      affectedKey = null;
    }

    if (affectedKey) {

      // Adjust for $push and $addToSet
      if (!adjusted && (operator === "$push" || operator === "$addToSet" || operator === "$pull" || operator === "$pop")) {
        // Adjust for $each
        // We can simply jump forward and pretend like the $each array
        // is the array for the field. This has the added benefit of
        // skipping past any $slice, which we also don't care about.
        if (isBasicObject(val) && "$each" in val) {
          val = val.$each;
          currentPosition = currentPosition + "[$each]";
        } else {
          affectedKey = affectedKey + ".0";
        }
        adjusted = true;
      }

      if (currentPosition && (!isBasicObject(val) || _.isEmpty(val)) && (!_.isArray(val) || _.isEmpty(val))) {
        self._affectedKeys[currentPosition] = affectedKey;
        self._genericAffectedKeys[currentPosition] = makeGeneric(affectedKey);
      }
    }

    // Loop through arrays
    if (_.isArray(val)) {
      _.each(val, function(v, i) {
        parseObj(v, (currentPosition ? currentPosition + "[" + i + "]" : i), affectedKey + '.' + i, operator, adjusted);
      });
    }

    // Loop through object keys
    else if (isBasicObject(val)) {
      _.each(val, function(v, k) {
        if (k !== "$slice") {
          parseObj(v, (currentPosition ? currentPosition + "[" + k + "]" : k), appendAffectedKey(affectedKey, k), operator, adjusted);
        }
      });
    }

  }
  parseObj(objOrModifier);

//  (function recurse(obj, currentPosition, affectedKey, isUnderOperator, isUnderEachOrPullAll, isUnderArrayOperator) {
//    var newAffectedKey;
//    var objIsArray = isArray(obj);
//    var objIsObject = isBasicObject(obj);
//
//    //store values, affectedKeys, and genericAffectedKeys
//    if (currentPosition && (!objIsObject || _.isEmpty(obj)) && (!objIsArray || _.isEmpty(obj))) {
//      self._affectedKeys[currentPosition] = affectedKey;
//      self._genericAffectedKeys[currentPosition] = makeGeneric(affectedKey);
//    }
//
//    //loop through array items
//    else if (objIsArray) {
//      for (var i = 0, ln = obj.length; i < ln; i++) {
//        if (isUnderEachOrPullAll) {
//          newAffectedKey = affectedKey;
//        } else {
//          newAffectedKey = (affectedKey ? affectedKey + "." + i : i);
//        }
//        recurse(obj[i],
//                (currentPosition ? currentPosition + "[" + i + "]" : i),
//                newAffectedKey,
//                isUnderOperator,
//                null, // Only the first array needs to be treated differently
//                isUnderArrayOperator
//                );
//      }
//    }
//
//    //recurse into objects
//    else if (objIsObject) {
//      for (var key in obj) {
//        if (obj.hasOwnProperty(key)) {
//          if (key.substring(0, 1) === "$") {
//            newAffectedKey = affectedKey;
//          } else if (isUnderArrayOperator) {
//            newAffectedKey = (affectedKey ? affectedKey + ".$." + key : key);
//          } else {
//            newAffectedKey = (affectedKey ? affectedKey + "." + key : key);
//          }
//          if (key !== "$slice") {
//            recurse(obj[key], //value
//                    (currentPosition ? currentPosition + "[" + key + "]" : key), //position
//                    newAffectedKey,
//                    (isUnderOperator || key.substring(0, 1) === "$"),
//                    // For $each and $pullAll, the first array we come to after
//                    // the operator needs to be treated differently
//                    (isUnderEachOrPullAll || key === "$each" || key === "$pullAll"),
//                    (isUnderArrayOperator || key === "$push" || key === "$addToSet" || key === "$pull" || key === "$pop")
//                    );
//          }
//      }
//    }
//  }
//})(objOrModifier);

  // Runs a function for each endpoint node in the object tree, including all items in every array.
  // The function arguments are
  // (1) the value at this node
  // (2) a string representing the node position
  // (3) the representation of what would be changed in mongo, using mongo dot notation
  // (4) the generic equivalent of argument 3, with "$" instead of numeric pieces
  self.forEachNode = function(func) {
    if (typeof func !== "function")
      throw new Error("filter requires a loop function");
    _.each(self._affectedKeys, function(affectedKey, position) {
      func.call({
        updateValue: function(newVal) {
          self.setValueForPosition(position, newVal);
        },
        remove: function() {
          self.removeValueForPosition(position);
        }
      }, self.getValueForPosition(position), position, affectedKey, self._genericAffectedKeys[position]);
    });
  };

  self.getValueForPosition = function(position) {
    var subkey, subkeys = position.split("["), current = self._obj;
    for (var i = 0, ln = subkeys.length; i < ln; i++) {
      subkey = subkeys[i];
      // If the subkey ends in "]", remove the ending
      if (subkey.slice(-1) === "]") {
        subkey = subkey.slice(0, -1);
      }
      current = current[subkey];
      if (!isArray(current) && !isBasicObject(current) && i < ln - 1) {
        return;
      }
    }
    return current;
  };

  self.setValueForPosition = function(position, value) {
    var nextPiece, subkey, subkeys = position.split("["), current = self._obj;
    for (var i = 0, ln = subkeys.length; i < ln; i++) {
      subkey = subkeys[i];
      // If the subkey ends in "]", remove the ending
      if (subkey.slice(-1) === "]") {
        subkey = subkey.slice(0, -1);
      }
      if (i === ln - 1) {
        current[subkey] = value;
        //if value is undefined, delete the property
        if (value === void 0)
          delete current[subkey];
      } else {
        if (current[subkey] === void 0) {
          //see if the next piece is a number
          nextPiece = subkeys[i + 1];
          nextPiece = parseInt(nextPiece, 10);
          current[subkey] = isNaN(nextPiece) ? {} : [];
        }
        current = current[subkey];
        if (!isArray(current) && !isBasicObject(current) && i < ln - 1) {
          return;
        }
      }
    }
  };

  self.removeValueForPosition = function(position) {
//    var subkey, subkeys = position.split("["), current = self._obj;
//    for (var i = 0, ln = subkeys.length; i < ln; i++) {
//      subkey = subkeys[i];
//      // If the subkey ends in "]", remove the ending
//      if (subkey.slice(-1) === "]") {
//        subkey = subkey.slice(0, -1);
//      }
//      if (i === ln - 1) {
//        delete current[subkey];
//      } else {
//        current = current[subkey];
//        if (!isArray(current) && !isBasicObject(current) && i < ln - 1) {
//          return;
//        }
//      }
//    }

    // Update affected key caches
    for (var p in self._genericAffectedKeys) {
      if (self._genericAffectedKeys.hasOwnProperty(p)) {
        if (position.slice(0, p.length) === p) {
          delete self._genericAffectedKeys[p];
          delete self._affectedKeys[p];
        }
      }
    }

    // Rebuild _obj. This is necessary instead of deleting individual
    // nodes because it's the easier way to make sure ancestor nodes
    // are deleted as needed, too.
    self.rebuildObject();
  };

  // Returns the full array for the requested non-generic key,
  // if its value is an array
  self.getArrayInfoForKey = function(key) {
    key = key + ".$";
    var start, firstPositionPiece, v;
    for (var p in self._genericAffectedKeys) {
      if (self._genericAffectedKeys.hasOwnProperty(p)) {
        if (self._genericAffectedKeys[p] === key) {
          // Get the position string without the final array index
          start = p.slice(0, p.lastIndexOf("["));
          firstPositionPiece = p.slice(0, p.indexOf("["));
          v = self.getValueForPosition(start);
          if (isArray(v)) {
            return {
              value: v,
              operator: (firstPositionPiece.substring(0, 1) === "$") ? firstPositionPiece : null
            };
          }
        }
      }
    }
  };

  // Returns the value of the requested non-generic key
  self.getValueForKey = function(key) {
    for (var position in self._affectedKeys) {
      if (self._affectedKeys.hasOwnProperty(position)) {
        if (self._affectedKeys[position] === key) {
          // We return the first one we find. While it's
          // possible that multiple update operators could
          // affect the same key, mongo generally doesn't
          // like this, so we'll assume that's not the case.
          return self.getValueForPosition(position);
        }
      }
    }
  };

  // Returns the value and operator of the requested non-generic key
  self.getInfoForKey = function(key) {
    for (var position in self._affectedKeys) {
      if (self._affectedKeys.hasOwnProperty(position)) {
        if (self._affectedKeys[position] === key) {
          // We return the first one we find. While it's
          // possible that multiple update operators could
          // affect the same generic key, especially where
          // arrays are involved, we'll assume that's not the case.
          var firstPositionPiece = position.slice(0, position.indexOf("["));
          return {
            value: self.getValueForPosition(position),
            operator: (firstPositionPiece.substring(0, 1) === "$") ? firstPositionPiece : null
          };
        }
      }
    }
  };

  // Adds key with value val
  self.addKey = function(key, val, op) {
    var position, keyPieces;
    if (typeof op === "string") {
      position = op + "[" + key + "]";
    } else {
      keyPieces = key.split(".");
      for (var i = 0, ln = keyPieces.length; i < ln; i++) {
        if (i === 0) {
          position = keyPieces[i];
        } else {
          position += "[" + keyPieces[i] + "]";
        }
      }
    }

    self.setValueForPosition(position, val);
    self._affectedKeys[position] = key;
    self._genericAffectedKeys[position] = makeGeneric(key);
  };

  // Removes the requested generic key
  self.removeGenericKey = function(key) {
    for (var position in self._genericAffectedKeys) {
      if (self._genericAffectedKeys.hasOwnProperty(position)) {
        if (self._genericAffectedKeys[position] === key) {
          self.removeValueForPosition(position);
        }
      }
    }
  };

  // Removes the requested non-generic key
  self.removeKey = function(key) {
    for (var position in self._affectedKeys) {
      if (self._affectedKeys.hasOwnProperty(position)) {
        if (self._affectedKeys[position] === key) {
          self.removeValueForPosition(position);
        }
      }
    }
  };

  // Removes the requested non-generic keys
  self.removeKeys = function(keys) {
    for (var i = 0, ln = keys.length; i < ln; i++) {
      self.removeKey(keys[i]);
    }
  };

  // Passes all affected keys to a test function, which
  // should return false to remove whatever is affecting that key
  self.filterGenericKeys = function(test) {
    var gk, checkedKeys = [];
    for (var position in self._genericAffectedKeys) {
      if (self._genericAffectedKeys.hasOwnProperty(position)) {
        gk = self._genericAffectedKeys[position];
        if (!_.contains(checkedKeys, gk)) {
          checkedKeys.push(gk);
          if (gk && !test(gk)) {
            self.removeGenericKey(gk);
          }
        }
      }
    }
  };

  // Sets the value of the requested non-generic key
  self.setValueForKey = function(key, val) {
    for (var position in self._affectedKeys) {
      if (self._affectedKeys.hasOwnProperty(position)) {
        if (self._affectedKeys[position] === key) {
          self.setValueForPosition(position, val);
        }
      }
    }
  };

  // Sets the value of the requested generic key
  self.setValueForGenericKey = function(key, val) {
    for (var position in self._genericAffectedKeys) {
      if (self._genericAffectedKeys.hasOwnProperty(position)) {
        if (self._genericAffectedKeys[position] === key) {
          self.setValueForPosition(position, val);
        }
      }
    }
  };

  // Gets a normal object based on the MongoObject instance
  self.getObject = function() {
    return self._obj;
  };

  self.rebuildObject = function() {
    var newObj = {};
    _.each(self._affectedKeys, function(affectedKey, position) {
      MongoObject.expandKey(self.getValueForPosition(position), position, newObj);
    });
    self._obj = newObj;
  };

  // Gets a flat object based on the MongoObject instance.
  // In a flat object, the key is the name of the non-generic affectedKey,
  // with mongo dot notation if necessary, and the value is the value for
  // that key.
  self.getFlatObject = function() {
    var newObj = {};
    _.each(self._affectedKeys, function(affectedKey, position) {
      if (typeof affectedKey === "string") {
        newObj[affectedKey] = self.getValueForPosition(position);
      }
    });
    return newObj;
  };

  // Returns true if the non-generic key is affected by this object
  self.affectsKey = function(key) {
    for (var position in self._affectedKeys) {
      if (self._affectedKeys.hasOwnProperty(position)) {
        if (self._affectedKeys[position] === key) {
          return true;
        }
      }
    }
    return false;
  };

  // Returns true if the generic key is affected by this object
  self.affectsGenericKey = function(key) {
    for (var position in self._genericAffectedKeys) {
      if (self._genericAffectedKeys.hasOwnProperty(position)) {
        if (self._genericAffectedKeys[position] === key) {
          return true;
        }
      }
    }
    return false;
  };

  // Like affectsGenericKey, but will return true if a child key is affected
  self.affectsGenericKeyImplicit = function(key) {
    for (var position in self._genericAffectedKeys) {
      if (self._genericAffectedKeys.hasOwnProperty(position)) {
        var affectedKey = self._genericAffectedKeys[position];

        // If the affected key is the test key
        if (affectedKey === key) {
          return true;
        }

        // If the affected key implies the test key because the affected key
        // starts with the test key followed by a period
        if (affectedKey.substring(0, key.length + 1) === key + ".") {
          return true;
        }

        // If the affected key implies the test key because the affected key
        // starts with the test key and the test key ends with ".$"
        var lastTwo = key.slice(-2);
        if (lastTwo === ".$" && key.slice(0, -2) === affectedKey) {
          return true;
        }
      }
    }
    return false;
  };
};

/** Takes a string representation of an object key and its value
 *  and updates "obj" to contain that key with that value.
 *  
 *  Example keys and results if val is 1:
 *    "a" -> {a: 1}
 *    "a[b]" -> {a: {b: 1}}
 *    "a[b][0]" -> {a: {b: [1]}}
 *    "a[b.0.c]" -> {a: {'b.0.c': 1}}
 */

/** Takes a string representation of an object key and its value
 *  and updates "obj" to contain that key with that value.
 *  
 *  Example keys and results if val is 1:
 *    "a" -> {a: 1}
 *    "a[b]" -> {a: {b: 1}}
 *    "a[b][0]" -> {a: {b: [1]}}
 *    "a[b.0.c]" -> {a: {'b.0.c': 1}}
 * 
 * @param {any} val
 * @param {String} key
 * @param {Object} obj
 * @returns {undefined}
 */
MongoObject.expandKey = function(val, key, obj) {
  var nextPiece, subkey, subkeys = key.split("["), current = obj;
  for (var i = 0, ln = subkeys.length; i < ln; i++) {
    subkey = subkeys[i];
    if (subkey.slice(-1) === "]") {
      subkey = subkey.slice(0, -1);
    }
    if (i === ln - 1) {
      //last iteration; time to set the value; always overwrite
      current[subkey] = val;
      //if val is undefined, delete the property
      if (val === void 0)
        delete current[subkey];
    } else {
      //see if the next piece is a number
      nextPiece = subkeys[i + 1];
      nextPiece = parseInt(nextPiece, 10);
      if (!current[subkey]) {
        current[subkey] = isNaN(nextPiece) ? {} : [];
      }
    }
    current = current[subkey];
  }
};

var isArray = Array.isArray || function(obj) {
  return obj.toString() === '[object Array]';
};

var isObject = function(obj) {
  return obj === Object(obj);
};

/* Tests whether "obj" is an Object as opposed to
 * something that inherits from Object
 * 
 * @param {any} obj
 * @returns {Boolean}
 */
var isBasicObject = function(obj) {
  return isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;
};

/* Takes a specific string that uses mongo-style dot notation
 * and returns a generic string equivalent. Replaces all numeric
 * "pieces" with a dollar sign ($).
 * 
 * @param {type} name
 * @returns {unresolved}
 */
var makeGeneric = function(name) {
  if (typeof name !== "string")
    return null;
  return name.replace(/\.[0-9]+\./g, '.$.').replace(/\.[0-9]+/g, '.$');
};

var appendAffectedKey = function(affectedKey, key) {
  if (key === "$each") {
    return affectedKey;
  } else {
    return (affectedKey ? affectedKey + "." + key : key);
  }
};