//not exported
MongoObject = function(obj) {
  var self = this;
  self.obj = obj;
};

// Runs a function for each endpoint node in the object tree, including all items in every array.
// The function arguments are
// (1) the value at this node
// (2) a string representing the node position using mongo dot notation. If the key
//     itself contains periods, they are escaped as "@!"
// (3) the representation of what would be changed in mongo, using mongo dot notation
// (4) the generic equivalent of argument 3, with "$" instead of numeric pieces
MongoObject.prototype.forEachNode = function(func) {
  var self = this;
  func = func || function() {
  };

  function recurse(obj, currentPosition, affectedKey, isEachObject, isEachArray, isArrayType, isUnderSlice) {
    var value, escapedKey, newPosition, newAffectedKey, newIsArrayType, newIsUnderSlice;
    var objIsArray = isArray(obj);
    var objIsObject = isBasicObject(obj);

    //call user-defined function
    if (currentPosition && (!objIsArray || !obj.length) && (!objIsObject || _.isEmpty(obj))) {
      if (isUnderSlice) {
        func(obj, currentPosition, null, null);
      } else {
        func(obj, currentPosition, affectedKey, makeGeneric(affectedKey));
      }
    }

    //loop through array items
    if (objIsArray) {
      for (var i = 0, ln = obj.length; i < ln; i++) {
        value = obj[i];
        newPosition = (currentPosition ? currentPosition + "." + i : i); // joined index with dot
        if (!isEachObject && !isEachArray && isObject(value)) {
          newAffectedKey = (affectedKey ? affectedKey + "." + i : i);
        } else {
          newAffectedKey = affectedKey;
        }
        recurse(value, newPosition, newAffectedKey, null, isEachObject, isArrayType, isUnderSlice);
      }
    }

    //recurse into objects
    else if (objIsObject) {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          value = obj[key];
          escapedKey = key.replace(/\./g, "@!"); //random escape sequence
          newPosition = (currentPosition ? currentPosition + "." + escapedKey : escapedKey); // joined property with dot
          if (isArrayType) {
           if (key.substring(0, 1) === "$") {
              newAffectedKey = affectedKey;
            } else {
              newAffectedKey = (affectedKey ? affectedKey + ".$." + key : key);
            }
          } else if (key.substring(0, 1) === "$") {
            newAffectedKey = affectedKey;
          } else {
            newAffectedKey = (affectedKey ? affectedKey + "." + key : key);
          }
          newIsArrayType = isArrayType || key === "$push" || key === "$addToSet" || key === "$pull" || key === "$pop";
          newIsUnderSlice = isUnderSlice || key === "$slice";
          recurse(value, newPosition, newAffectedKey, (key === "$each"), null, newIsArrayType, newIsUnderSlice);
        }
      }
    }
  }
  
  recurse(self.obj);
  return self;
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

var makeGeneric = function (name) {
  if (typeof name !== "string")
    return null;
  
  return name.replace(/\.[0-9]+\./g, '.$.').replace(/\.[0-9]+/g, '.$');
};