/* global SimpleSchema */
/* global Address:true */

/*
 * BEGIN SETUP FOR TESTS
 */

//SimpleSchema.debug = true;

// Custom type for custom type checking
Address = function(city, state) {
  this.city = city;
  this.state = state;
};

Address.prototype = {
  constructor: Address,
  toString: function() {
    return this.city + ', ' + this.state;
  },
  clone: function() {
    return new Address(this.city, this.state);
  },
  equals: function(other) {
    if (!(other instanceof Address)) {
      return false;
    }
    return EJSON.stringify(this) === EJSON.stringify(other);
  },
  typeName: function() {
    return "Address";
  },
  toJSONValue: function() {
    return {
      city: this.city,
      state: this.state
    };
  }
};

var ssr = new SimpleSchema({
  requiredString: {
    type: String
  },
  requiredBoolean: {
    type: Boolean
  },
  requiredNumber: {
    type: Number
  },
  requiredDate: {
    type: Date
  },
  requiredEmail: {
    type: String,
    regEx: SimpleSchema.RegEx.Email
  },
  requiredUrl: {
    type: String,
    regEx: SimpleSchema.RegEx.Url
  },
  requiredObject: {
    type: Object
  },
  'requiredObject.requiredNumber': {
    type: Number
  },
  optionalObject: {
    type: Object,
    optional: true
  },
  'optionalObject.requiredString': {
    type: String
  },
  anOptionalOne: {
    type: String,
    optional: true,
    min: 20
  }
});

ssr.messages({
  "regEx requiredEmail": "[label] is not a valid e-mail address",
  "regEx requiredUrl": "[label] is not a valid URL"
});

var ss = new SimpleSchema({
  string: {
    type: String,
    optional: true
  },
  minMaxString: {
    type: String,
    optional: true,
    min: 10,
    max: 20,
    regEx: /^[a-z0-9_]+$/
  },
  minMaxStringArray: {
    type: [String],
    optional: true,
    min: 10,
    max: 20,
    minCount: 1,
    maxCount: 2
  },
  allowedStrings: {
    type: String,
    optional: true,
    allowedValues: ["tuna", "fish", "salad"]
  },
  allowedStringsArray: {
    type: [String],
    optional: true,
    allowedValues: ["tuna", "fish", "salad"]
  },
  boolean: {
    type: Boolean,
    optional: true
  },
  booleanArray: {
    type: [Boolean],
    optional: true
  },
  number: {
    type: Number,
    optional: true
  },
  'sub.number': {
    type: Number,
    optional: true
  },
  minMaxNumber: {
    type: Number,
    optional: true,
    min: 10,
    max: 20
  },
  minZero: {
    type: Number,
    optional: true,
    min: 0
  },
  maxZero: {
    type: Number,
    optional: true,
    max: 0
  },
  minMaxNumberCalculated: {
    type: Number,
    optional: true,
    min: function() {
      return 10;
    },
    max: function() {
      return 20;
    }
  },
  minMaxNumberExclusive: {
     type: Number,
     optional: true,
     min: 10,
     max: 20,
     exclusiveMax: true,
     exclusiveMin: true
  },
  minMaxNumberInclusive: {
     type: Number,
     optional: true,
     min: 10,
     max: 20,
     exclusiveMax: false,
     exclusiveMin: false
  },
  allowedNumbers: {
    type: Number,
    optional: true,
    allowedValues: [1, 2, 3]
  },
  allowedNumbersArray: {
    type: [Number],
    optional: true,
    allowedValues: [1, 2, 3]
  },
  decimal: {
    type: Number,
    optional: true,
    decimal: true
  },
  date: {
    type: Date,
    optional: true
  },
  dateArray: {
    type: [Date],
    optional: true
  },
  minMaxDate: {
    type: Date,
    optional: true,
    min: (new Date(Date.UTC(2013, 0, 1))),
    max: (new Date(Date.UTC(2013, 11, 31)))
  },
  minMaxDateCalculated: {
    type: Date,
    optional: true,
    min: function() {
      return (new Date(Date.UTC(2013, 0, 1)));
    },
    max: function() {
      return (new Date(Date.UTC(2013, 11, 31)));
    }
  },
  email: {
    type: String,
    regEx: SimpleSchema.RegEx.Email,
    optional: true
  },
  url: {
    type: String,
    regEx: SimpleSchema.RegEx.Url,
    optional: true
  },
  customObject: {
    type: Address,
    optional: true,
    blackbox: true
  },
  blackBoxObject: {
    type: Object,
    optional: true,
    blackbox: true
  },
  oid: {
    type: [Meteor.Collection.ObjectID],
    optional: true
  }
});

ss.messages({
  minCount: "blah",
  "regEx email": "[label] is not a valid e-mail address",
  "regEx url": "[label] is not a valid URL"
});

var pss = new SimpleSchema({
  password: {
    type: String
  },
  confirmPassword: {
    type: String,
    custom: function() {
      if (this.value !== this.field('password').value) {
        return "passwordMismatch";
      }
    }
  }
});

var friends = new SimpleSchema({
  name: {
    type: String,
    optional: true
  },
  friends: {
    type: [Object],
    minCount: 1
  },
  'friends.$.name': {
    type: String,
    max: 3
  },
  'friends.$.type': {
    type: String,
    allowedValues: ["best", "good", "bad"]
  },
  'friends.$.a.b': {
    type: Number,
    optional: true
  },
  enemies: {
    type: [Object]
  },
  'enemies.$.name': {
    type: String
  },
  'enemies.$.traits': {
    type: [Object],
    optional: true
  },
  'enemies.$.traits.$.name': {
    type: String
  },
  'enemies.$.traits.$.weight': {
    type: Number,
    decimal: true
  }
});

var autoValues = new SimpleSchema({
  name: {
    type: String
  },
  someDefault: {
    type: Number,
    autoValue: function() {
      if (!this.isSet) {
        return 5;
      }
    }
  },
  updateCount: {
    type: Number,
    autoValue: function() {
      if (!this.operator) {
        return 0;
      } else {
        return {$inc: 1};
      }
    }
  },
  content: {
    type: String,
    optional: true
  },
  firstWord: {
    type: String,
    optional: true,
    autoValue: function() {
      var content = this.field("content");
      if (content.isSet) {
        return content.value.split(' ')[0];
      } else {
        this.unset();
      }
    }
  },
  updatesHistory: {
    type: [Object],
    optional: true,
    autoValue: function() {
      var content = this.field("content");
      if (content.isSet) {
        if (!this.operator) {
          return [{
              date: new Date(),
              content: content.value
            }];
        } else {
          return {
            $push: {
              date: new Date(),
              content: content.value
            }
          };
        }
      }
    }
  },
  'updatesHistory.$.date': {
    type: Date,
    optional: true
  },
  'updatesHistory.$.content': {
    type: String,
    optional: true
  },
  avArrayOfObjects: {
    type: [Object],
    optional: true
  },
  'avArrayOfObjects.$.a': {
    type: String
  },
  'avArrayOfObjects.$.foo': {
    type: String,
    autoValue: function () {
      return "bar";
    }
  }
});

var defaultValues = new SimpleSchema({
  name: {
    type: String,
    defaultValue: "Test",
    optional: true
  },
  'a.b': {
    type: String,
    defaultValue: "Test",
    optional: true
  },
  'b.$.a': {
    type: String,
    defaultValue: "Test",
    optional: true
  },
  strVals: {
    type: [String],
    defaultValue: [],
    optional: true
  }
});

var optCust = new SimpleSchema({
  foo: {
    type: String,
    optional: true,
    custom: function() {
      return "custom";
    }
  }
});

var reqCust = new SimpleSchema({
  a: {
    type: [Object],
    custom: function () {
      // Just adding custom to trigger extra validation
    }
  },
  b: {
    type: [Object],
    custom: function () {
      // Just adding custom to trigger extra validation
    }
  }
});

var optionalInObject = new SimpleSchema({
  requiredObj: {
    type: Object
  },
  'requiredObj.optionalProp': {
    type: String,
    optional: true
  },
  'requiredObj.requiredProp': {
    type: String
  }
});

/*
 * END SETUP FOR TESTS
 */

/*
 * BEGIN HELPER METHODS
 */

function validate(ss, doc, isModifier, isUpsert, skipClean) {
  //we will filter, type convert, and validate everything
  //so that we can be sure the filtering and type converting are not invalidating
  //documents that should be valid
  if (!skipClean) {
    doc = ss.clean(doc);
  }

  var context = ss.newContext();
  context.validate(doc, {modifier: isModifier, upsert: isUpsert});
  return context;
}

function validateNoClean(ss, doc, isModifier, isUpsert) {
  return validate(ss, doc, isModifier, isUpsert, true);
}

/*
 * END HELPER METHODS
 */

/*
 * BEGIN TESTS
 */

Tinytest.add("SimpleSchema - makeGeneric", function(test) {
  var generic = SimpleSchema._makeGeneric('foo.0.0.ab.c.123.4square.d.67e.f.g.1');
  test.equal(generic, 'foo.$.$.ab.c.$.4square.d.67e.f.g.$');
});

Tinytest.add("SimpleSchema - Required Checks - Insert - Valid", function(test) {
  var sc = validate(ssr, {
    requiredString: "test",
    requiredBoolean: true,
    requiredNumber: 1,
    requiredDate: (new Date()),
    requiredEmail: "test123@sub.example.edu",
    requiredUrl: "http://google.com",
    requiredObject: {
      requiredNumber: 1
    },
    optionalObject: {
      requiredString: "test"
    }
  });
  test.equal(sc.invalidKeys(), []);

  sc = validate(ssr, {
    requiredString: "test",
    requiredBoolean: true,
    requiredNumber: 1,
    requiredDate: (new Date()),
    requiredEmail: "test123@sub.example.edu",
    requiredUrl: "http://google.com",
    requiredObject: {
      requiredNumber: 1
    },
  });
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Required Checks - Insert - Invalid", function(test) {
  var sc = validateNoClean(ssr, {});
  test.length(sc.invalidKeys(), 8);

  sc = validateNoClean(ssr, {
    requiredString: null,
    requiredBoolean: null,
    requiredNumber: null,
    requiredDate: null,
    requiredEmail: null,
    requiredUrl: null,
    requiredObject: null,
    optionalObject: {
      requiredString: null
    }
  });
  test.length(sc.invalidKeys(), 9);

  sc = validateNoClean(ssr, {
    requiredString: null,
    requiredBoolean: null,
    requiredNumber: null,
    requiredDate: null,
    requiredEmail: null,
    requiredUrl: null,
    requiredObject: null,
    optionalObject: {}
  });
  test.length(sc.invalidKeys(), 9);

  sc = validateNoClean(ssr, {
    requiredString: null,
    requiredBoolean: null,
    requiredNumber: null,
    requiredDate: null,
    requiredEmail: null,
    requiredUrl: null,
    requiredObject: null,
    optionalObject: null
  });
  // we should not get an error about optionalObject.requiredString because the whole object is null
  test.length(sc.invalidKeys(), 8);

  sc = validateNoClean(ssr, {
    requiredString: null,
    requiredBoolean: null,
    requiredNumber: null,
    requiredDate: null,
    requiredEmail: null,
    requiredUrl: null,
    requiredObject: null
  });
  // we should not get an error about optionalObject.requiredString because the whole object is missing
  test.length(sc.invalidKeys(), 8);

  sc = validateNoClean(ssr, {
    requiredString: void 0,
    requiredBoolean: void 0,
    requiredNumber: void 0,
    requiredDate: void 0,
    requiredEmail: void 0,
    requiredUrl: void 0,
    requiredObject: void 0,
    optionalObject: {
      requiredString: void 0
    }
  });
  test.length(sc.invalidKeys(), 9);

  sc = validateNoClean(ssr, {
    requiredString: "",
    requiredBoolean: null,
    requiredNumber: null,
    requiredDate: null,
    requiredEmail: null,
    requiredUrl: null,
    requiredObject: null,
    optionalObject: {
      requiredString: ""
    }
  });
  test.length(sc.invalidKeys(), 7);

  sc = validateNoClean(ssr, {
    requiredString: "   ",
    requiredBoolean: null,
    requiredNumber: null,
    requiredDate: null,
    requiredEmail: null,
    requiredUrl: null,
    requiredObject: null,
    optionalObject: {
      requiredString: "   "
    }
  });
  test.length(sc.invalidKeys(), 7);

  //array of objects
  sc = validateNoClean(friends, {
    friends: [{name: 'Bob'}],
    enemies: [{}]
  });
  test.length(sc.invalidKeys(), 2);
});

/*
 * Upserts should be validated more like inserts because they might be an insert
 */

