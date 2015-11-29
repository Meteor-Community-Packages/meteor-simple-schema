SimpleSchema._globalMessages = {
  required: "[label] is required",
  minString: "[label] must be at least [min] characters",
  maxString: "[label] cannot exceed [max] characters",
  minNumber: "[label] must be at least [min]",
  maxNumber: "[label] cannot exceed [max]",
  minNumberExclusive: "[label] must be greater than [min]",
  maxNumberExclusive: "[label] must be less than [max]",
  minDate: "[label] must be on or after [min]",
  maxDate: "[label] cannot be after [max]",
  badDate: "[label] is not a valid date",
  minCount: "You must specify at least [minCount] values",
  maxCount: "You cannot specify more than [maxCount] values",
  noDecimal: "[label] must be an integer",
  notAllowed: "[value] is not an allowed value",
  expectedString: "[label] must be a string",
  expectedNumber: "[label] must be a number",
  expectedBoolean: "[label] must be a boolean",
  expectedArray: "[label] must be an array",
  expectedObject: "[label] must be an object",
  expectedConstructor: "[label] must be a [type]",
  regEx: [
    {msg: "[label] failed regular expression validation"},
    {exp: SimpleSchema.RegEx.Email, msg: "[label] must be a valid e-mail address"},
    {exp: SimpleSchema.RegEx.WeakEmail, msg: "[label] must be a valid e-mail address"},
    {exp: SimpleSchema.RegEx.Domain, msg: "[label] must be a valid domain"},
    {exp: SimpleSchema.RegEx.WeakDomain, msg: "[label] must be a valid domain"},
    {exp: SimpleSchema.RegEx.IP, msg: "[label] must be a valid IPv4 or IPv6 address"},
    {exp: SimpleSchema.RegEx.IPv4, msg: "[label] must be a valid IPv4 address"},
    {exp: SimpleSchema.RegEx.IPv6, msg: "[label] must be a valid IPv6 address"},
    {exp: SimpleSchema.RegEx.Url, msg: "[label] must be a valid URL"},
    {exp: SimpleSchema.RegEx.Id, msg: "[label] must be a valid alphanumeric ID"}
  ],
  keyNotInSchema: "[key] is not allowed by the schema"
};

SimpleSchema._depsGlobalMessages = new Tracker.Dependency();

SimpleSchema.messages = function (messages, options) {
  options = options || {};

  if (options.extendRegEx) {
    for (var prop in messages) {
      if (messages.hasOwnProperty(prop) &&
          prop.startsWith('regEx') &&
          _.isArray(messages[prop]) &&
          _.isArray(SimpleSchema._globalMessages[prop])) {
        messages[prop] = mergeRegEx(SimpleSchema._globalMessages[prop], messages[prop]);
      }
    }
  }

  _.extend(SimpleSchema._globalMessages, messages);
  SimpleSchema._depsGlobalMessages.changed();
};

// Schema-specific messages

SimpleSchema.prototype.messages = function (messages, options) {
  var self = this;

  options = options || {};

  if (options.extendRegEx) {
    for (var prop in messages) {
      if (messages.hasOwnProperty(prop) &&
          prop.startsWith('regEx') &&
          _.isArray(messages[prop]) &&
          _.isArray(self._messages[prop])) {
        messages[prop] = mergeRegEx(self._messages[prop], messages[prop]);
      }
    }
  }

  _.extend(self._messages, messages);
  self._depsMessages.changed();
};

