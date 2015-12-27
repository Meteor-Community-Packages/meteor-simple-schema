if (!String.prototype.startsWith) {
  String.prototype.startsWith = function (searchString, position) {
    position = position || 0;
    return this.indexOf(searchString, position) === position;
  };
}

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function (searchString, position) {
    var subjectString = this.toString();
    if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
      position = subjectString.length;
    }
    position -= searchString.length;
    var lastIndex = subjectString.indexOf(searchString, position);
    return lastIndex !== -1 && lastIndex === position;
  };
}

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
}

// getPrototypeOf polyfill
if (!Object.getPrototypeOf) {
  if (typeof "".__proto__ === "object") {
    Object.getPrototypeOf = function(object) {
      return object.__proto__;
    };
  } else {
    Object.getPrototypeOf = function(object) {
      // May break if the constructor has been tampered with
      return object.constructor.prototype;
    };
  }
}