Tinytest.add("SimpleSchema - Required Checks - Upsert - Valid - $set", function(test) {
  var sc = validate(ssr, {$set: {
      requiredString: "test",
      requiredBoolean: true,
      requiredNumber: 1,
      requiredDate: (new Date()),
      requiredEmail: "test123@sub.example.edu",
      requiredUrl: "http://google.com",
      requiredObject: {
        requiredNumber: 1
      },
      optionalObject: {
        requiredString: "test"
      }
    }}, true, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ssr, {$set: {
      requiredString: "test",
      requiredBoolean: true,
      requiredNumber: 1,
      requiredDate: (new Date()),
      requiredEmail: "test123@sub.example.edu",
      requiredUrl: "http://google.com",
      requiredObject: {
        requiredNumber: 1
      },
      'optionalObject.requiredString': "test"
    }}, true, true);
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Required Checks - Upsert - Valid - $setOnInsert", function(test) {
  var sc = validate(ssr, {$setOnInsert: {
      requiredString: "test",
      requiredBoolean: true,
      requiredNumber: 1,
      requiredDate: (new Date()),
      requiredEmail: "test123@sub.example.edu",
      requiredUrl: "http://google.com",
      requiredObject: {
        requiredNumber: 1
      },
      optionalObject: {
        requiredString: "test"
      }
    }}, true, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ssr, {$setOnInsert: {
      requiredString: "test",
      requiredBoolean: true,
      requiredNumber: 1,
      requiredDate: (new Date()),
      requiredEmail: "test123@sub.example.edu",
      requiredUrl: "http://google.com",
      requiredObject: {
        requiredNumber: 1
      },
      'optionalObject.requiredString': "test"
    }}, true, true);
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Required Checks - Upsert - Valid - Combined", function(test) {
  //some in $set and some in $setOnInsert, make sure they're merged for validation purposes
  var ssrCon = validate(ssr, {
    $set: {
      requiredString: "test",
      requiredBoolean: true,
      requiredNumber: 1,
      requiredDate: (new Date())
    },
    $setOnInsert: {
      requiredEmail: "test123@sub.example.edu",
      requiredUrl: "http://google.com",
      requiredObject: {
        requiredNumber: 1
      },
      'optionalObject.requiredString': "test"
    }
  }, true, true);
  test.length(ssrCon.invalidKeys(), 0);

  ssrCon = validate(ssr, {
    $set: {
      requiredString: "test",
      requiredBoolean: true,
      requiredNumber: 1,
      requiredDate: (new Date())
    },
    $setOnInsert: {
      requiredEmail: "test123@sub.example.edu",
      requiredUrl: "http://google.com",
      requiredObject: {
        requiredNumber: 1
      },
      'optionalObject.requiredString': "test"
    }
  }, true, true);
  test.length(ssrCon.invalidKeys(), 0);
});

Tinytest.add("SimpleSchema - Required Checks - Upsert - Invalid - $set", function(test) {
  var sc = validateNoClean(ssr, {$set: {}}, true, true, true);
  test.length(sc.invalidKeys(), 8);

  // should be no different with some missing
  sc = validateNoClean(ssr, {$set: {
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'optionalObject.requiredString': null
    }}, true, true, true);
  test.length(sc.invalidKeys(), 9);

  sc = validateNoClean(ssr, {$set: {
      requiredString: null,
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'optionalObject.requiredString': null
    }}, true, true, true);
  test.length(sc.invalidKeys(), 9);

  sc = validateNoClean(ssr, {$set: {
      requiredString: void 0,
      requiredBoolean: void 0,
      requiredNumber: void 0,
      requiredDate: void 0,
      requiredEmail: void 0,
      requiredUrl: void 0,
      requiredObject: void 0,
      'optionalObject.requiredString': void 0
    }}, true, true, true);
  test.length(sc.invalidKeys(), 9);

  sc = validateNoClean(ssr, {$set: {
      requiredString: "",
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'optionalObject.requiredString': ""
    }}, true, true, true);
  test.length(sc.invalidKeys(), 7);

  sc = validateNoClean(ssr, {$set: {
      requiredString: "   ",
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'optionalObject.requiredString': "   "
    }}, true, true, true);
  test.length(sc.invalidKeys(), 7);
});

