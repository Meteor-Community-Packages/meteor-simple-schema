/* global Utility:true */

Utility = {
  appendAffectedKey: function appendAffectedKey(affectedKey, key) {
    if (key === "$each") {
      return affectedKey;
    } else {
      return (affectedKey ? affectedKey + "." + key : key);
    }
  },
  shouldCheck: function shouldCheck(key) {
    if (key === "$pushAll") {
      throw new Error("$pushAll is not supported; use $push + $each");
    }
    return !_.contains(["$pull", "$pullAll", "$pop", "$slice"], key);
  },
  errorObject: function errorObject(errorType, keyName, keyValue) {
    return {name: keyName, type: errorType, value: keyValue};
  },
  // Tests whether it's an Object as opposed to something that inherits from Object
  isBasicObject: function isBasicObject(obj) {
    return _.isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;
  },
  // The latest Safari returns false for Uint8Array, etc. instanceof Function
  // unlike other browsers.
  safariBugFix: function safariBugFix(type) {
    return (typeof Uint8Array !== "undefined" && type === Uint8Array) ||
      (typeof Uint16Array !== "undefined" && type === Uint16Array) ||
      (typeof Uint32Array !== "undefined" && type === Uint32Array) ||
      (typeof Uint8ClampedArray !== "undefined" && type === Uint8ClampedArray);
  },
  isNotNullOrUndefined: function isNotNullOrUndefined(val) {
    return val !== void 0 && val !== null;
  },
  // Extracts operator piece, if present, from position string
  extractOp: function extractOp(position) {
    var firstPositionPiece = position.slice(0, position.indexOf("["));
    return (firstPositionPiece.substring(0, 1) === "$") ? firstPositionPiece : null;
  },
  deleteIfPresent: function deleteIfPresent(obj, key) {
    if (key in obj) {
      delete obj[key];
    }
  },
  looksLikeModifier: function looksLikeModifier(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key) && key.substring(0, 1) === "$") {
        return true;
      }
    }
    return false;
  },
  dateToDateString: function dateToDateString(date) {
    var m = (date.getUTCMonth() + 1);
    if (m < 10) {
      m = "0" + m;
    }
    var d = date.getUTCDate();
    if (d < 10) {
      d = "0" + d;
    }
    return date.getUTCFullYear() + '-' + m + '-' + d;
  }
};