// Returns a string message for the given error type and key. Uses the
// def and value arguments to fill in placeholders in the error messages.
SimpleSchema.prototype.messageForError = function (type, key, def, value, message) {
  var self = this;

  // We proceed even if we can't get a definition because it might be a keyNotInSchema error
  def = def || self.getDefinition(key, ['regEx', 'label', 'minCount', 'maxCount', 'min', 'max', 'type']) || {};

  // Adjust for complex types, currently only regEx,
  // where we might have regEx.1 meaning the second
  // expression in the array.
  var firstTypePeriod = type.indexOf("."), index = null;
  if (firstTypePeriod !== -1) {
    index = type.substring(firstTypePeriod + 1);
    index = parseInt(index, 10);
    type = type.substring(0, firstTypePeriod);
  }

  // Which regExp is it?
  var regExpMatch;
  if (type === SimpleSchema.ErrorTypes.FAILED_REGULAR_EXPRESSION) {
    if (index !== null && index !== void 0 && !isNaN(index)) {
      regExpMatch = def.regEx[index];
    } else {
      regExpMatch = def.regEx;
    }
    if (regExpMatch) {
      regExpMatch = regExpMatch.toString();
    }
  }

  // Prep some strings to be used when finding the correct message for this error
  var typePlusKey = type + " " + key;
  var genericKey = MongoObject.makeKeyGeneric(key);
  var typePlusGenKey = type + " " + genericKey;

  // reactively update when message templates are changed
  SimpleSchema._depsGlobalMessages.depend();
  self._depsMessages.depend();

  // Prep a function that finds the correct message for regEx errors
  function findRegExError(message) {
    if (type !== SimpleSchema.ErrorTypes.FAILED_REGULAR_EXPRESSION || !_.isArray(message)) return message;
    // Parse regEx messages, which are provided in a special object array format
    // [{exp: RegExp, msg: "Foo"}]
    // Where `exp` is optional

    var msgObj;
    // First see if there's one where exp matches this expression
    if (regExpMatch) {
      msgObj = _.find(message, function (o) {
        return o.exp && o.exp.toString() === regExpMatch;
      });
    }

    // If not, see if there's a default message defined
    if (!msgObj) {
      msgObj = _.findWhere(message, {exp: null});
      if (!msgObj) {
        msgObj = _.findWhere(message, {exp: void 0});
      }
    }

    return msgObj ? msgObj.msg : null;
  }

  // Try finding the correct message to use at various levels, from most
  // specific to least specific.
  message = message ||                                      // Passed in message

                self._messages[typePlusKey] ||                  // (1) Use schema-specific message for specific key
                self._messages[typePlusGenKey] ||               // (2) Use schema-specific message for generic key
                self._messages[type];                           // (3) Use schema-specific message for type
  message = findRegExError(message);

  if (!message) {
    message = SimpleSchema._globalMessages[typePlusKey] ||      // (4) Use global message for specific key
              SimpleSchema._globalMessages[typePlusGenKey] ||   // (5) Use global message for generic key
              SimpleSchema._globalMessages[type];               // (6) Use global message for type
    message = findRegExError(message);
  }

  if (!message) return "Unknown validation error";

  // Now replace all placeholders in the message with the correct values

  // [key]
  message = message.replace("[key]", key);

  // [label]
  // The call to self.label() establishes a reactive dependency, too
  message = message.replace("[label]", self.label(key));

  // [minCount]
  if (typeof def.minCount !== "undefined") {
    message = message.replace("[minCount]", def.minCount);
  }

  // [maxCount]
  if (typeof def.maxCount !== "undefined") {
    message = message.replace("[maxCount]", def.maxCount);
  }

  // [value]
  if (value !== void 0 && value !== null) {
    message = message.replace("[value]", value.toString());
  } else {
    message = message.replace("[value]", 'null');
  }

  // [min] and [max]
  var min = def.min;
  var max = def.max;
  if (def.type === Date || def.type === [Date]) {
    if (typeof min !== "undefined") {
      message = message.replace("[min]", Utility.dateToDateString(min));
    }
    if (typeof max !== "undefined") {
      message = message.replace("[max]", Utility.dateToDateString(max));
    }
  } else {
    if (typeof min !== "undefined") {
      message = message.replace("[min]", min);
    }
    if (typeof max !== "undefined") {
      message = message.replace("[max]", max);
    }
  }

  // [type]
  if (def.type instanceof Function) {
    message = message.replace("[type]", def.type.name);
  }

  // Now return the message
  return message;
};

/*
 * PRIVATE
 */

if (!_.findIndex) {
  _.findIndex = function (array, predicate) {
    var length = array.length;
    var index = 0;
    for (; index >= 0 && index < length; index += 1) {
      if (predicate(array[index], index, array)) return index;
    }
    return -1;
  };
}

// Merges two regEx arrays in the message list
function mergeRegEx(currentRegEx, newRegEx) {
  _.each(newRegEx, function (obj) {
    var idx = _.findIndex(currentRegEx, function (currentObj) {
      return (currentObj.exp + '') === (obj.exp + '');
    });
    if (idx > -1) {
      currentRegEx.splice(idx, 1);
    }
    if (!obj.hasOwnProperty('exp')) {
      // Keep the default one first
      currentRegEx.unshift(obj);
    } else {
      currentRegEx.push(obj);
    }
  });

  return currentRegEx;
}