Tinytest.add("SimpleSchema - Required Checks - Upsert - Invalid - $setOnInsert", function(test) {
  var sc = validateNoClean(ssr, {$setOnInsert: {}}, true, true, true);
  test.length(sc.invalidKeys(), 8);

  sc = validateNoClean(ssr, {$setOnInsert: {
      requiredString: null,
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'optionalObject.requiredString': null
    }}, true, true, true);
  test.length(sc.invalidKeys(), 9);

  sc = validateNoClean(ssr, {$setOnInsert: {
      requiredString: void 0,
      requiredBoolean: void 0,
      requiredNumber: void 0,
      requiredDate: void 0,
      requiredEmail: void 0,
      requiredUrl: void 0,
      requiredObject: void 0,
      'optionalObject.requiredString': void 0
    }}, true, true, true);
  test.length(sc.invalidKeys(), 9);

  sc = validateNoClean(ssr, {$setOnInsert: {
      requiredString: "",
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'optionalObject.requiredString': ""
    }}, true, true, true);
  test.length(sc.invalidKeys(), 7);

  sc = validateNoClean(ssr, {$setOnInsert: {
      requiredString: "   ",
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'optionalObject.requiredString': "   "
    }}, true, true, true);
  test.length(sc.invalidKeys(), 7);

  //array of objects
  sc = validateNoClean(friends, {$setOnInsert: {
      friends: [{name: 'Bob'}],
      enemies: []
    }}, true, true, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Required Checks - Upsert - Invalid - Combined", function(test) {
  //some in $set and some in $setOnInsert, make sure they're merged for validation purposes

  var sc = validateNoClean(ssr, {$setOnInsert: {}, $set: {}}, true, true, true);
  test.length(sc.invalidKeys(), 8);

  sc = validateNoClean(ssr, {
    $set: {
      requiredString: null,
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null
    },
    $setOnInsert: {
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'optionalObject.requiredString': null
    }
  }, true, true, true);
  test.length(sc.invalidKeys(), 9);

  sc = validateNoClean(ssr, {
    $set: {
      requiredString: void 0,
      requiredBoolean: void 0,
      requiredNumber: void 0,
      requiredDate: void 0
    },
    $setOnInsert: {
      requiredEmail: void 0,
      requiredUrl: void 0,
      requiredObject: void 0,
      'optionalObject.requiredString': void 0
    }
  }, true, true, true);
  test.length(sc.invalidKeys(), 9);

  sc = validateNoClean(ssr, {
    $set: {
      requiredString: "",
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null
    },
    $setOnInsert: {
      requiredEmail: "",
      requiredUrl: "",
      requiredObject: null,
      'optionalObject.requiredString': ""
    }
  }, true, true, true);
  var requiredErrorCount = _.reduce(sc.invalidKeys(), function (memo, errorObj) {
    if (errorObj.type === "required") {
      memo++;
    }
    return memo;
  }, 0);
  test.equal(requiredErrorCount, 5);
  var regExErrorCount = _.reduce(sc.invalidKeys(), function (memo, errorObj) {
    if (errorObj.type === "regEx") {
      memo++;
    }
    return memo;
  }, 0);
  test.equal(regExErrorCount, 2);

  sc = validateNoClean(ssr, {
    $set: {
      requiredString: "   ",
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null
    },
    $setOnInsert: {
      requiredEmail: "   ",
      requiredUrl: "   ",
      requiredObject: null,
      'optionalObject.requiredString': "   "
    }
  }, true, true, true);
  requiredErrorCount = _.reduce(sc.invalidKeys(), function (memo, errorObj) {
    if (errorObj.type === "required") {
      memo++;
    }
    return memo;
  }, 0);
  test.equal(requiredErrorCount, 5);
  regExErrorCount = _.reduce(sc.invalidKeys(), function (memo, errorObj) {
    if (errorObj.type === "regEx") {
      memo++;
    }
    return memo;
  }, 0);
  test.equal(regExErrorCount, 2);
});

Tinytest.add("SimpleSchema - Required Checks - Update - Valid - $set", function(test) {
  var sc = validateNoClean(ssr, {$set: {}}, true);
  test.equal(sc.invalidKeys(), []); //would not cause DB changes, so should not be an error

  sc = validateNoClean(ssr, {$set: {
      requiredString: "test",
      requiredBoolean: true,
      requiredNumber: 1,
      requiredDate: (new Date()),
      requiredEmail: "test123@sub.example.edu",
      requiredUrl: "http://google.com",
      'requiredObject.requiredNumber': 1,
      'optionalObject.requiredString': "test"
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validateNoClean(ssr, {$set: {
      requiredString: "test",
      requiredBoolean: true,
      requiredNumber: 1,
      requiredDate: (new Date()),
      requiredEmail: "test123@sub.example.edu",
      requiredUrl: "http://google.com",
      requiredObject: {
        requiredNumber: 1
      },
      'optionalObject.requiredString': "test"
    }}, true);
  test.equal(sc.invalidKeys(), []);

  //array of objects
  sc = validateNoClean(friends, {$set: {
      'friends.1.name': "Bob"
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validateNoClean(friends, {$set: {
      friends: [{name: 'Bob', type: 'good'}]
    }}, true);
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Required Checks - Update - Invalid - $set", function(test) {
  function t(s, obj, errors) {
    var sc = validateNoClean(s, obj, true);
    test.length(sc.invalidKeys(), errors);
  }

  // MongoDB will set the props to `undefined`
  t(ssr, {$set: {
    requiredString: void 0,
    requiredBoolean: void 0,
    requiredNumber: void 0,
    requiredDate: void 0,
    requiredEmail: void 0,
    requiredUrl: void 0,
    requiredObject: void 0,
    'optionalObject.requiredString': void 0
  }}, 9);

  t(ssr, {$set: {
    requiredString: null,
    requiredBoolean: null,
    requiredNumber: null,
    requiredDate: null,
    requiredEmail: null,
    requiredUrl: null,
    requiredObject: null,
    'optionalObject.requiredString': null
  }}, 9);

  t(ssr, {$set: {
    requiredString: "",
    requiredBoolean: null,
    requiredNumber: null,
    requiredDate: null,
    requiredEmail: null,
    requiredUrl: null,
    requiredObject: null,
    'optionalObject.requiredString': ""
  }}, 7);

  t(ssr, {$set: {
    requiredString: "   ",
    requiredBoolean: null,
    requiredNumber: null,
    requiredDate: null,
    requiredEmail: null,
    requiredUrl: null,
    requiredObject: null,
    'optionalObject.requiredString': "   "
  }}, 7);

  //array of objects

  //name is required
  t(friends, {$set: {
    'friends.1.name': null
  }}, 1);

  //type is required
  t(friends, {$set: {
    friends: [{name: 'Bob'}]
  }}, 1);
});

Tinytest.add("SimpleSchema - Required Checks - Update - Valid - $unset", function(test) {
  var sc = validateNoClean(ssr, {$unset: {}}, true);
  test.equal(sc.invalidKeys(), []); //would not cause DB changes, so should not be an error

  //make sure an optional can be unset when others are required
  //retest with various values to be sure the value is ignored
  sc = validateNoClean(ssr, {$unset: {
      anOptionalOne: 1
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validateNoClean(ssr, {$unset: {
      anOptionalOne: null
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validateNoClean(ssr, {$unset: {
      anOptionalOne: ""
    }}, true);
  test.equal(sc.invalidKeys(), []);

  //array of objects
  sc = validateNoClean(friends, {$unset: {
      'friends.1.a.b': ""
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validateNoClean(friends, {$unset: {
      'friends.1.a.b': 1,
      'friends.2.a.b': 1,
      'friends.3.a.b': 1
    }}, true);
  test.equal(sc.invalidKeys(), []);

});

Tinytest.add("SimpleSchema - Required Checks - Update - Invalid - $unset", function(test) {
  var sc = validateNoClean(ssr, {$unset: {
      requiredString: 1,
      requiredBoolean: 1,
      requiredNumber: 1,
      requiredDate: 1,
      requiredEmail: 1,
      requiredUrl: 1
    }}, true);
  test.length(sc.invalidKeys(), 6);

  //array of objects
  sc = validateNoClean(friends, {$unset: {
      'friends.1.name': 1
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validateNoClean(friends, {$unset: {
      'friends.1.name': 1,
      'friends.2.name': 1,
      'friends.3.name': 1
    }}, true);
  test.length(sc.invalidKeys(), 3);
});

Tinytest.add("SimpleSchema - Required Checks - Update - Valid - $rename", function(test) {
  //rename from optional key to another key in schema
  var sc = ss.newContext();
  sc.validate({$rename: {string: "minMaxString"}}, {modifier: true});
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Required Checks - Update - Invalid - $rename", function(test) {
  //rename from optional key to a key not in schema
  var sc = ss.newContext();
  sc.validate({$rename: {string: "newString"}}, {modifier: true});
  test.equal(sc.invalidKeys()[0].type, "keyNotInSchema");

  //rename from required key
  sc = ssr.newContext();
  sc.validate({$rename: {requiredString: "newRequiredString"}}, {modifier: true});
  test.equal(sc.invalidKeys()[0].type, "required");
});

Tinytest.add("SimpleSchema - Type Checks - Insert", function(test) {
  var sc = validate(ss, {
    string: "test",
    boolean: true,
    number: 1,
    decimal: 1.1,
    date: (new Date()),
    url: "http://google.com",
    email: "test123@sub.example.edu"
  });
  test.equal(sc.invalidKeys(), []);
  /* STRING FAILURES */

  //boolean string failure
  var sc2 = ss.newContext();
  sc2.validate({
    string: true
  });
  test.length(sc2.invalidKeys(), 1); //without typeconvert

  sc = validate(ss, {
    string: true
  });
  test.equal(sc.invalidKeys(), []); //with typeconvert

  //number string failure
  sc2.validate({
    string: 1
  });
  test.length(sc2.invalidKeys(), 1); //without typeconvert

  sc = validate(ss, {
    string: 1
  });
  test.equal(sc.invalidKeys(), []); //with typeconvert

  //object string failure
  sc2.validate({
    string: {test: "test"}
  });
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {
    string: {test: "test"}
  });
  test.length(sc.invalidKeys(), 1); //with filter

  //array string failure
  sc2.validate({
    string: ["test"]
  });
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {
    string: ["test"]
  });
  test.length(sc.invalidKeys(), 1); //with filter

  //instance string failure
  sc2.validate({
    string: (new Date())
  });
  test.length(sc2.invalidKeys(), 1); //without filter

  sc = validate(ss, {
    string: (new Date())
  });
  test.equal(sc.invalidKeys(), []); //with filter

  /* BOOLEAN FAILURES */

  //string bool failure
  sc = validate(ss, {
    boolean: "test"
  });
  test.length(sc.invalidKeys(), 1);

  //number bool failure
  sc = validate(ss, {
    boolean: 1
  });
  test.length(sc.invalidKeys(), 1);

  //object bool failure
  sc2.validate({
    boolean: {test: "test"}
  });
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {
    boolean: {test: "test"}
  });
  test.length(sc.invalidKeys(), 1); //with filter

  //array bool failure
  sc2.validate({
    boolean: ["test"]
  });
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {
    boolean: ["test"]
  });
  test.length(sc.invalidKeys(), 1); //with filter

  //instance bool failure
  sc = validate(ss, {
    boolean: (new Date())
  });
  test.length(sc.invalidKeys(), 1);

  /* NUMBER FAILURES */

  //string number failure
  sc = validate(ss, {
    number: "test"
  });
  test.length(sc.invalidKeys(), 1);

  //boolean number failure
  sc = validate(ss, {
    number: true
  });
  test.length(sc.invalidKeys(), 1);

  //object number failure
  sc2.validate({
    number: {test: "test"}
  });
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {
    number: {test: "test"}
  });
  test.length(sc.invalidKeys(), 1); //with filter

  //array number failure
  sc2.validate({
    number: ["test"]
  });
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {
    number: ["test"]
  });
  test.length(sc.invalidKeys(), 1); //with filter

  //instance number failure
  sc = validate(ss, {
    number: (new Date())
  });
  test.length(sc.invalidKeys(), 1);

  //decimal number failure
  sc = validate(ss, {
    number: 1.1
  });
  test.length(sc.invalidKeys(), 1);

  //isNaN number failure
  sc = validate(ss, {
    number: NaN
  });
  test.length(sc.invalidKeys(), 1);

  /* INSTANCE FAILURES */

  //string date failure
  sc = validate(ss, {
    date: "test"
  });
  test.length(sc.invalidKeys(), 1);

  //boolean date failure
  sc = validate(ss, {
    date: true
  });
  test.length(sc.invalidKeys(), 1);

  //invalid date failure
  sc = validate(ss, {
    date: new Date('foo')
  });
  test.length(sc.invalidKeys(), 1);

  //object date failure
  sc2.validate({
    date: {test: "test"}
  });
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {
    date: {test: "test"}
  });
  test.length(sc.invalidKeys(), 1); //with filter

  //array date failure
  sc2.validate({
    date: ["test"]
  });
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {
    date: ["test"]
  });
  test.length(sc.invalidKeys(), 1); //with filter

  /* REGEX FAILURES */

  sc = validate(ss, {
    url: "blah"
  });
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {
    email: "blah"
  });
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Type Checks - Upsert", function(test) {
  //should validate the same as insert

  var sc = validate(ss, {$setOnInsert: {
      string: "test",
      boolean: true,
      number: 1,
      decimal: 1.1,
      date: (new Date()),
      url: "http://google.com",
      email: "test123@sub.example.edu"
    }}, true, true);
  test.equal(sc.invalidKeys(), []);
  /* STRING FAILURES */

  //boolean string failure
  var sc2 = ss.newContext();
  sc2.validate({$setOnInsert: {
      string: true
    }}, {modifier: true, upsert: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 1); //without typeconvert

  sc = validate(ss, {$setOnInsert: {
      string: true
    }}, true, true);
  test.equal(sc.invalidKeys(), []); //with typeconvert

  //number string failure
  sc2.validate({$setOnInsert: {
      string: 1
    }}, {modifier: true, upsert: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 1); //without typeconvert

  sc = validate(ss, {$setOnInsert: {
      string: 1
    }}, true, true);
  test.equal(sc.invalidKeys(), []); //with typeconvert

  //object string failure
  sc2.validate({$setOnInsert: {
      string: {test: "test"}
    }}, {modifier: true, upsert: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {$setOnInsert: {
      string: {test: "test"}
    }}, true, true);
  test.length(sc.invalidKeys(), 1); //with filter

  //array string failure
  sc2.validate({$setOnInsert: {
      string: ["test"]
    }}, {modifier: true, upsert: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {$setOnInsert: {
      string: ["test"]
    }}, true, true);
  test.length(sc.invalidKeys(), 1); //with filter

  //instance string failure
  sc2.validate({$setOnInsert: {
      string: (new Date())
    }}, {modifier: true, upsert: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 1); //without typeconvert

  sc = validate(ss, {$setOnInsert: {
      string: (new Date())
    }}, true, true);
  test.equal(sc.invalidKeys(), []); //with typeconvert

  /* BOOLEAN FAILURES */

  //string bool failure
  sc = validate(ss, {$setOnInsert: {
      boolean: "test"
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  //number bool failure
  sc = validate(ss, {$setOnInsert: {
      boolean: 1
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  //object bool failure
  sc2.validate({$setOnInsert: {
      boolean: {test: "test"}
    }}, {modifier: true, upsert: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {$setOnInsert: {
      boolean: {test: "test"}
    }}, true, true);
  test.length(sc.invalidKeys(), 1); //with filter

  //array bool failure
  sc2.validate({$setOnInsert: {
      boolean: ["test"]
    }}, {modifier: true, upsert: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {$setOnInsert: {
      boolean: ["test"]
    }}, true, true);
  test.length(sc.invalidKeys(), 1); //with filter

  //instance bool failure
  sc = validate(ss, {$setOnInsert: {
      boolean: (new Date())
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  /* NUMBER FAILURES */

  //string number failure
  sc = validate(ss, {$setOnInsert: {
      number: "test"
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  //boolean number failure
  sc = validate(ss, {$setOnInsert: {
      number: true
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  //object number failure
  sc2.validate({$setOnInsert: {
      number: {test: "test"}
    }}, {modifier: true, upsert: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {$setOnInsert: {
      number: {test: "test"}
    }}, true, true);
  test.length(sc.invalidKeys(), 1); //with filter

  //array number failure
  sc2.validate({$setOnInsert: {
      number: ["test"]
    }}, {modifier: true, upsert: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {$setOnInsert: {
      number: ["test"]
    }}, true, true);
  test.length(sc.invalidKeys(), 1); //with filter

  //instance number failure
  sc = validate(ss, {$setOnInsert: {
      number: (new Date())
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  //decimal number failure
  sc = validate(ss, {$setOnInsert: {
      number: 1.1
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  /* INSTANCE FAILURES */

  //string date failure
  sc = validate(ss, {$setOnInsert: {
      date: "test"
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  //boolean date failure
  sc = validate(ss, {$setOnInsert: {
      date: true
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  //object date failure
  sc2.validate({$setOnInsert: {
      date: {test: "test"}
    }}, {modifier: true, upsert: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {$setOnInsert: {
      date: {test: "test"}
    }}, true, true);
  test.length(sc.invalidKeys(), 1); //with filter

  //array date failure
  sc2.validate({$setOnInsert: {
      date: ["test"]
    }}, {modifier: true, upsert: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {$setOnInsert: {
      date: ["test"]
    }}, true, true);
  test.length(sc.invalidKeys(), 1); //with filter

  /* REGEX FAILURES */

  sc = validate(ss, {$setOnInsert: {
      url: "blah"
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {$setOnInsert: {
      email: "blah"
    }}, true, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Type Checks - Update", function(test) {
  var sc = validate(ss, {$set: {
      string: "test",
      boolean: true,
      number: 1,
      date: (new Date()),
      url: "http://google.com",
      email: "test123@sub.example.edu"
    }}, true);
  test.equal(sc.invalidKeys(), []);

  /* STRING FAILURES */

  //boolean string failure
  var sc2 = ss.newContext();
  sc2.validate({$set: {
      string: true
    }}, {modifier: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 1); //without typeconvert

  sc = validate(ss, {$set: {
      string: true
    }}, true);
  test.equal(sc.invalidKeys(), []); //with typeconvert

  //number string failure
  sc2.validate({$set: {
      string: 1
    }}, {modifier: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 1); //without typeconvert

  sc = validate(ss, {$set: {
      string: 1
    }}, true);
  test.equal(sc.invalidKeys(), []); //with typeconvert

  //object string failure
  sc2.validate({$set: {
      string: {test: "test"}
    }}, {modifier: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {$set: {
      string: {test: "test"}
    }}, true, true);
  test.length(sc.invalidKeys(), 1); //with filter

  //array string failure
  sc2.validate({$set: {
      string: ["test"]
    }}, {modifier: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {$set: {
      string: ["test"]
    }}, true);
  test.length(sc.invalidKeys(), 1); //with filter

  //instance string failure
  sc2.validate({$set: {
      string: (new Date())
    }}, {modifier: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 1); //without typeconvert

  sc = validate(ss, {$set: {
      string: (new Date())
    }}, true);
  test.equal(sc.invalidKeys(), []); //with typeconvert

  /* BOOLEAN FAILURES */

  //string bool failure
  sc = validate(ss, {$set: {
      boolean: "test"
    }}, true);
  test.length(sc.invalidKeys(), 1);

  //number bool failure
  sc = validate(ss, {$set: {
      boolean: 1
    }}, true);
  test.length(sc.invalidKeys(), 1);

  //object bool failure
  sc2.validate({$set: {
      boolean: {test: "test"}
    }}, {modifier: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {$set: {
      boolean: {test: "test"}
    }}, true, true);
  test.length(sc.invalidKeys(), 1); //with filter

  //array bool failure
  sc2.validate({$set: {
      boolean: ["test"]
    }}, {modifier: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {$set: {
      boolean: ["test"]
    }}, true);
  test.length(sc.invalidKeys(), 1); //with filter

  //instance bool failure
  sc = validate(ss, {$set: {
      boolean: (new Date())
    }}, true);
  test.length(sc.invalidKeys(), 1);

  /* NUMBER FAILURES */

  //string number failure
  sc = validate(ss, {$set: {
      number: "test"
    }}, true);
  test.length(sc.invalidKeys(), 1);

  //boolean number failure
  sc = validate(ss, {$set: {
      number: true
    }}, true);
  test.length(sc.invalidKeys(), 1);

  //object number failure
  sc2.validate({$set: {
      number: {test: "test"}
    }}, {modifier: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {$set: {
      number: {test: "test"}
    }}, true, true);
  test.length(sc.invalidKeys(), 1); //with filter

  //array number failure
  sc2.validate({$set: {
      number: ["test"]
    }}, {modifier: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {$set: {
      number: ["test"]
    }}, true);
  test.length(sc.invalidKeys(), 1); //with filter

  //instance number failure
  sc = validate(ss, {$set: {
      number: (new Date())
    }}, true);
  test.length(sc.invalidKeys(), 1);

  //sub objects
  sc = validate(ss, {$set: {
      'sub.number': 29
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ss, {$set: {
      sub: {number: 29}
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ss, {$set: {
      sub: {number: true}
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc2.validate({$set: {
      sub: {number: [29]}
    }}, {modifier: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {$set: {
      sub: {number: [29]}
    }}, true);
  test.length(sc.invalidKeys(), 1); //with filter

  /* INSTANCE FAILURES */

  //string date failure
  sc = validate(ss, {$set: {
      date: "test"
    }}, true);
  test.length(sc.invalidKeys(), 1);

  //boolean date failure
  sc = validate(ss, {$set: {
      date: true
    }}, true);
  test.length(sc.invalidKeys(), 1);

  //object date failure
  sc2.validate({$set: {
      date: {test: "test"}
    }}, {modifier: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {$set: {
      date: {test: "test"}
    }}, true, true);
  test.length(sc.invalidKeys(), 1); //with filter

  //array date failure
  sc2.validate({$set: {
      date: ["test"]
    }}, {modifier: true, filter: false, autoConvert: false});
  test.length(sc2.invalidKeys(), 2); //without filter

  sc = validate(ss, {$set: {
      date: ["test"]
    }}, true);
  test.length(sc.invalidKeys(), 1); //with filter

  /* REGEX FAILURES */

  sc = validate(ss, {$set: {
      url: "blah"
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {$set: {
      email: "blah"
    }}, true);
  test.length(sc.invalidKeys(), 1);

  /* ARRAY FAILURES */

  sc = validate(ss, {$set: {
      booleanArray: true,
      dateArray: new Date(),
      allowedStringsArray: "tuna",
      allowedNumbersArray: 2
    }}, true);
  test.length(sc.invalidKeys(), 4);

  sc = validate(ss, {$push: {
      booleanArray: "blah",
      dateArray: "blah",
      allowedStringsArray: "blah",
      allowedNumbersArray: 200
    }}, true);
  test.length(sc.invalidKeys(), 4);

  sc = validate(ss, {$addToSet: {
      booleanArray: "blah",
      dateArray: "blah",
      allowedStringsArray: "blah",
      allowedNumbersArray: 200
    }}, true);
  test.length(sc.invalidKeys(), 4);

  //these should work
  sc = validate(ss, {$set: {
      booleanArray: [true],
      dateArray: [new Date()],
      allowedStringsArray: ["tuna"],
      allowedNumbersArray: [2]
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ss, {$push: {
      booleanArray: true,
      dateArray: new Date(),
      allowedStringsArray: "tuna",
      allowedNumbersArray: 2
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ss, {$addToSet: {
      booleanArray: true,
      dateArray: new Date(),
      allowedStringsArray: "tuna",
      allowedNumbersArray: 2
    }}, true);
  test.equal(sc.invalidKeys(), []);

  //$each with both invalid
  sc = validate(ss, {$push: {
      booleanArray: {$each: ["foo", "bar"]},
      dateArray: {$each: ["foo", "bar"]},
      allowedStringsArray: {$each: ["foo", "bar"]},
      allowedNumbersArray: {$each: [200, 500]}
    }}, true);
  test.length(sc.invalidKeys(), 8);

  sc = validate(ss, {$addToSet: {
      booleanArray: {$each: ["foo", "bar"]},
      dateArray: {$each: ["foo", "bar"]},
      allowedStringsArray: {$each: ["foo", "bar"]},
      allowedNumbersArray: {$each: [200, 500]}
    }}, true);
  test.length(sc.invalidKeys(), 8);

  //$each with one valid and one invalid
  sc = validate(ss, {$push: {
      booleanArray: {$each: ["foo", true]},
      dateArray: {$each: ["foo", (new Date())]},
      allowedStringsArray: {$each: ["foo", "tuna"]},
      allowedNumbersArray: {$each: [200, 1]}
    }}, true);
  test.length(sc.invalidKeys(), 4);

  sc = validate(ss, {$addToSet: {
      booleanArray: {$each: ["foo", true]},
      dateArray: {$each: ["foo", (new Date())]},
      allowedStringsArray: {$each: ["foo", "tuna"]},
      allowedNumbersArray: {$each: [200, 1]}
    }}, true);
  test.length(sc.invalidKeys(), 4);

  //$each with both valid
  sc = validate(ss, {$push: {
      booleanArray: {$each: [false, true]},
      dateArray: {$each: [(new Date()), (new Date())]},
      allowedStringsArray: {$each: ["tuna", "fish"]},
      allowedNumbersArray: {$each: [2, 1]}
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ss, {$addToSet: {
      booleanArray: {$each: [false, true]},
      dateArray: {$each: [(new Date()), (new Date())]},
      allowedStringsArray: {$each: ["tuna", "fish"]},
      allowedNumbersArray: {$each: [2, 1]}
    }}, true);
  test.equal(sc.invalidKeys(), []);

  //make sure slice is ignored
  sc = validate(ss, {$push: {
      booleanArray: {$each: [false, true], $slice: -5},
      dateArray: {$each: [(new Date()), (new Date())], $slice: -5},
      allowedStringsArray: {$each: ["tuna", "fish"], $slice: -5},
      allowedNumbersArray: {$each: [2, 1], $slice: -5}
    }}, true);
  test.equal(sc.invalidKeys(), []);

  //pull, pullAll, and pop should be ignored; no validation
  sc = validate(ss, {$pull: {
      booleanArray: "foo",
      dateArray: "foo",
      allowedStringsArray: "foo",
      allowedNumbersArray: 200
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ss, {$pull: {
      booleanArray: {$each: ["foo", "bar"]},
      dateArray: {$each: ["foo", "bar"]},
      allowedStringsArray: {$each: ["foo", "bar"]},
      allowedNumbersArray: {$each: [200, 500]}
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ss, {$pullAll: {
      booleanArray: ["foo", "bar"],
      dateArray: ["foo", "bar"],
      allowedStringsArray: ["foo", "bar"],
      allowedNumbersArray: [200, 500]
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ss, {$pop: {
      booleanArray: 1,
      dateArray: 1,
      allowedStringsArray: 1,
      allowedNumbersArray: 1
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ss, {$pop: {
      booleanArray: -1,
      dateArray: -1,
      allowedStringsArray: -1,
      allowedNumbersArray: -1
    }}, true);
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Minimum Checks - Insert", function(test) {
  /* STRING LENGTH */
  var sc = validate(ss, {
    minMaxString: "longenough"
  });
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    minMaxString: "short"
  });
  test.length(sc.invalidKeys(), 1);
  /* NUMBER */
  sc = validate(ss, {
    minMaxNumberExclusive: 20 
  });
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {
    minMaxNumberExclusive: 10
  });
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {
    minMaxNumberInclusive: 20
  });
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    minMaxNumberInclusive: 10
  });
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    minMaxNumber: 10
  });
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    minMaxNumber: 9
  });
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {
    minMaxNumberCalculated: 10
  });
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    minMaxNumberCalculated: 9
  });
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {
    minZero: -1
  });
  test.length(sc.invalidKeys(), 1);

  /* DATE */
  sc = validate(ss, {
    minMaxDate: (new Date(Date.UTC(2013, 0, 1)))
  });
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    minMaxDate: (new Date(Date.UTC(2012, 11, 31)))
  });
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {
    minMaxDateCalculated: (new Date(Date.UTC(2013, 0, 1)))
  });
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    minMaxDateCalculated: (new Date(Date.UTC(2012, 11, 31)))
  });
  test.length(sc.invalidKeys(), 1);

  /* ARRAY COUNT PLUS STRING LENGTH */

  sc = validate(ss, {
    minMaxStringArray: ["longenough", "longenough"]
  });
  test.equal(sc.invalidKeys(), []);

  sc = validate(ss, {
    minMaxStringArray: ["short", "short"]
  });
  test.length(sc.invalidKeys(), 2);

  sc = validate(ss, {
    minMaxStringArray: []
  });
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Minimum Checks - Upsert", function(test) {
  /* STRING LENGTH */
  var sc = validate(ss, {$setOnInsert: {
      minMaxString: "longenough"
    }}, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$setOnInsert: {
      minMaxString: "short"
    }}, true, true);
  test.length(sc.invalidKeys(), 1);
  /* NUMBER */
  sc = validate(ss, {$setOnInsert: {
      minMaxNumber: 10
    }}, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$setOnInsert: {
      minMaxNumber: 9
    }}, true, true);
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {$setOnInsert: {
      minMaxNumberCalculated: 10
    }}, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$setOnInsert: {
      minMaxNumberCalculated: 9
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {$setOnInsert: {
      minZero: -1
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  /* DATE */
  sc = validate(ss, {$setOnInsert: {
      minMaxDate: (new Date(Date.UTC(2013, 0, 1)))
    }}, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$setOnInsert: {
      minMaxDate: (new Date(Date.UTC(2012, 11, 31)))
    }}, true, true);
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {$setOnInsert: {
      minMaxDateCalculated: (new Date(Date.UTC(2013, 0, 1)))
    }}, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$setOnInsert: {
      minMaxDateCalculated: (new Date(Date.UTC(2012, 11, 31)))
    }}, true, true);
  test.length(sc.invalidKeys(), 1);
  /* ARRAY COUNT PLUS STRING LENGTH */
  sc = validate(ss, {$setOnInsert: {
      minMaxStringArray: ["longenough", "longenough"]
    }}, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$setOnInsert: {
      minMaxStringArray: ["short", "short"]
    }}, true, true);
  test.length(sc.invalidKeys(), 2);
  sc = validate(ss, {$setOnInsert: {
      minMaxStringArray: []
    }}, true, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Minimum Checks - Update", function(test) {
  /* STRING LENGTH */
  var sc = validate(ss, {$set: {
      minMaxString: "longenough"
    }}, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$set: {
      minMaxString: "short"
    }}, true);
  test.length(sc.invalidKeys(), 1);
  /* NUMBER */
  sc = validate(ss, {$set: {
      minMaxNumber: 10
    }}, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$set: {
      minMaxNumber: 9
    }}, true);
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {$set: {
      minMaxNumberCalculated: 10
    }}, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$set: {
      minMaxNumberCalculated: 9
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {$set: {
      minZero: -1
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {$inc: {
      minZero: -5
    }}, true);
  // Should not be invalid because we don't know what we're starting from
  test.length(sc.invalidKeys(), 0);

  /* DATE */
  sc = validate(ss, {$set: {
      minMaxDate: (new Date(Date.UTC(2013, 0, 1)))
    }}, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$set: {
      minMaxDate: (new Date(Date.UTC(2012, 11, 31)))
    }}, true);
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {$set: {
      minMaxDateCalculated: (new Date(Date.UTC(2013, 0, 1)))
    }}, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$set: {
      minMaxDateCalculated: (new Date(Date.UTC(2012, 11, 31)))
    }}, true);
  test.length(sc.invalidKeys(), 1);
  /* ARRAY COUNT PLUS STRING LENGTH */
  sc = validate(ss, {$set: {
      minMaxStringArray: ["longenough", "longenough"]
    }}, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$set: {
      minMaxStringArray: ["short", "short"]
    }}, true);
  test.length(sc.invalidKeys(), 2);
  sc = validate(ss, {$set: {
      minMaxStringArray: []
    }}, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Maximum Checks - Insert", function(test) {
  /* STRING LENGTH */
  var sc = validate(ss, {
    minMaxString: "nottoolongnottoolong"
  });
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    minMaxString: "toolongtoolongtoolong"
  });
  test.length(sc.invalidKeys(), 1);
  /* NUMBER */
  sc = validate(ss, {
    minMaxNumber: 20
  });
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    minMaxNumber: 21
  });
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {
    minMaxNumberCalculated: 20
  });
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    minMaxNumberCalculated: 21
  });
  test.length(sc.invalidKeys(), 1);
  /* DATE */
  sc = validate(ss, {
    minMaxDate: (new Date(Date.UTC(2013, 11, 31)))
  });
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    minMaxDate: (new Date(Date.UTC(2014, 0, 1)))
  });
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {
    minMaxDateCalculated: (new Date(Date.UTC(2013, 11, 31)))
  });
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    minMaxDateCalculated: (new Date(Date.UTC(2014, 0, 1)))
  });
  test.length(sc.invalidKeys(), 1);
  /* ARRAY COUNT PLUS STRING LENGTH */
  sc = validate(ss, {
    minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong"]
  });
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    minMaxStringArray: ["toolongtoolongtoolong", "toolongtoolongtoolong"]
  });
  test.length(sc.invalidKeys(), 2);
  sc = validate(ss, {
    minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong", "nottoolongnottoolong"]
  });
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Maximum Checks - Upsert", function(test) {
  /* STRING LENGTH */
  var sc = validate(ss, {$setOnInsert: {
      minMaxString: "nottoolongnottoolong"
    }}, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$setOnInsert: {
      minMaxString: "toolongtoolongtoolong"
    }}, true, true);
  test.length(sc.invalidKeys(), 1);
  /* NUMBER */
  sc = validate(ss, {$setOnInsert: {
      minMaxNumber: 20
    }}, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$setOnInsert: {
      minMaxNumber: 21
    }}, true, true);
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {$setOnInsert: {
      minMaxNumberCalculated: 20
    }}, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$setOnInsert: {
      minMaxNumberCalculated: 21
    }}, true, true);
  test.length(sc.invalidKeys(), 1);
  /* DATE */
  sc = validate(ss, {$setOnInsert: {
      minMaxDate: (new Date(Date.UTC(2013, 11, 31)))
    }}, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$setOnInsert: {
      minMaxDate: (new Date(Date.UTC(2014, 0, 1)))
    }}, true, true);
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {$setOnInsert: {
      minMaxDateCalculated: (new Date(Date.UTC(2013, 11, 31)))
    }}, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$setOnInsert: {
      minMaxDateCalculated: (new Date(Date.UTC(2014, 0, 1)))
    }}, true, true);
  test.length(sc.invalidKeys(), 1);
  /* ARRAY COUNT PLUS STRING LENGTH */
  sc = validate(ss, {$setOnInsert: {
      minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong"]
    }}, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$setOnInsert: {
      minMaxStringArray: ["toolongtoolongtoolong", "toolongtoolongtoolong"]
    }}, true, true);
  test.length(sc.invalidKeys(), 2);
  sc = validate(ss, {$setOnInsert: {
      minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong", "nottoolongnottoolong"]
    }}, true, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Maximum Checks - Update", function(test) {
  /* STRING LENGTH */
  var sc = validate(ss, {$set: {
      minMaxString: "nottoolongnottoolong"
    }}, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$set: {
      minMaxString: "toolongtoolongtoolong"
    }}, true);
  test.length(sc.invalidKeys(), 1);
  /* NUMBER */
  sc = validate(ss, {$set: {
      minMaxNumber: 20
    }}, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$set: {
      minMaxNumber: 21
    }}, true);
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {$set: {
      minMaxNumberCalculated: 20
    }}, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$set: {
      minMaxNumberCalculated: 21
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {$set: {
      maxZero: 1
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {$inc: {
      maxZero: 5
    }}, true);
  // Should not be invalid because we don't know what we're starting from
  test.length(sc.invalidKeys(), 0);

  /* DATE */
  sc = validate(ss, {$set: {
      minMaxDate: (new Date(Date.UTC(2013, 11, 31)))
    }}, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$set: {
      minMaxDate: (new Date(Date.UTC(2014, 0, 1)))
    }}, true);
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {$set: {
      minMaxDateCalculated: (new Date(Date.UTC(2013, 11, 31)))
    }}, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$set: {
      minMaxDateCalculated: (new Date(Date.UTC(2014, 0, 1)))
    }}, true);
  test.length(sc.invalidKeys(), 1);
  /* ARRAY COUNT PLUS STRING LENGTH */
  sc = validate(ss, {$set: {
      minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong"]
    }}, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {$set: {
      minMaxStringArray: ["toolongtoolongtoolong", "toolongtoolongtoolong"]
    }}, true);
  test.length(sc.invalidKeys(), 2);
  sc = validate(ss, {$set: {
      minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong", "nottoolongnottoolong"]
    }}, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Minimum Array Count - Insert - Invalid", function(test) {
  var sc = validate(friends, {
    friends: [],
    enemies: []
  });
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Minimum Array Count - Update - Invalid", function(test) {
  var sc = validate(friends, {$set: {
      friends: []
    }}, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Minimum Array Count - Upsert - Invalid", function(test) {
  var sc = validate(friends, {$setOnInsert: {
      friends: [],
      enemies: []
    }}, true, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Allowed Values Checks - Insert - Valid", function(test) {
  /* STRING */
  var sc = validate(ss, {
    allowedStrings: "tuna"
  });
  test.equal(sc.invalidKeys(), []);

  sc = validate(ss, {
    allowedStringsArray: ["tuna", "fish", "salad"]
  });
  test.equal(sc.invalidKeys(), []);

  //array of objects
  sc = validate(friends, {
    friends: [{name: 'Bob', type: 'best'}],
    enemies: []
  });
  test.equal(sc.invalidKeys(), []);

  /* NUMBER */
  sc = validate(ss, {
    allowedNumbers: 1
  });
  test.equal(sc.invalidKeys(), []);

  sc = validate(ss, {
    allowedNumbersArray: [1, 2, 3]
  });
  test.equal(sc.invalidKeys(), []);

  //array of objects
  sc = validate(friends, {
    friends: [{name: 'Bob', type: 'best', a: {b: 5000}}],
    enemies: []
  });
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Allowed Values Checks - Insert - Invalid", function(test) {
  /* STRING */
  var sc = validate(ss, {
    allowedStrings: "tunas"
  });
  test.length(sc.invalidKeys(), 1);

  //array
  sc = validate(ss, {
    allowedStringsArray: ["tuna", "fish", "sandwich"]
  });
  test.length(sc.invalidKeys(), 1);

  //array of objects
  sc = validate(friends, {
    friends: [{name: 'Bob', type: 'smelly'}],
    enemies: []
  });
  test.length(sc.invalidKeys(), 1);

  /* NUMBER */
  sc = validate(ss, {
    allowedNumbers: 4
  });
  test.length(sc.invalidKeys(), 1);

  //array
  sc = validate(ss, {
    allowedNumbersArray: [1, 2, 3, 4]
  });
  test.length(sc.invalidKeys(), 1);

  //array of objects
  sc = validate(friends, {
    friends: [{name: 'Bob', type: 'best', a: {b: "wrong"}}],
    enemies: []
  });
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Allowed Values Checks - Upsert - Valid - $setOnInsert", function(test) {
  /* STRING */
  var sc = validate(ss, {$setOnInsert: {
      allowedStrings: "tuna"
    }}, true, true);
  test.equal(sc.invalidKeys(), []);

  //array
  sc = validate(ss, {$setOnInsert: {
      allowedStringsArray: ["tuna", "fish", "salad"]
    }}, true, true);
  test.equal(sc.invalidKeys(), []);

  //array of objects
  sc = validate(friends, {$setOnInsert: {
      friends: [{name: 'Bob', type: 'best'}],
      enemies: []
    }}, true, true);
  test.equal(sc.invalidKeys(), []);

  /* NUMBER */
  sc = validate(ss, {$setOnInsert: {
      allowedNumbers: 1
    }}, true, true);
  test.equal(sc.invalidKeys(), []);

  //array
  sc = validate(ss, {$setOnInsert: {
      allowedNumbersArray: [1, 2, 3]
    }}, true, true);
  test.equal(sc.invalidKeys(), []);

  //array of objects
  sc = validate(friends, {$setOnInsert: {
      friends: [{name: 'Bob', type: 'best', a: {b: 5000}}],
      enemies: []
    }}, true, true);
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Allowed Values Checks - Upsert - Invalid - $setOnInsert", function(test) {
  /* STRING */
  var sc = validate(ss, {$setOnInsert: {
      allowedStrings: "tunas"
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  //array
  sc = validate(ss, {$setOnInsert: {
      allowedStringsArray: ["tuna", "fish", "sandwich"]
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  //array of objects
  sc = validate(friends, {$setOnInsert: {
      friends: [{name: 'Bob', type: 'smelly'}],
      enemies: []
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  /* NUMBER */
  sc = validate(ss, {$setOnInsert: {
      allowedNumbers: 4
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  //array
  sc = validate(ss, {$setOnInsert: {
      allowedNumbersArray: [1, 2, 3, 4]
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  //array of objects
  sc = validate(friends, {$setOnInsert: {
      friends: [{name: 'Bob', type: 'best', a: {b: "wrong"}}],
      enemies: []
    }}, true, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Allowed Values Checks - Update - Valid - $set", function(test) {
  /* STRING */
  var sc = validate(ss, {$set: {
      allowedStrings: "tuna"
    }}, true);
  test.equal(sc.invalidKeys(), []);

  //array
  sc = validate(ss, {$set: {
      allowedStringsArray: ["tuna", "fish", "salad"]
    }}, true);
  test.equal(sc.invalidKeys(), []);

  //array of objects
  sc = validate(friends, {$set: {
      'friends.$.name': 'Bob'
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(friends, {$set: {
      'friends.1.name': 'Bob'
    }}, true);
  test.equal(sc.invalidKeys(), []);

  /* NUMBER */
  sc = validate(ss, {$set: {
      allowedNumbers: 1
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ss, {$set: {
      allowedNumbersArray: [1, 2, 3]
    }}, true);
  test.equal(sc.invalidKeys(), []);

});

Tinytest.add("SimpleSchema - Allowed Values Checks - Update - Invalid - $set", function(test) {
  /* STRING */
  var sc = validate(ss, {$set: {
      allowedStrings: "tunas"
    }}, true);
  test.length(sc.invalidKeys(), 1);

  //array
  sc = validate(ss, {$set: {
      allowedStringsArray: ["tuna", "fish", "sandwich"]
    }}, true);
  test.length(sc.invalidKeys(), 1);

  //array of objects
  sc = validate(friends, {$set: {
      'friends.$.name': 'Bobby'
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {$set: {
      'friends.1.name': 'Bobby'
    }}, true);
  test.length(sc.invalidKeys(), 1);

  /* NUMBER */
  sc = validate(ss, {$set: {
      allowedNumbers: 4
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {$set: {
      allowedNumbersArray: [1, 2, 3, 4]
    }}, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Black Box Objects", function(test) {
  function doTest(obj, isModifier, invalidCount) {
    var sc = validate(ss, obj, isModifier, false, true);
    test.length(sc.invalidKeys(), invalidCount);
  }

  doTest({
    blackBoxObject: "string"
  }, false, 1);

  doTest({
    blackBoxObject: {}
  }, false, 0);

  doTest({
    blackBoxObject: {
      foo: "bar"
    }
  }, false, 0);

  doTest({$set: {
    blackBoxObject: {
      foo: "bar"
    }
  }}, true, 0);

  doTest({$set: {
    'blackBoxObject.foo': "bar"
  }}, true, 0);

  doTest({$set: {
    'blackBoxObject.1': "bar"
  }}, true, 0);

  doTest({$push: {
    'blackBoxObject.foo': "bar"
  }}, true, 0);

  doTest({$set: {
    'blackBoxObject': []
  }}, true, 1);
});

Tinytest.add("SimpleSchema - Validation Against Another Key - Insert - Valid", function(test) {
  var sc = validate(pss, {
    password: "password",
    confirmPassword: "password"
  });
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Validation Against Another Key - Upsert - Valid - $setOnInsert", function(test) {
  var sc = validate(pss, {$setOnInsert: {
      password: "password",
      confirmPassword: "password"
    }}, true, true);
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Validation Against Another Key - Update - Valid - $set", function(test) {
  var sc = validate(pss, {$set: {
      password: "password",
      confirmPassword: "password"
    }}, true);

  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Validation Against Another Key - Insert - Invalid", function(test) {
  var sc = validate(pss, {
    password: "password",
    confirmPassword: "password1"
  });
  test.length(sc.invalidKeys(), 1);
  test.equal(sc.invalidKeys()[0].type, "passwordMismatch");
});

Tinytest.add("SimpleSchema - Validation Against Another Key - Upsert - Invalid - $setOnInsert", function(test) {
  var sc = validate(pss, {$setOnInsert: {
      password: "password",
      confirmPassword: "password1"
    }}, true, true);
  test.length(sc.invalidKeys(), 1);
  test.equal(sc.invalidKeys()[0].type, "passwordMismatch");
});

Tinytest.add("SimpleSchema - Validation Against Another Key - Update - Invalid - $set", function(test) {
  var sc = validate(pss, {$set: {
      password: "password",
      confirmPassword: "password1"
    }}, true);
  test.length(sc.invalidKeys(), 1);
  test.equal(sc.invalidKeys()[0].type, "passwordMismatch");
});

Tinytest.add("SimpleSchema - Validate with the Match API", function(test) {
  test.instanceOf(pss, SimpleSchema);
  test.isFalse(Match.test({password: 'pass'}, pss));
  test.isTrue(Match.test({password: 'pass', confirmPassword: 'pass'}, pss));
  try {
    check({password: 'pass'}, pss);
    test.fail({type: 'exception', message: 'expect the check validation to throws an exception'});
  } catch (exception) {
    test.instanceOf(exception, Match.Error);
  }
});

Tinytest.add("SimpleSchema - Validate Typed Arrays", function(test) {
  var taS = new SimpleSchema({
    ta: {
      type: Uint8Array
    }
  });

  var bin = new Uint8Array(100000000);
  var ctx = validate(taS, {ta: bin});
  test.length(ctx.invalidKeys(), 0);
});

Tinytest.add("SimpleSchema - Extend Schema Definition", function(test) {
  var ssWithUnique;
  try {
    ssWithUnique = new SimpleSchema({
      name: {
        type: String,
        unique: true
      }
    });
  } catch (exception) {
    test.instanceOf(exception, Error);
  }

  SimpleSchema.extendOptions({
    unique: Match.Optional(Boolean)
  });

  try {
    ssWithUnique = new SimpleSchema({
      name: {
        type: String,
        unique: true
      }
    });
  } catch (exception) {
    test.fail({type: 'exception', message: 'define a schema with a unique option in field definition'});
  }
});

Tinytest.add("SimpleSchema - Array of Objects", function(test) {

  var sc = validate(friends, {$set: {
      enemies: [{}]
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {$set: {
      enemies: [{name: "Zach"}]
    }}, true);
  test.length(sc.invalidKeys(), 0);

  sc = validate(friends, {$set: {
      enemies: [{name: "Zach", traits: []}]
    }}, true);
  test.length(sc.invalidKeys(), 0);

  sc = validate(friends, {$set: {
      enemies: [{name: "Zach", traits: [{}]}]
    }}, true);
  test.length(sc.invalidKeys(), 2);

  sc = validate(friends, {$set: {
      enemies: [{name: "Zach", traits: [{}, {}]}]
    }}, true);
  test.length(sc.invalidKeys(), 4);

  sc = validate(friends, {$set: {
      enemies: [{name: "Zach", traits: [{name: "evil"}]}]
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {$set: {
      enemies: [{name: "Zach", traits: [{name: "evil", weight: "heavy"}]}]
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {$set: {
      enemies: [{name: "Zach", traits: [{name: "evil", weight: 9.5}]}]
    }}, true);
  test.length(sc.invalidKeys(), 0);

  sc = validate(friends, {$push: {
      friends: {name: "Bob"}
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {$push: {
      friends: {name: "Bob", type: "best"}
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(friends, {$push: {
      friends: {name: "Bobby", type: "best"}
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {$push: {
      friends: {$each: [{name: "Bob", type: "best"}, {name: "Bob", type: "best"}]}
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(friends, {$push: {
      friends: {$each: [{name: "Bob", type: "best"}, {name: "Bobby", type: "best"}]}
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {$push: {
      friends: {$each: [{name: "Bob", type: 2}, {name: "Bobby", type: "best"}]}
    }}, true);
  test.length(sc.invalidKeys(), 2);

  sc = validate(friends, {$addToSet: {
      friends: {name: "Bob"}
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {$addToSet: {
      friends: {name: "Bob", type: "best"}
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(friends, {$addToSet: {
      friends: {name: "Bobby", type: "best"}
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {$addToSet: {
      friends: {$each: [{name: "Bob", type: "best"}, {name: "Bob", type: "best"}]}
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(friends, {$addToSet: {
      friends: {$each: [{name: "Bob", type: "best"}, {name: "Bobby", type: "best"}]}
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {$addToSet: {
      friends: {$each: [{name: "Bob", type: 2}, {name: "Bobby", type: "best"}]}
    }}, true);
  test.length(sc.invalidKeys(), 2);
});

Tinytest.add("SimpleSchema - Multiple Contexts", function(test) {
  var ssContext1 = ssr.newContext();
  ssContext1.validate({});
  test.length(ssContext1.invalidKeys(), 8);
  var ssContext2 = ssr.newContext();
  ssContext2.validate({
    requiredString: "test",
    requiredBoolean: true,
    requiredNumber: 1,
    requiredDate: (new Date()),
    requiredEmail: "test123@sub.example.edu",
    requiredUrl: "http://google.com",
    requiredObject: {
      requiredNumber: 1
    },
    optionalObject: {
      requiredString: "test"
    }
  });
  test.length(ssContext1.invalidKeys(), 8);
  test.length(ssContext2.invalidKeys(), 0);
});

Tinytest.add("SimpleSchema - Clean", function(test) {

  function doTest(given, expected, isModifier) {
    ss.clean(given, {isModifier: isModifier});
    test.equal(given, expected);
  }

  //BASELINE

  //when you clean a good object it's still good
  doTest({string: "This is a string"}, {string: "This is a string"}, false);
  //when you clean a bad object it's now good
  doTest({string: "This is a string", admin: true}, {string: "This is a string"}, false);
  //type conversion works
  doTest({string: 1}, {string: "1"}, false);
  //remove empty strings
  doTest({string: ""}, {}, false);
  //remove whitespace only strings (trimmed to empty strings)
  doTest({string: "    "}, {}, false);
  //mongo objectID
  var oid = new Meteor.Collection.ObjectID();
  doTest({oid: [oid]}, {oid: [oid]}, false);

  //WITH CUSTOM OBJECT

  //when you clean a good object it's still good
  var myObj = new Address("New York", "NY");
  doTest({customObject: myObj}, {customObject: myObj}, false);

  //when you clean a good object it's still good
  myObj = {
    foo: "bar",
    "foobar.foobar": 10000
  };
  doTest({blackBoxObject: myObj}, {blackBoxObject: myObj}, false);

  //$SET

  //when you clean a good object it's still good
  doTest({$set: {string: "This is a string"}}, {$set: {string: "This is a string"}}, true);
  //when you clean a bad object it's now good
  doTest({$set: {string: "This is a string", admin: true}}, {$set: {string: "This is a string"}}, true);
  //type conversion works
  doTest({$set: {string: 1}}, {$set: {string: "1"}}, true);
  //move empty strings to $unset;
  //$set must be removed, too, because Mongo 2.6+ throws errors
  //when operator object is empty
  doTest({$set: {string: ""}}, {$unset: {string: ""}}, true);

  //$UNSET
  // We don't want the filter option to apply to $unset operator because it should be fine
  // to unset anything. For example, the schema might have changed and now we're running some
  // server conversion to unset properties that are no longer part of the schema.

  //when you clean a good object it's still good
  doTest({$unset: {string: null}}, {$unset: {string: null}}, true);
  //when you clean an object with extra unset keys, they stay there
  doTest({$unset: {string: null, admin: null}}, {$unset: {string: null, admin: null}}, true);
  //cleaning does not type convert the $unset value because it's a meaningless value
  doTest({$unset: {string: 1}}, {$unset: {string: 1}}, true);

  //$SETONINSERT

  //when you clean a good object it's still good
  doTest({$setOnInsert: {string: "This is a string"}}, {$setOnInsert: {string: "This is a string"}}, true);
  //when you clean a bad object it's now good
  doTest({$setOnInsert: {string: "This is a string", admin: true}}, {$setOnInsert: {string: "This is a string"}}, true);
  //type conversion works
  doTest({$setOnInsert: {string: 1}}, {$setOnInsert: {string: "1"}}, true);

  //$INC

  //when you clean a good object it's still good
  doTest({$inc: {number: 1}}, {$inc: {number: 1}}, true);
  //when you clean a bad object it's now good
  doTest({$inc: {number: 1, admin: 1}}, {$inc: {number: 1}}, true);
  //type conversion works
  doTest({$inc: {number: "1"}}, {$inc: {number: 1}}, true);

  //$ADDTOSET

  //when you clean a good object it's still good
  doTest({$addToSet: {allowedNumbersArray: 1}}, {$addToSet: {allowedNumbersArray: 1}}, true);
  //when you clean a bad object it's now good
  doTest({$addToSet: {allowedNumbersArray: 1, admin: 1}}, {$addToSet: {allowedNumbersArray: 1}}, true);
  //type conversion works
  doTest({$addToSet: {allowedNumbersArray: "1"}}, {$addToSet: {allowedNumbersArray: 1}}, true);

  //$ADDTOSET WITH EACH

  //when you clean a good object it's still good
  doTest({$addToSet: {allowedNumbersArray: {$each: [1, 2, 3]}}}, {$addToSet: {allowedNumbersArray: {$each: [1, 2, 3]}}}, true);
  //when you clean a bad object it's now good
  doTest({$addToSet: {allowedNumbersArray: {$each: [1, 2, 3]}, admin: {$each: [1, 2, 3]}}}, {$addToSet: {allowedNumbersArray: {$each: [1, 2, 3]}}}, true);
  //type conversion works
  doTest({$addToSet: {allowedNumbersArray: {$each: ["1", 2, 3]}}}, {$addToSet: {allowedNumbersArray: {$each: [1, 2, 3]}}}, true);

  //$PUSH

  //when you clean a good object it's still good
  doTest({$push: {allowedNumbersArray: 1}}, {$push: {allowedNumbersArray: 1}}, true);
  //when you clean a bad object it's now good
  doTest({$push: {allowedNumbersArray: 1, admin: 1}}, {$push: {allowedNumbersArray: 1}}, true);
  //type conversion works
  doTest({$push: {allowedNumbersArray: "1"}}, {$push: {allowedNumbersArray: 1}}, true);

  //$PUSH WITH EACH

  //when you clean a good object it's still good
  doTest({$push: {allowedNumbersArray: {$each: [1, 2, 3]}}}, {$push: {allowedNumbersArray: {$each: [1, 2, 3]}}}, true);
  //when you clean a bad object it's now good
  doTest({$push: {allowedNumbersArray: {$each: [1, 2, 3]}, admin: {$each: [1, 2, 3]}}}, {$push: {allowedNumbersArray: {$each: [1, 2, 3]}}}, true);
  //type conversion works
  doTest({$push: {allowedNumbersArray: {$each: ["1", 2, 3]}}}, {$push: {allowedNumbersArray: {$each: [1, 2, 3]}}}, true);

  //$PULL

  //when you clean a good object it's still good
  doTest({$pull: {allowedNumbersArray: 1}}, {$pull: {allowedNumbersArray: 1}}, true);
  //when you clean a bad object it's now good
  doTest({$pull: {allowedNumbersArray: 1, admin: 1}}, {$pull: {allowedNumbersArray: 1}}, true);
  //type conversion works
  doTest({$pull: {allowedNumbersArray: "1"}}, {$pull: {allowedNumbersArray: 1}}, true);

  //$PULL with query2

  //when you clean a good object it's still good
  doTest({$pull: {allowedNumbersArray: {$in: [1]}}}, {$pull: {allowedNumbersArray: {$in: [1]}}}, true);
  //when you clean a bad object it's now good
  doTest({$pull: {allowedNumbersArray: {$in: [1]}, admin: {$in: [1]}}}, {$pull: {allowedNumbersArray: {$in: [1]}}}, true);
  //type conversion does not work within query2
  doTest({$pull: {allowedNumbersArray: {$in: ["1"]}}}, {$pull: {allowedNumbersArray: {$in: ["1"]}}}, true);
  //more tests
  doTest({$pull: {allowedNumbersArray: {foo: {$in: [1]}}}}, {$pull: {allowedNumbersArray: {foo: {$in: [1]}}}}, true);

  //$POP

  //when you clean a good object it's still good
  doTest({$pop: {allowedNumbersArray: 1}}, {$pop: {allowedNumbersArray: 1}}, true);
  //when you clean a bad object it's now good
  doTest({$pop: {allowedNumbersArray: 1, admin: 1}}, {$pop: {allowedNumbersArray: 1}}, true);
  //type conversion works
  doTest({$pop: {allowedNumbersArray: "1"}}, {$pop: {allowedNumbersArray: 1}}, true);

  //$PULLALL

  doTest({$pullAll: {allowedNumbersArray: [1, 2, 3]}}, {$pullAll: {allowedNumbersArray: [1, 2, 3]}}, true);
  doTest({$pullAll: {allowedNumbersArray: ["1", 2, 3]}}, {$pullAll: {allowedNumbersArray: [1, 2, 3]}}, true);

  //$PUSHALL (DEPRECATED - SHOULD BE TRANSLATED TO $PUSH+$EACH

  doTest({$pushAll: {allowedNumbersArray: [1, 2, 3]}}, {$push: {allowedNumbersArray: {$each: [1, 2, 3]}}}, true);
  doTest({$pushAll: {allowedNumbersArray: ["1", 2, 3]}}, {$push: {allowedNumbersArray: {$each: [1, 2, 3]}}}, true);
  //if there's also $push for some reason, the two should be combined
  doTest({
    $push: {
      allowedNumbersArray: {$each: ["1", 2, 3]},
      allowedStringsArray: {$each: ["tuna", "fish"]}
    },
    $pushAll: {allowedNumbersArray: ["4", 5, 6]}
  }, {
    $push: {
      allowedNumbersArray: {$each: [1, 2, 3, 4, 5, 6]},
      allowedStringsArray: {$each: ["tuna", "fish"]}
    }
  }, true);

  // Cleaning shouldn't remove anything within blackbox
  doTest({blackBoxObject: {foo: 1}}, {blackBoxObject: {foo: 1}});
  doTest({blackBoxObject: {foo: [1]}}, {blackBoxObject: {foo: [1]}});
  doTest({blackBoxObject: {foo: [{bar: 1}]}}, {blackBoxObject: {foo: [{bar: 1}]}});
  doTest({$set: {blackBoxObject: {foo: 1}}}, {$set: {blackBoxObject: {foo: 1}}}, true);
  doTest({$set: {blackBoxObject: {foo: [1]}}}, {$set: {blackBoxObject: {foo: [1]}}}, true);
  doTest({$set: {blackBoxObject: {foo: [{bar: 1}]}}}, {$set: {blackBoxObject: {foo: [{bar: 1}]}}}, true);
  doTest({$set: {'blackBoxObject.email.verificationTokens.$': {token: "Hi"}}}, {$set: {'blackBoxObject.email.verificationTokens.$': {token: "Hi"}}}, true);
  doTest({$set: {'blackBoxObject.email.verificationTokens.$.token': "Hi"}}, {$set: {'blackBoxObject.email.verificationTokens.$.token': "Hi"}}, true);

  doTest(
    {$push: {'blackBoxObject.email.verificationTokens': {token: "Hi"}}},
    {$push: {'blackBoxObject.email.verificationTokens': {token: "Hi"}}},
    true
    );

  // Don't $unset when the prop is within an object that is already being $set
  myObj = {$set: {requiredObj: {requiredProp: 'blah', optionalProp: '' } }};
  optionalInObject.clean(myObj, {isModifier: true});
  test.equal(myObj, {$set: {requiredObj: {requiredProp: 'blah'} }});

});

Tinytest.add("SimpleSchema - Clean - trimStrings", function(test) {

  function doTest(isModifier, given, expected) {
    var cleanObj = ss.clean(given, {
      filter: false,
      autoConvert: false,
      removeEmptyStrings: false,
      trimStrings: true,
      getAutoValues: false,
      isModifier: isModifier
    });
    test.equal(cleanObj, expected);
  }

  //DOC
  doTest(false, {string: "    This is a string    "}, {string: "This is a string"});

  //$SET
  doTest(true, {$set: {string: "    This is a string    "}}, {$set: {string: "This is a string"}});

  //$UNSET
  doTest(true, {$unset: {string: "    This is a string    "}}, {$unset: {string: "This is a string"}});

  //$SETONINSERT
  doTest(true, {$setOnInsert: {string: "    This is a string    "}}, {$setOnInsert: {string: "This is a string"}});

  //$ADDTOSET
  doTest(true, {$addToSet: {minMaxStringArray: "    This is a string    "}}, {$addToSet: {minMaxStringArray: "This is a string"}});

  //$ADDTOSET WITH EACH
  doTest(true, {$addToSet: {minMaxStringArray: {$each: ["    This is a string    "]}}}, {$addToSet: {minMaxStringArray: {$each: ["This is a string"]}}});

  //$PUSH
  doTest(true, {$push: {minMaxStringArray: "    This is a string    "}}, {$push: {minMaxStringArray: "This is a string"}});

  //$PUSH WITH EACH
  doTest(true, {$push: {minMaxStringArray: {$each: ["    This is a string    "]}}}, {$push: {minMaxStringArray: {$each: ["This is a string"]}}});

  //$PULL
  doTest(true, {$pull: {minMaxStringArray: "    This is a string    "}}, {$pull: {minMaxStringArray: "This is a string"}});

  //$POP
  doTest(true, {$pop: {minMaxStringArray: "    This is a string    "}}, {$pop: {minMaxStringArray: "This is a string"}});

  //$PULLALL
  doTest(true, {$pullAll: {minMaxStringArray: ["    This is a string    "]}}, {$pullAll: {minMaxStringArray: ["This is a string"]}});

});

Tinytest.add("SimpleSchema - Custom Types", function(test) {
  var peopleSchema = new SimpleSchema({
    name: {
      type: String,
      max: 200
    },
    address: {
      type: Address
    },
    createdAt: {
      type: Date
    },
    file: {
      type: Uint8Array
    }
  });

  var c1 = peopleSchema.newContext();
  var person = {
    name: "Person One",
    createdAt: new Date(),
    file: new Uint8Array([104, 101, 108, 108, 111]),
    address: new Address("San Francisco", "CA")
  };

  // without cleaning first
  c1 = validate(peopleSchema, person, false, false, true);
  test.length(c1.invalidKeys(), 0);

  // with cleaning first
  c1 = validate(peopleSchema, person);
  test.length(c1.invalidKeys(), 0);

  var person2 = {
    name: "Person Two",
    createdAt: {},
    file: {},
    address: {}
  };

  // without cleaning first
  c1 = validate(peopleSchema, person2, false, false, true);
  test.length(c1.invalidKeys(), 3);

  // with cleaning first
  c1 = validate(peopleSchema, person2);
  test.length(c1.invalidKeys(), 3);

  peopleSchema = new SimpleSchema({
    name: {
      type: Object
    },
    address: {
      type: Object
    },
    createdAt: {
      type: Object
    },
    file: {
      type: Object
    }
  });

  // without cleaning first
  c1 = validate(peopleSchema, person, false, false, true);
  test.length(c1.invalidKeys(), 4);

  // with cleaning first
  c1 = validate(peopleSchema, person);
  test.length(c1.invalidKeys(), 4);
});

Tinytest.add("SimpleSchema - Nested Schemas", function(test) {
  var childDef = {type: String, min: 10};
  var parentDef = {type: Number, min: 10};

  var child = new SimpleSchema({
    copied: childDef,
    overridden: childDef
  });

  var parent = new SimpleSchema({
    value: {
      type: child
    },
    array: {
      type: [child]
    },
    'value.overridden': parentDef,
    'array.$.overridden': parentDef
  });

  var defs = parent._schema;

  test.equal(defs.value.type, Object, "should change parent definition types to Object");
  test.equal(defs['value.copied'], childDef, "should add child definitions to parent schema");
  test.equal(defs['value.overridden'], parentDef, "parent definitions should override child definitions");
  test.equal(defs.array.type, Array, "should change array parent definition types to Array");
  test.equal(defs['array.$'].type, Object, "should add array child definitions to parent schema");
  test.equal(defs['array.$.copied'], childDef, "should add array child definitions to parent schema");
  test.equal(defs['array.$.overridden'], parentDef, "parent definitions should override array child definitions");
});

Tinytest.add("SimpleSchema - Labels", function(test) {
  //inflection
  test.equal(ss.label("minMaxNumber"), "Min max number", '"minMaxNumber" should have inflected to "Min max number" label');
  test.equal(ssr.label("optionalObject.requiredString"), "Required string", '"optionalObject.requiredString" should have inflected to "Required string" label');

  //dynamic
  ss.labels({"sub.number": "A different label"});
  test.equal(ss.label("sub.number"), "A different label", '"sub.number" label should have been changed to "A different label"');

  //callback
  ss.labels({"sub.number": function() {
      return "A callback label";
    }});
  test.equal(ss.label("sub.number"), "A callback label", '"sub.number" label should be "A callback label" through the callback function');
});

Tinytest.add("SimpleSchema - RegEx and Messages", function(test) {

  // global
  SimpleSchema.messages({
    'regEx one': [
      {msg: 'Global Message Two'},
      {exp: /^A/, msg: 'Global Message Three'},
      {exp: /B$/, msg: 'Global Message Four'}
    ]
  });

  var testSchema = new SimpleSchema({
    one: {
      type: String,
      regEx: [
        /^A/,
        /B$/
      ]
    }
  });

  var c1 = testSchema.newContext();
  c1.validate({one: "BBB"});
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("one"), 'Global Message Three');

  c1.validate({one: "AAA"});
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("one"), 'Global Message Four');

  c1.validate({one: "CCC"});
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("one"), 'Global Message Three');

  c1.validate({one: "ACB"});
  test.length(c1.invalidKeys(), 0);

  // schema-specific messages
  testSchema.messages({
    'regEx one': [
      {msg: 'Message Two'},
      {exp: /^A/, msg: 'Message Three'},
      {exp: /B$/, msg: 'Message Four'}
    ]
  });

  c1 = testSchema.newContext();
  c1.validate({one: "BBB"});
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("one"), 'Message Three');

  c1.validate({one: "AAA"});
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("one"), 'Message Four');

  c1.validate({one: "CCC"});
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("one"), 'Message Three');

  c1.validate({one: "ACB"});
  test.length(c1.invalidKeys(), 0);
});

Tinytest.add("SimpleSchema - Built-In RegEx and Messages", function(test) {

  var testSchema = new SimpleSchema({
    email: {
      type: String,
      regEx: SimpleSchema.RegEx.Email,
      optional: true
    },
    domain: {
      type: String,
      regEx: SimpleSchema.RegEx.Domain,
      optional: true
    },
    weakDomain: {
      type: String,
      regEx: SimpleSchema.RegEx.WeakDomain,
      optional: true
    },
    ip: {
      type: String,
      regEx: SimpleSchema.RegEx.IP,
      optional: true
    },
    ip4: {
      type: String,
      regEx: SimpleSchema.RegEx.IPv4,
      optional: true
    },
    ip6: {
      type: String,
      regEx: SimpleSchema.RegEx.IPv6,
      optional: true
    },
    url: {
      type: String,
      regEx: SimpleSchema.RegEx.Url,
      optional: true
    },
    id: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      optional: true
    }
  });

  var c1 = testSchema.newContext();
  c1.validate({email: "foo"});
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("email"), "Email must be a valid e-mail address");

  c1.validate({domain: "foo"});
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("domain"), "Domain must be a valid domain");

  c1.validate({weakDomain: "///jioh779&%"});
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("weakDomain"), "Weak domain must be a valid domain");

  c1.validate({ip: "foo"});
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("ip"), "Ip must be a valid IPv4 or IPv6 address");

  c1.validate({ip4: "foo"});
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("ip4"), "Ip4 must be a valid IPv4 address");

  c1.validate({ip6: "foo"});
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("ip6"), "Ip6 must be a valid IPv6 address");

  c1.validate({url: "foo"});
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("url"), "Url must be a valid URL");

  c1.validate({id: "%#$%"});
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("id"), "Id must be a valid alphanumeric ID");
});

Tinytest.add("SimpleSchema - Issue 28", function(test) {
  var is28ss = new SimpleSchema({
    "name": {
      type: String
    },
    "embed": {
      type: Object
    },
    "embed._id": {
      type: String
    }
  });

  var is28sc = validate(is28ss, {$set: {
      name: "name"
    }}, true);
  test.length(is28sc.invalidKeys(), 0);

});

Tinytest.add("SimpleSchema - Basic Schema Merge", function(test) {

  var s1 = new SimpleSchema([
    {
      a: {
        type: Boolean
      },
      b: {
        type: String
      }
    },
    {
      c: {
        type: String
      },
      d: {
        type: String
      }
    }
  ]);

  test.equal(s1._schema, {
    a: {
      type: Boolean
    },
    b: {
      type: String
    },
    c: {
      type: String
    },
    d: {
      type: String
    }
  }, "schema was not merged correctly");

  // test validation
  var ctx = s1.namedContext();
  ctx.validate({a: "Wrong"});
  test.length(ctx.invalidKeys(), 4);

});

Tinytest.add("SimpleSchema - Mixed Schema Merge", function(test) {

  var s1 = new SimpleSchema({
    a: {
      type: Boolean
    },
    b: {
      type: [String]
    }
  });

  var s2 = new SimpleSchema([s1, {
      c: {
        type: String
      },
      d: {
        type: String
      }
    }]);

  test.equal(s2._schema, {
    a: {
      type: Boolean
    },
    b: {
      type: Array
    },
    'b.$': {
      type: String,
      optional: true
    },
    c: {
      type: String
    },
    d: {
      type: String
    }
  }, "schema was not merged correctly");

  // test validation
  var ctx = s2.namedContext();
  ctx.validate({a: "Wrong"});
  test.length(ctx.invalidKeys(), 4);

});

Tinytest.add("SimpleSchema - Mixed Schema Merge With Base Extend and Override", function(test) {

  var s1 = new SimpleSchema({
    a: {
      type: Boolean
    },
    b: {
      type: [String]
    }
  });

  var s2 = new SimpleSchema([s1, {
      a: {
        type: Number
      },
      b: {
        label: "Bacon"
      },
      c: {
        type: String
      },
      d: {
        type: String
      }
    }]);

  test.equal(s2._schema, {
    a: {
      type: Number
    },
    b: {
      type: Array,
      label: "Bacon"
    },
    'b.$': {
      type: String,
      optional: true,
      label: "Bacon"
    },
    c: {
      type: String
    },
    d: {
      type: String
    }
  }, "schema was not merged correctly");

  // test validation
  var ctx = s2.namedContext();
  ctx.validate({a: "Wrong"});
  test.length(ctx.invalidKeys(), 4);

});

Tinytest.add("SimpleSchema - AutoValues", function(test) {

  function avClean(obj, exp, opts) {
    autoValues.clean(obj, opts);
    test.equal(obj, exp);
  }

  avClean(
          {name: "Test", firstWord: "Illegal to manually set value"},
  {name: "Test", someDefault: 5, updateCount: 0}
  );

  avClean(
          {name: "Test", someDefault: 20},
  {name: "Test", someDefault: 20, updateCount: 0}
  );

  var o = {name: "Test", content: 'Hello world!'};
  autoValues.clean(o);
  test.equal(o.firstWord, 'Hello', 'expected firstWord to be "Hello"');
  test.length(o.updatesHistory, 1);
  test.equal(o.updatesHistory[0].content, 'Hello world!', 'expected updatesHistory.content to be "Hello world!"');

  // $each in pseudo modifier
  var eachAV = new SimpleSchema({
    psuedoEach: {
      type: [String],
      optional: true,
      autoValue: function() {
        if (this.isSet && this.operator === "$set") {
          return {$push: {$each: this.value}};
        }
      }
    }
  });
  o = {$set: {psuedoEach: ["foo", "bar"]}};
  eachAV.clean(o);
  test.equal(o, {$set: {}, $push: {psuedoEach: {$each: ["foo", "bar"]}}});

  // autoValues in object in array with modifier
  o = {$push: {avArrayOfObjects: {a: "b"}}};
  autoValues.clean(o, {isModifier: true});
  test.equal(o, {$push: {avArrayOfObjects: {a: "b", foo: "bar"}}, $set: {someDefault: 5}, $inc:{updateCount:1}}, 'autoValue in object in array not set correctly');

  o = {$set: {avArrayOfObjects: [{a: "b"}]}};
  autoValues.clean(o, {isModifier: true});
  test.equal(o, {$set: {avArrayOfObjects: [{a: "b", foo: "bar"}], someDefault: 5}, $inc:{updateCount:1}}, 'autoValue in object in array not set correctly');

  var av = new SimpleSchema({
    foo: {
      type: String,
      optional: true
    },
    bar: {
      type: Boolean,
      optional: true,
      autoValue: function() {
        test.equal(this.isSet, false);
        test.isUndefined(this.value);
        test.equal(this.operator, null);
        var foo = this.field('foo');
        test.equal(foo.isSet, false);
        test.isUndefined(foo.value);
        test.equal(foo.operator, null);
        foo = this.siblingField('foo');
        test.equal(foo.isSet, false);
        test.isUndefined(foo.value);
        test.equal(foo.operator, null);
      }
    }
  });
  av.clean({});

  var av2 = new SimpleSchema({
    foo: {
      type: String,
      optional: true
    },
    bar: {
      type: Boolean,
      optional: true,
      autoValue: function() {
        test.equal(this.isSet, false);
        test.isUndefined(this.value);
        test.equal(this.operator, null);
        var foo = this.field('foo');
        test.equal(foo.isSet, true);
        test.equal(foo.value, "clown");
        test.equal(foo.operator, null);
        foo = this.siblingField('foo');
        test.equal(foo.isSet, true);
        test.equal(foo.value, "clown");
        test.equal(foo.operator, null);
      }
    }
  });
  av2.clean({foo: "clown"});

  var av3 = new SimpleSchema({
    foo: {
      type: String,
      optional: true
    },
    bar: {
      type: Boolean,
      optional: true,
      autoValue: function() {
        test.equal(this.isSet, true);
        test.equal(this.value, true);
        test.equal(this.operator, null);
        var foo = this.field('foo');
        test.equal(foo.isSet, true);
        test.equal(foo.value, "clown");
        test.equal(foo.operator, null);
        foo = this.siblingField('foo');
        test.equal(foo.isSet, true);
        test.equal(foo.value, "clown");
        test.equal(foo.operator, null);
      }
    }
  });
  av3.clean({foo: "clown", bar: true});

  var av4 = new SimpleSchema({
    foo: {
      type: String,
      optional: true
    },
    bar: {
      type: Boolean,
      optional: true,
      autoValue: function() {
        test.equal(this.isSet, true);
        test.equal(this.value, false);
        test.equal(this.operator, null);
        var foo = this.field('foo');
        test.equal(foo.isSet, false);
        test.isUndefined(foo.value);
        test.equal(foo.operator, null);
        foo = this.siblingField('foo');
        test.equal(foo.isSet, false);
        test.isUndefined(foo.value);
        test.equal(foo.operator, null);
        this.unset();
      }
    }
  });
  var doc = {bar: false};
  av4.clean(doc);
  test.equal(doc, {});

  var av5 = new SimpleSchema({
    foo: {
      type: String,
      optional: true
    },
    bar: {
      type: Boolean,
      optional: true,
      autoValue: function() {
        test.equal(this.isSet, true);
        test.equal(this.value, false);
        test.equal(this.operator, "$set");
        var foo = this.field('foo');
        test.equal(foo.isSet, false);
        test.isUndefined(foo.value);
        test.equal(foo.operator, null);
        foo = this.siblingField('foo');
        test.equal(foo.isSet, false);
        test.isUndefined(foo.value);
        test.equal(foo.operator, null);
      }
    }
  });
  doc = {$set: {bar: false}};
  av5.clean(doc);
  test.equal(doc, {$set: {bar: false}});

  var av6 = new SimpleSchema({
    foo: {
      type: String,
      optional: true
    },
    bar: {
      type: Boolean,
      optional: true,
      autoValue: function() {
        test.equal(this.isSet, true);
        test.equal(this.value, false);
        test.equal(this.operator, "$set");
        var foo = this.field('foo');
        test.equal(foo.isSet, true);
        test.equal(foo.value, "clown");
        test.equal(foo.operator, "$set");
        foo = this.siblingField('foo');
        test.equal(foo.isSet, true);
        test.equal(foo.value, "clown");
        test.equal(foo.operator, "$set");
        return true;
      }
    }
  });
  doc = {$set: {foo: "clown", bar: false}};
  av6.clean(doc);
  test.equal(doc, {$set: {foo: "clown", bar: true}});

  var av7 = new SimpleSchema({
    foo: {
      type: String,
      optional: true
    },
    bar: {
      type: Boolean,
      optional: true,
      autoValue: function() {
        test.equal(this.isSet, false);
        test.isUndefined(this.value);
        test.equal(this.operator, null);
        var foo = this.field('foo');
        test.equal(foo.isSet, false);
        test.isUndefined(foo.value);
        test.equal(foo.operator, null);
        foo = this.siblingField('foo');
        test.equal(foo.isSet, false);
        test.isUndefined(foo.value);
        test.equal(foo.operator, null);
        return {$set: true};
      }
    }
  });
  doc = {};
  av7.clean(doc);
  test.equal(doc, {$set: {bar: true}});

});

Tinytest.add("SimpleSchema - DefaultValues", function(test) {

  function avClean(obj, exp, opts) {
    defaultValues.clean(obj, opts);
    test.equal(obj, exp);
  }

  avClean(
          {},
          {name: "Test", a: {b: "Test"}, strVals: []}
  );

  avClean(
          {strVals: ["foo", "bar"]},
          {name: "Test", a: {b: "Test"}, strVals: ["foo", "bar"]}
  );

  avClean(
          {name: "Test1", a: {b: "Test1"}},
  {name: "Test1", a: {b: "Test1"}, strVals: []}
  );

  avClean(
          {name: "Test1", a: {b: "Test1"}, b: []},
  {name: "Test1", a: {b: "Test1"}, b: [], strVals: []}
  );

  avClean(
          {name: "Test1", a: {b: "Test1"}, b: [{}]},
  {name: "Test1", a: {b: "Test1"}, b: [{a: "Test"}], strVals: []}
  );

  avClean(
          {name: "Test1", a: {b: "Test1"}, b: [{a: "Test1"}, {}]},
  {name: "Test1", a: {b: "Test1"}, b: [{a: "Test1"}, {a: "Test"}], strVals: []}
  );

  // Updates should not be affected
  avClean(
          {$addToSet: {strVals: 'new value'}},
          {$addToSet: {strVals: 'new value'}},
          {isModifier: true}
  );

});

Tinytest.add("SimpleSchema - Optional regEx with check", function(test) {
  try {
    // None of these should throw an error
    check({}, ss);
    check({url: null, email: null}, ss);
    check({url: "http://meteor.com", email: null}, ss);
    check({url: null, email: "foo@meteor.com"}, ss);
    check({url: null}, ss);
    check({email: null}, ss);
    check({url: "http://meteor.com"}, ss);
    check({email: "foo@meteor.com"}, ss);
    test.isTrue(true);
  } catch (err) {
    test.isTrue(false);
  }
});

Tinytest.add("SimpleSchema - Optional regEx in subobject", function (test) {
  var ts = new SimpleSchema({
    foo: {
      type: Object,
      optional: true
    },
    'foo.url': {
      type: String,
      regEx: SimpleSchema.RegEx.Url,
      optional: true
    }
  });

  var c = ts.namedContext();

  var isValid = c.validate({});
  test.isTrue(isValid);

  isValid = c.validate({foo: {}});
  test.isTrue(isValid);

  isValid = c.validate({foo: {url: null}});
  test.isTrue(isValid);

  isValid = c.validate({$set: {foo: {}}}, {modifier: true});
  test.isTrue(isValid);

  isValid = c.validate({$set: {'foo.url': null}}, {modifier: true});
  test.isTrue(isValid);

  isValid = c.validate({$unset: {'foo.url': ""}}, {modifier: true});
  test.isTrue(isValid);

});

Tinytest.add("SimpleSchema - Issue #123", function (test) {
  // With $set
  var userSchema = new SimpleSchema({
    "profile": {
      type: Object
    },
    "profile.name": {
      type: String
    }
  });

  var c = userSchema.namedContext();

  var isValid = c.validate({$set: {"profile": {}}}, {modifier: true});
  test.isFalse(isValid);

  // With $push
  userSchema = new SimpleSchema({
    "profile": {
      type: [Object]
    },
    "profile.$.name": {
      type: String
    }
  });

  c = userSchema.namedContext();

  isValid = c.validate({$push: {"profile": {}}}, {modifier: true});
  test.isFalse(isValid);
});

Tinytest.add("SimpleSchema - Optional Custom", function(test) {
  var ctx = optCust.namedContext();
  // Ensure that custom validation runs even when the optional
  // field is undefined.
  ctx.validate({});
  test.equal(ctx.invalidKeys().length, 1, 'expected 1 invalid key');
  test.equal(ctx.invalidKeys()[0].type, 'custom', 'expected custom error');
});

Tinytest.add("SimpleSchema - Optional Conditional Requiredness With $unset", function(test) {
  var ctx = optCust.namedContext();
  // Ensure that custom requiredness works when string is $unset
  ctx.validate({$unset: {"foo": ""}}, {modifier: true});
  test.equal(ctx.invalidKeys().length, 1, 'expected 1 invalid key');
  test.equal(ctx.invalidKeys()[0].type, 'custom', 'expected custom error');
});

Tinytest.add("SimpleSchema - Required Custom", function (test) {
  var ctx = reqCust.namedContext();
  // Ensure that we don't get required errors for a required field that
  // has a `custom` function when we're doing an UPDATE
  ctx.validate({$set: {a: [{}]}}, {modifier: true});
  test.equal(ctx.invalidKeys().length, 0, 'expected no validation errors');

  ctx.validate({$set: {'a.0': {}}}, {modifier: true});
  test.equal(ctx.invalidKeys().length, 0, 'expected no validation errors');

  ctx.validate({$push: {'a': {}}}, {modifier: true});
  test.equal(ctx.invalidKeys().length, 0, 'expected no validation errors');
});

Tinytest.add("SimpleSchema - Clean and Validate Object with Prototype", function (test) {
  var opS = new SimpleSchema({
    foo: {
      type: Number
    }
  });

  var CustObj = function (o) {
    _.extend(this, o);
  };
  CustObj.prototype.bar = function () {
    return 20;
  };

  var testObj = new CustObj({foo: 1, baz: "Remove Me"});
  opS.clean(testObj);
  test.instanceOf(testObj, CustObj);
  var c = opS.namedContext();
  var valid = c.validate(testObj);
  test.isTrue(valid);
  test.length(c.invalidKeys(), 0);
});

Tinytest.add("SimpleSchema - AllowsKey", function(test) {
  function run(key, allowed) {
    test.equal(ss.allowsKey(key), allowed, 'Incorrect allowsKey result for ' + key);
  }

  run('minMaxString', true);
  run('minMaxString.$', false);
  run('minMaxString.$.foo', false);
  run('minMaxString.$foo', false);
  run('minMaxString.foo', false);
  run('sub', true);
  run('sub.number', true);
  run('sub.number.$', false);
  run('sub.number.$.foo', false);
  run('sub.number.$foo', false);
  run('sub.number.foo', false);
  run('minMaxStringArray', true);
  run('minMaxStringArray.$', true);
  run('minMaxStringArray.$.foo', false);
  run('minMaxStringArray.foo', false);
  run('customObject', true);
  run('customObject.$', false);
  run('customObject.foo', true);
  run('customObject.foo.$', true);
  run('customObject.foo.$foo', true);
  run('customObject.foo.$.$foo', true);
  run('blackBoxObject', true);
  run('blackBoxObject.$', false);
  run('blackBoxObject.foo', true);
  run('blackBoxObject.foo.$', true);
  run('blackBoxObject.foo.$foo', true);
  run('blackBoxObject.foo.$.$foo', true);
  run('blackBoxObject.foo.bar.$.baz', true);
});

Tinytest.add("SimpleSchema - RegEx - Email", function (test) {
  var expr = SimpleSchema.RegEx.Email;
  var isTrue = function (s) { test.isTrue(expr.test(s), s); };
  var isFalse = function (s) { test.isFalse(expr.test(s), s); };
  isTrue("name@web.de");
  isTrue("name+addition@web.de");
  isTrue("st#r~ange.e+mail@web.de");
  isTrue("name@localhost");
  isTrue("name@192.168.200.5");
  isFalse("name@BCDF:45AB:1245:75B9:0987:1562:4567:1234");
  isFalse("name@BCDF:45AB:1245:75B9::0987:1234:1324");
  isFalse("name@BCDF:45AB:1245:75B9:0987:1234:1324");
  isFalse("name@::1");
});

Tinytest.add("SimpleSchema - RegEx - Domain", function (test) {
  var expr = SimpleSchema.RegEx.Domain;
  var isTrue = function (s) { test.isTrue(expr.test(s), s); };
  var isFalse = function (s) { test.isFalse(expr.test(s), s); };
  isTrue("domain.com");
  isFalse("localhost");
  isFalse("192.168.200.5");
  isFalse("BCDF:45AB:1245:75B9:0987:1562:4567:1234:AB36");
});

Tinytest.add("SimpleSchema - RegEx - WeakDomain", function (test) {
  var expr = SimpleSchema.RegEx.WeakDomain;
  var isTrue = function (s) { test.isTrue(expr.test(s), s); };
  isTrue("domain.com");
  isTrue("localhost");
  isTrue("192.168.200.5");
  isTrue("BCDF:45AB:1245:75B9:0987:1562:4567:1234");
});

Tinytest.add("SimpleSchema - RegEx - IP (4 and 6)", function (test) {
  var expr = SimpleSchema.RegEx.IP;
  var isTrue = function (s) { test.isTrue(expr.test(s), s); };
  var isFalse = function (s) { test.isFalse(expr.test(s), s); };
  isFalse("localhost");
  isTrue("192.168.200.5");
  isFalse("320.168.200.5");
  isFalse("192.168.5");
  isTrue("BCDF:45AB:1245:75B9:0987:1562:4567:1234");
  isFalse("BCDF:45AB:1245:75B9:0987:1562:4567:1234:AB36");
  isTrue("BCDF:45AB:1245:75B9::0987:1234:1324");
  isFalse("BCDF:45AB:1245:75B9:0987:1234:1324");
  isTrue("::1");
});

Tinytest.add("SimpleSchema - RegEx - IPv4", function (test) {
  var expr = SimpleSchema.RegEx.IPv4;
  var isTrue = function (s) { test.isTrue(expr.test(s), s); };
  var isFalse = function (s) { test.isFalse(expr.test(s), s); };
  isFalse("localhost");
  isTrue("192.168.200.5");
  isFalse("320.168.200.5");
  isFalse("192.168.5");
  isFalse("BCDF:45AB:1245:75B9:0987:1562:4567:1234");
  isFalse("BCDF:45AB:1245:75B9:0987:1562:4567:1234:AB36");
  isFalse("BCDF:45AB:1245:75B9::0987:1234:1324");
  isFalse("BCDF:45AB:1245:75B9:0987:1234:1324");
  isFalse("::1");
});

Tinytest.add("SimpleSchema - RegEx - IPv6", function (test) {
  var expr = SimpleSchema.RegEx.IPv6;
  var isTrue = function (s) { test.isTrue(expr.test(s), s); };
  var isFalse = function (s) { test.isFalse(expr.test(s), s); };
  isFalse("localhost");
  isFalse("192.168.200.5");
  isFalse("320.168.200.5");
  isFalse("192.168.5");
  isTrue("BCDF:45AB:1245:75B9:0987:1562:4567:1234");
  isFalse("BCDF:45AB:1245:75B9:0987:1562:4567:1234:AB36");
  isTrue("BCDF:45AB:1245:75B9::0987:1234:1324");
  isFalse("BCDF:45AB:1245:75B9:0987:1234:1324");
  isTrue("::1");
});

Tinytest.add("SimpleSchema - Autoconvert Dates", function (test) {
  var sc;
  // Invalid, out of range
  sc = validate(ss, {
    minMaxDate: 0
  });
  test.length(sc.invalidKeys(), 1);
  // Invalid, out of range
  sc = validate(ss, {
    minMaxDate: "2014-04-25T01:32:21.196Z"
  });
  test.length(sc.invalidKeys(), 1);
  // Valid, in range
  sc = validate(ss, {
    minMaxDate: 1366853541196
  });
  test.length(sc.invalidKeys(), 0);
  // Valid, in range
  sc = validate(ss, {
    minMaxDate: "2013-04-25T01:32:21.196Z"
  });
  test.length(sc.invalidKeys(), 0);
});

/*
 * END TESTS
 */
