//exported
MongoObject = function(objOrModifier) {
  var self = this;
  self._values = {};
  self._affectedKeys = {};
  self._genericAffectedKeys = {};

  (function recurse(obj, currentPosition, affectedKey, isUnderOperator, isUnderEachOrPullAll, isUnderArrayOperator, isUnderSlice) {
    var newAffectedKey;
    var objIsArray = isArray(obj);
    var objIsObject = isBasicObject(obj);

    //store values, affectedKeys, and genericAffectedKeys
    if (currentPosition && (!objIsObject || _.isEmpty(obj)) && (!objIsArray || _.isEmpty(obj))) {
      if (isUnderSlice) {
        self._values[currentPosition] = obj;
        self._affectedKeys[currentPosition] = null;
        self._genericAffectedKeys[currentPosition] = null;
      } else {
        self._values[currentPosition] = obj;
        self._affectedKeys[currentPosition] = affectedKey;
        self._genericAffectedKeys[currentPosition] = makeGeneric(affectedKey);
      }
    }

    //loop through array items
    else if (objIsArray) {
      for (var i = 0, ln = obj.length; i < ln; i++) {
        if (isUnderEachOrPullAll) {
          newAffectedKey = affectedKey;
        } else {
          newAffectedKey = (affectedKey ? affectedKey + "." + i : i);
        }
        recurse(obj[i],
                (currentPosition ? currentPosition + "[" + i + "]" : i),
                newAffectedKey,
                isUnderOperator,
                null, // Only the first array needs to be treated differently
                isUnderArrayOperator,
                isUnderSlice);
      }
    }

    //recurse into objects
    else if (objIsObject) {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (key.substring(0, 1) === "$") {
            newAffectedKey = affectedKey;
          } else if (isUnderArrayOperator) {
            newAffectedKey = (affectedKey ? affectedKey + ".$." + key : key);
          } else {
            newAffectedKey = (affectedKey ? affectedKey + "." + key : key);
          }
          recurse(obj[key], //value
                  (currentPosition ? currentPosition + "[" + key + "]" : key), //position
                  newAffectedKey,
                  (isUnderOperator || key.substring(0, 1) === "$"),
                  // For $each and $pullAll, the first array we come to after
                  // the operator needs to be treated differently
                  (isUnderEachOrPullAll || key === "$each" || key === "$pullAll"),
                  (isUnderArrayOperator || key === "$push" || key === "$addToSet" || key === "$pull" || key === "$pop"),
                  (isUnderSlice || key === "$slice"));
        }
      }
    }
  })(objOrModifier);

  // Runs a function for each endpoint node in the object tree, including all items in every array.
  // The function arguments are
  // (1) the value at this node
  // (2) a string representing the node position using mongo dot notation. If the key
  //     itself contains periods, they are escaped as "@!"
  // (3) the representation of what would be changed in mongo, using mongo dot notation
  // (4) the generic equivalent of argument 3, with "$" instead of numeric pieces
  self.forEachNode = function(func) {
    if (typeof func !== "function")
      throw new Error("filter requires a loop function");
    _.each(self._values, function(val, position) {
      func.call({
        updateValue: function(newVal) {
          self._values[position] = newVal;
        },
        remove: function() {
          delete self._values[position];
          delete self._affectedKeys[position];
          delete self._genericAffectedKeys[position];
        }
      }, val, position, self._affectedKeys[position], self._genericAffectedKeys[position]);
    });
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
          return self._values[position];
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
            value: self._values[position],
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

    self._values[position] = val;
    self._affectedKeys[position] = key;
    self._genericAffectedKeys[position] = makeGeneric(key);
  };

  // Removes the requested non-generic key
  self.removeKey = function(key) {
    for (var position in self._affectedKeys) {
      if (self._affectedKeys.hasOwnProperty(position)) {
        if (self._affectedKeys[position] === key) {
          delete self._values[position];
          delete self._affectedKeys[position];
          delete self._genericAffectedKeys[position];
        }
      }
    }
  };

  // Sets the value of the requested non-generic key
  self.setValueForKey = function(key, val) {
    for (var position in self._affectedKeys) {
      if (self._affectedKeys.hasOwnProperty(position)) {
        if (self._affectedKeys[position] === key) {
          self._values[position] = val;
        }
      }
    }
  };

  // Sets the value of the requested generic key
  self.setValueForGenericKey = function(key, val) {
    for (var position in self._genericAffectedKeys) {
      if (self._genericAffectedKeys.hasOwnProperty(position)) {
        if (self._genericAffectedKeys[position] === key) {
          self._values[position] = val;
        }
      }
    }
  };

  // Gets a normal object based on the MongoObject instance
  self.getObject = function() {
    var newObj = {};
    _.each(self._values, function(val, position) {
      MongoObject.expandKey(val, position, newObj);
    });
    return newObj;
  };

  // Gets a flat object based on the MongoObject instance.
  // In a flat object, the key is the name of the non-generic affectedKey,
  // with mongo dot notation if necessary, and the value is the value for
  // that key.
  self.getFlatObject = function() {
    var newObj = {};
    _.each(self._values, function(val, position) {
      var affectedKey = self._affectedKeys[position];
      if (typeof affectedKey === "string") {
        newObj[affectedKey] = val;
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
MongoObject.expandKey = function(val, key, obj) {
  var nextPiece, subkeys = key.split("["), current = obj;
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

//tests whether it's an Object as opposed to something that inherits from Object
var isBasicObject = function(obj) {
  return isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;
};

var makeGeneric = function(name) {
  if (typeof name !== "string")
    return null;
  return name.replace(/\.[0-9]+\./g, '.$.').replace(/\.[0-9]+/g, '.$');
};