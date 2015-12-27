/* global Utility:true */

Utility = {
  appendAffectedKey: (affectedKey, key) => {
    if (key === "$each") return affectedKey;
    return (affectedKey ? affectedKey + "." + key : key);
  },
  shouldCheck: (key) => {
    if (key === "$pushAll") throw new Error("$pushAll is not supported; use $push + $each");
    return !_.contains(["$pull", "$pullAll", "$pop", "$slice"], key);
  },
  // Tests whether it's an Object as opposed to something that inherits from Object
  isBasicObject: (obj) => {
    return _.isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;
  },
  // The latest Safari returns false for Uint8Array, etc. instanceof Function
  // unlike other browsers.
  safariBugFix: (type) => {
    return (typeof Uint8Array !== "undefined" && type === Uint8Array) ||
      (typeof Uint16Array !== "undefined" && type === Uint16Array) ||
      (typeof Uint32Array !== "undefined" && type === Uint32Array) ||
      (typeof Uint8ClampedArray !== "undefined" && type === Uint8ClampedArray);
  },
  isNotNullOrUndefined: (val) => {
    return val !== void 0 && val !== null;
  },
  // Extracts operator piece, if present, from position string
  extractOp: (position) => {
    let firstPositionPiece = position.slice(0, position.indexOf("["));
    return (firstPositionPiece.substring(0, 1) === "$") ? firstPositionPiece : null;
  },
  looksLikeModifier: (obj) => {
    for (let key in obj) {
      if (obj.hasOwnProperty(key) && key.substring(0, 1) === '$') return true;
    }
    return false;
  },
  dateToDateString: (date) => {
    let m = (date.getUTCMonth() + 1);
    if (m < 10) {
      m = "0" + m;
    }
    let d = date.getUTCDate();
    if (d < 10) {
      d = "0" + d;
    }
    return date.getUTCFullYear() + '-' + m + '-' + d;
  }
};
