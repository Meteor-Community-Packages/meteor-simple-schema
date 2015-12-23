/* global SimpleSchema */
/* global Address:true */

/*
 * BEGIN SETUP FOR TESTS
 */

//SimpleSchema.debug = true;

// Custom type for custom type checking
Address = function (city, state) {
  this.city = city;
  this.state = state;
};

Address.prototype = {
  constructor: Address,
  toString: function () {
    return this.city + ', ' + this.state;
  },
  clone: function () {
    return new Address(this.city, this.state);
  },
  equals: function (other) {
    if (!(other instanceof Address)) {
      return false;
    }
    return EJSON.stringify(this) === EJSON.stringify(other);
  },
  typeName: function () {
    return "Address";
  },
  toJSONValue: function () {
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
    type: Array,
    optional: true,
    minCount: 1,
    maxCount: 2
  },
  'minMaxStringArray.$': {
    type: String,
    min: 10,
    max: 20,
  },
  allowedStrings: {
    type: String,
    optional: true,
    allowedValues: ["tuna", "fish", "salad"]
  },
  allowedStringsArray: {
    type: Array,
    optional: true,
  },
  'allowedStringsArray.$': {
    type: String,
    allowedValues: ["tuna", "fish", "salad"]
  },
  boolean: {
    type: Boolean,
    optional: true
  },
  booleanArray: {
    type: Array,
    optional: true
  },
  'booleanArray.$': {
    type: Boolean,
  },
  number: {
    type: Number,
    optional: true
  },
  sub: {
    type: Object,
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
    min: function () {
      return 10;
    },
    max: function () {
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
    type: Array,
    optional: true,
  },
  'allowedNumbersArray.$': {
    type: Number,
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
    type: Array,
    optional: true
  },
  'dateArray.$': {
    type: Date,
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
    min: function () {
      return (new Date(Date.UTC(2013, 0, 1)));
    },
    max: function () {
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
    type: Array,
    optional: true
  },
  'oid.$': {
    type: Meteor.Collection.ObjectID,
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
    custom: function () {
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
    type: Array,
    minCount: 1
  },
  'friends.$': {
    type: Object,
  },
  'friends.$.name': {
    type: String,
    max: 3
  },
  'friends.$.type': {
    type: String,
    allowedValues: ["best", "good", "bad"]
  },
  'friends.$.a': {
    type: Object,
    optional: true
  },
  'friends.$.a.b': {
    type: Number,
    optional: true
  },
  enemies: {
    type: Array
  },
  'enemies.$': {
    type: Object
  },
  'enemies.$.name': {
    type: String
  },
  'enemies.$.traits': {
    type: Array,
    optional: true
  },
  'enemies.$.traits.$': {
    type: Object,
  },
  'enemies.$.traits.$.name': {
    type: String
  },
  'enemies.$.traits.$.weight': {
    type: Number,
    decimal: true
  }
});

var optCust = new SimpleSchema({
  foo: {
    type: String,
    optional: true,
    custom: function () {
      return "custom";
    }
  }
});

var reqCust = new SimpleSchema({
  a: {
    type: Array,
    custom: function () {
      // Just adding custom to trigger extra validation
    }
  },
  'a.$': {
    type: Object,
    custom: function () {
      // Just adding custom to trigger extra validation
    }
  },
  b: {
    type: Array,
    custom: function () {
      // Just adding custom to trigger extra validation
    }
  },
  'b.$': {
    type: Object,
    custom: function () {
      // Just adding custom to trigger extra validation
    }
  },
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
  if (!skipClean) doc = ss.clean(doc);

  var context = ss.newContext();
  context.validate(doc, {
    modifier: isModifier,
    upsert: isUpsert
  });
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

Tinytest.add("SimpleSchema - Required Checks - Insert - Valid", function (test) {
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

Tinytest.add("SimpleSchema - Required Checks - Insert - Invalid", function (test) {
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
    friends: [{
      name: 'Bob'
    }],
    enemies: [{}]
  });
  test.length(sc.invalidKeys(), 2);
});

/*
 * Upserts should be validated more like inserts because they might be an insert
 */

Tinytest.add("SimpleSchema - Required Checks - Upsert - Valid - $set", function (test) {
  var sc = validate(ssr, {
    $set: {
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
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ssr, {
    $set: {
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
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Required Checks - Upsert - Valid - $setOnInsert", function (test) {
  var sc = validate(ssr, {
    $setOnInsert: {
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
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ssr, {
    $setOnInsert: {
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
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Required Checks - Upsert - Valid - Combined", function (test) {
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

Tinytest.add("SimpleSchema - Required Checks - Upsert - Invalid - $set", function (test) {
  var sc = validateNoClean(ssr, {
    $set: {}
  }, true, true, true);
  test.length(sc.invalidKeys(), 8);

  // should be no different with some missing
  sc = validateNoClean(ssr, {
    $set: {
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'optionalObject.requiredString': null
    }
  }, true, true, true);
  test.length(sc.invalidKeys(), 9);

  sc = validateNoClean(ssr, {
    $set: {
      requiredString: null,
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
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
      requiredDate: void 0,
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
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'optionalObject.requiredString': ""
    }
  }, true, true, true);
  test.length(sc.invalidKeys(), 7);

  sc = validateNoClean(ssr, {
    $set: {
      requiredString: "   ",
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'optionalObject.requiredString': "   "
    }
  }, true, true, true);
  test.length(sc.invalidKeys(), 7);
});

Tinytest.add("SimpleSchema - Required Checks - Upsert - Invalid - $setOnInsert", function (test) {
  var sc = validateNoClean(ssr, {
    $setOnInsert: {}
  }, true, true, true);
  test.length(sc.invalidKeys(), 8);

  sc = validateNoClean(ssr, {
    $setOnInsert: {
      requiredString: null,
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'optionalObject.requiredString': null
    }
  }, true, true, true);
  test.length(sc.invalidKeys(), 9);

  sc = validateNoClean(ssr, {
    $setOnInsert: {
      requiredString: void 0,
      requiredBoolean: void 0,
      requiredNumber: void 0,
      requiredDate: void 0,
      requiredEmail: void 0,
      requiredUrl: void 0,
      requiredObject: void 0,
      'optionalObject.requiredString': void 0
    }
  }, true, true, true);
  test.length(sc.invalidKeys(), 9);

  sc = validateNoClean(ssr, {
    $setOnInsert: {
      requiredString: "",
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'optionalObject.requiredString': ""
    }
  }, true, true, true);
  test.length(sc.invalidKeys(), 7);

  sc = validateNoClean(ssr, {
    $setOnInsert: {
      requiredString: "   ",
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'optionalObject.requiredString': "   "
    }
  }, true, true, true);
  test.length(sc.invalidKeys(), 7);

  //array of objects
  sc = validateNoClean(friends, {
    $setOnInsert: {
      friends: [{
        name: 'Bob'
      }],
      enemies: []
    }
  }, true, true, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Required Checks - Upsert - Invalid - Combined", function (test) {
  //some in $set and some in $setOnInsert, make sure they're merged for validation purposes

  var sc = validateNoClean(ssr, {
    $setOnInsert: {},
    $set: {}
  }, true, true, true);
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
    if (errorObj.type === SimpleSchema.ErrorTypes.REQUIRED) memo++;
    return memo;
  }, 0);
  test.equal(requiredErrorCount, 5);
  var regExErrorCount = _.reduce(sc.invalidKeys(), function (memo, errorObj) {
    if (errorObj.type === SimpleSchema.ErrorTypes.FAILED_REGULAR_EXPRESSION) {
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
    if (errorObj.type === SimpleSchema.ErrorTypes.REQUIRED) {
      memo++;
    }
    return memo;
  }, 0);
  test.equal(requiredErrorCount, 5);
  regExErrorCount = _.reduce(sc.invalidKeys(), function (memo, errorObj) {
    if (errorObj.type === SimpleSchema.ErrorTypes.FAILED_REGULAR_EXPRESSION) {
      memo++;
    }
    return memo;
  }, 0);
  test.equal(regExErrorCount, 2);
});

Tinytest.add("SimpleSchema - Required Checks - Update - Valid - $set", function (test) {
  var sc = validateNoClean(ssr, {
    $set: {}
  }, true);
  test.equal(sc.invalidKeys(), []); //would not cause DB changes, so should not be an error

  sc = validateNoClean(ssr, {
    $set: {
      requiredString: "test",
      requiredBoolean: true,
      requiredNumber: 1,
      requiredDate: (new Date()),
      requiredEmail: "test123@sub.example.edu",
      requiredUrl: "http://google.com",
      'requiredObject.requiredNumber': 1,
      'optionalObject.requiredString': "test"
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

  sc = validateNoClean(ssr, {
    $set: {
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
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

  //array of objects
  sc = validateNoClean(friends, {
    $set: {
      'friends.1.name': "Bob"
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

  sc = validateNoClean(friends, {
    $set: {
      friends: [{
        name: 'Bob',
        type: 'good'
      }]
    }
  }, true);
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Required Checks - Update - Invalid - $set", function (test) {
  function t(s, obj, errors) {
    var sc = validateNoClean(s, obj, true);
    test.length(sc.invalidKeys(), errors);
  }

  // MongoDB will set the props to `undefined`
  t(ssr, {
    $set: {
      requiredString: void 0,
      requiredBoolean: void 0,
      requiredNumber: void 0,
      requiredDate: void 0,
      requiredEmail: void 0,
      requiredUrl: void 0,
      requiredObject: void 0,
      'optionalObject.requiredString': void 0
    }
  }, 9);

  t(ssr, {
    $set: {
      requiredString: null,
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'optionalObject.requiredString': null
    }
  }, 9);

  t(ssr, {
    $set: {
      requiredString: "",
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'optionalObject.requiredString': ""
    }
  }, 7);

  t(ssr, {
    $set: {
      requiredString: "   ",
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'optionalObject.requiredString': "   "
    }
  }, 7);

  //array of objects

  //name is required
  t(friends, {
    $set: {
      'friends.1.name': null
    }
  }, 1);

  //type is required
  t(friends, {
    $set: {
      friends: [{
        name: 'Bob'
      }]
    }
  }, 1);
});

Tinytest.add("SimpleSchema - Required Checks - Update - Valid - $unset", function (test) {
  var sc = validateNoClean(ssr, {
    $unset: {}
  }, true);
  test.equal(sc.invalidKeys(), []); //would not cause DB changes, so should not be an error

  //make sure an optional can be unset when others are required
  //retest with various values to be sure the value is ignored
  sc = validateNoClean(ssr, {
    $unset: {
      anOptionalOne: 1
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

  sc = validateNoClean(ssr, {
    $unset: {
      anOptionalOne: null
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

  sc = validateNoClean(ssr, {
    $unset: {
      anOptionalOne: ""
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

  //array of objects
  sc = validateNoClean(friends, {
    $unset: {
      'friends.1.a.b': ""
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

  sc = validateNoClean(friends, {
    $unset: {
      'friends.1.a.b': 1,
      'friends.2.a.b': 1,
      'friends.3.a.b': 1
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

});

Tinytest.add("SimpleSchema - Required Checks - Update - Invalid - $unset", function (test) {
  var sc = validateNoClean(ssr, {
    $unset: {
      requiredString: 1,
      requiredBoolean: 1,
      requiredNumber: 1,
      requiredDate: 1,
      requiredEmail: 1,
      requiredUrl: 1
    }
  }, true);
  test.length(sc.invalidKeys(), 6);

  //array of objects
  sc = validateNoClean(friends, {
    $unset: {
      'friends.1.name': 1
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  sc = validateNoClean(friends, {
    $unset: {
      'friends.1.name': 1,
      'friends.2.name': 1,
      'friends.3.name': 1
    }
  }, true);
  test.length(sc.invalidKeys(), 3);
});

Tinytest.add("SimpleSchema - Required Checks - Update - Valid - $rename", function (test) {
  //rename from optional key to another key in schema
  var sc = ss.newContext();
  sc.validate({
    $rename: {
      string: "minMaxString"
    }
  }, {
    modifier: true
  });
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Required Checks - Update - Invalid - $rename", function (test) {
  //rename from optional key to a key not in schema
  var sc = ss.newContext();
  sc.validate({
    $rename: {
      string: "newString"
    }
  }, {
    modifier: true
  });
  test.equal(sc.invalidKeys()[0].type, SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA);

  //rename from required key
  sc = ssr.newContext();
  sc.validate({
    $rename: {
      requiredString: "newRequiredString"
    }
  }, {
    modifier: true
  });
  test.equal(sc.invalidKeys()[0].type, SimpleSchema.ErrorTypes.REQUIRED);
});

Tinytest.add("SimpleSchema - Minimum Checks - Insert", function (test) {
  /* STRING LENGTH */
  var sc = validate(ss, {
    minMaxString: "longenough"
  });
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    minMaxString: "short"
  });
  test.length(sc.invalidKeys(), 1);
  sc = validateNoClean(ss, {
    minMaxString: ""
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

  sc = validateNoClean(ss, {
    minMaxStringArray: ["longenough", ""]
  });
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {
    minMaxStringArray: ["short", "short"]
  });
  test.length(sc.invalidKeys(), 2);

  sc = validate(ss, {
    minMaxStringArray: []
  });
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Minimum Checks - Upsert", function (test) {
  /* STRING LENGTH */
  var sc = validate(ss, {
    $setOnInsert: {
      minMaxString: "longenough"
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxString: "short"
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);
  /* NUMBER */
  sc = validate(ss, {
    $setOnInsert: {
      minMaxNumber: 10
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxNumber: 9
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxNumberCalculated: 10
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxNumberCalculated: 9
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {
    $setOnInsert: {
      minZero: -1
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);

  /* DATE */
  sc = validate(ss, {
    $setOnInsert: {
      minMaxDate: (new Date(Date.UTC(2013, 0, 1)))
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxDate: (new Date(Date.UTC(2012, 11, 31)))
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxDateCalculated: (new Date(Date.UTC(2013, 0, 1)))
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxDateCalculated: (new Date(Date.UTC(2012, 11, 31)))
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);
  /* ARRAY COUNT PLUS STRING LENGTH */
  sc = validate(ss, {
    $setOnInsert: {
      minMaxStringArray: ["longenough", "longenough"]
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxStringArray: ["short", "short"]
    }
  }, true, true);
  test.length(sc.invalidKeys(), 2);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxStringArray: []
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Minimum Checks - Update", function (test) {
  /* STRING LENGTH */
  var sc = validate(ss, {
    $set: {
      minMaxString: "longenough"
    }
  }, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $set: {
      minMaxString: "short"
    }
  }, true);
  test.length(sc.invalidKeys(), 1);
  /* NUMBER */
  sc = validate(ss, {
    $set: {
      minMaxNumber: 10
    }
  }, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $set: {
      minMaxNumber: 9
    }
  }, true);
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {
    $set: {
      minMaxNumberCalculated: 10
    }
  }, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $set: {
      minMaxNumberCalculated: 9
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {
    $set: {
      minZero: -1
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {
    $inc: {
      minZero: -5
    }
  }, true);
  // Should not be invalid because we don't know what we're starting from
  test.length(sc.invalidKeys(), 0);

  /* DATE */
  sc = validate(ss, {
    $set: {
      minMaxDate: (new Date(Date.UTC(2013, 0, 1)))
    }
  }, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $set: {
      minMaxDate: (new Date(Date.UTC(2012, 11, 31)))
    }
  }, true);
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {
    $set: {
      minMaxDateCalculated: (new Date(Date.UTC(2013, 0, 1)))
    }
  }, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $set: {
      minMaxDateCalculated: (new Date(Date.UTC(2012, 11, 31)))
    }
  }, true);
  test.length(sc.invalidKeys(), 1);
  /* ARRAY COUNT PLUS STRING LENGTH */
  sc = validate(ss, {
    $set: {
      minMaxStringArray: ["longenough", "longenough"]
    }
  }, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $set: {
      minMaxStringArray: ["short", "short"]
    }
  }, true);
  test.length(sc.invalidKeys(), 2);
  sc = validate(ss, {
    $set: {
      minMaxStringArray: []
    }
  }, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Maximum Checks - Insert", function (test) {
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

Tinytest.add("SimpleSchema - Maximum Checks - Upsert", function (test) {
  /* STRING LENGTH */
  var sc = validate(ss, {
    $setOnInsert: {
      minMaxString: "nottoolongnottoolong"
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxString: "toolongtoolongtoolong"
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);
  /* NUMBER */
  sc = validate(ss, {
    $setOnInsert: {
      minMaxNumber: 20
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxNumber: 21
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxNumberCalculated: 20
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxNumberCalculated: 21
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);
  /* DATE */
  sc = validate(ss, {
    $setOnInsert: {
      minMaxDate: (new Date(Date.UTC(2013, 11, 31)))
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxDate: (new Date(Date.UTC(2014, 0, 1)))
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxDateCalculated: (new Date(Date.UTC(2013, 11, 31)))
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxDateCalculated: (new Date(Date.UTC(2014, 0, 1)))
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);
  /* ARRAY COUNT PLUS STRING LENGTH */
  sc = validate(ss, {
    $setOnInsert: {
      minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong"]
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxStringArray: ["toolongtoolongtoolong", "toolongtoolongtoolong"]
    }
  }, true, true);
  test.length(sc.invalidKeys(), 2);
  sc = validate(ss, {
    $setOnInsert: {
      minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong", "nottoolongnottoolong"]
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Maximum Checks - Update", function (test) {
  /* STRING LENGTH */
  var sc = validate(ss, {
    $set: {
      minMaxString: "nottoolongnottoolong"
    }
  }, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $set: {
      minMaxString: "toolongtoolongtoolong"
    }
  }, true);
  test.length(sc.invalidKeys(), 1);
  /* NUMBER */
  sc = validate(ss, {
    $set: {
      minMaxNumber: 20
    }
  }, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $set: {
      minMaxNumber: 21
    }
  }, true);
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {
    $set: {
      minMaxNumberCalculated: 20
    }
  }, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $set: {
      minMaxNumberCalculated: 21
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {
    $set: {
      maxZero: 1
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {
    $inc: {
      maxZero: 5
    }
  }, true);
  // Should not be invalid because we don't know what we're starting from
  test.length(sc.invalidKeys(), 0);

  /* DATE */
  sc = validate(ss, {
    $set: {
      minMaxDate: (new Date(Date.UTC(2013, 11, 31)))
    }
  }, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $set: {
      minMaxDate: (new Date(Date.UTC(2014, 0, 1)))
    }
  }, true);
  test.length(sc.invalidKeys(), 1);
  sc = validate(ss, {
    $set: {
      minMaxDateCalculated: (new Date(Date.UTC(2013, 11, 31)))
    }
  }, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $set: {
      minMaxDateCalculated: (new Date(Date.UTC(2014, 0, 1)))
    }
  }, true);
  test.length(sc.invalidKeys(), 1);
  /* ARRAY COUNT PLUS STRING LENGTH */
  sc = validate(ss, {
    $set: {
      minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong"]
    }
  }, true);
  test.equal(sc.invalidKeys(), []);
  sc = validate(ss, {
    $set: {
      minMaxStringArray: ["toolongtoolongtoolong", "toolongtoolongtoolong"]
    }
  }, true);
  test.length(sc.invalidKeys(), 2);
  sc = validate(ss, {
    $set: {
      minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong", "nottoolongnottoolong"]
    }
  }, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Minimum Array Count - Insert - Invalid", function (test) {
  var sc = validate(friends, {
    friends: [],
    enemies: []
  });
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Minimum Array Count - Update - Invalid", function (test) {
  var sc = validate(friends, {
    $set: {
      friends: []
    }
  }, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Minimum Array Count - Upsert - Invalid", function (test) {
  var sc = validate(friends, {
    $setOnInsert: {
      friends: [],
      enemies: []
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Allowed Values Checks - Insert - Valid", function (test) {
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
    friends: [{
      name: 'Bob',
      type: 'best'
    }],
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
    friends: [{
      name: 'Bob',
      type: 'best',
      a: {
        b: 5000
      }
    }],
    enemies: []
  });
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Allowed Values Checks - Insert - Invalid", function (test) {
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
    friends: [{
      name: 'Bob',
      type: 'smelly'
    }],
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
    friends: [{
      name: 'Bob',
      type: 'best',
      a: {
        b: "wrong"
      }
    }],
    enemies: []
  });
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Allowed Values Checks - Upsert - Valid - $setOnInsert", function (test) {
  /* STRING */
  var sc = validate(ss, {
    $setOnInsert: {
      allowedStrings: "tuna"
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);

  //array
  sc = validate(ss, {
    $setOnInsert: {
      allowedStringsArray: ["tuna", "fish", "salad"]
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);

  //array of objects
  sc = validate(friends, {
    $setOnInsert: {
      friends: [{
        name: 'Bob',
        type: 'best'
      }],
      enemies: []
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);

  /* NUMBER */
  sc = validate(ss, {
    $setOnInsert: {
      allowedNumbers: 1
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);

  //array
  sc = validate(ss, {
    $setOnInsert: {
      allowedNumbersArray: [1, 2, 3]
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);

  //array of objects
  sc = validate(friends, {
    $setOnInsert: {
      friends: [{
        name: 'Bob',
        type: 'best',
        a: {
          b: 5000
        }
      }],
      enemies: []
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Allowed Values Checks - Upsert - Invalid - $setOnInsert", function (test) {
  /* STRING */
  var sc = validate(ss, {
    $setOnInsert: {
      allowedStrings: "tunas"
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);

  //array
  sc = validate(ss, {
    $setOnInsert: {
      allowedStringsArray: ["tuna", "fish", "sandwich"]
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);

  //array of objects
  sc = validate(friends, {
    $setOnInsert: {
      friends: [{
        name: 'Bob',
        type: 'smelly'
      }],
      enemies: []
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);

  /* NUMBER */
  sc = validate(ss, {
    $setOnInsert: {
      allowedNumbers: 4
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);

  //array
  sc = validate(ss, {
    $setOnInsert: {
      allowedNumbersArray: [1, 2, 3, 4]
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);

  //array of objects
  sc = validate(friends, {
    $setOnInsert: {
      friends: [{
        name: 'Bob',
        type: 'best',
        a: {
          b: "wrong"
        }
      }],
      enemies: []
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Allowed Values Checks - Update - Valid - $set", function (test) {
  /* STRING */
  var sc = validate(ss, {
    $set: {
      allowedStrings: "tuna"
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

  //array
  sc = validate(ss, {
    $set: {
      allowedStringsArray: ["tuna", "fish", "salad"]
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

  //array of objects
  sc = validate(friends, {
    $set: {
      'friends.$.name': 'Bob'
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(friends, {
    $set: {
      'friends.1.name': 'Bob'
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

  /* NUMBER */
  sc = validate(ss, {
    $set: {
      allowedNumbers: 1
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ss, {
    $set: {
      allowedNumbersArray: [1, 2, 3]
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

});

Tinytest.add("SimpleSchema - Allowed Values Checks - Update - Invalid - $set", function (test) {
  /* STRING */
  var sc = validate(ss, {
    $set: {
      allowedStrings: "tunas"
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  //array
  sc = validate(ss, {
    $set: {
      allowedStringsArray: ["tuna", "fish", "sandwich"]
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  //array of objects
  sc = validate(friends, {
    $set: {
      'friends.$.name': 'Bobby'
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {
    $set: {
      'friends.1.name': 'Bobby'
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  /* NUMBER */
  sc = validate(ss, {
    $set: {
      allowedNumbers: 4
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {
    $set: {
      allowedNumbersArray: [1, 2, 3, 4]
    }
  }, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Black Box Objects", function (test) {
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

  doTest({
    $set: {
      blackBoxObject: {
        foo: "bar"
      }
    }
  }, true, 0);

  doTest({
    $set: {
      'blackBoxObject.foo': "bar"
    }
  }, true, 0);

  doTest({
    $set: {
      'blackBoxObject.1': "bar"
    }
  }, true, 0);

  doTest({
    $push: {
      'blackBoxObject.foo': "bar"
    }
  }, true, 0);

  doTest({
    $set: {
      'blackBoxObject': []
    }
  }, true, 1);
});

Tinytest.add("SimpleSchema - Validation Against Another Key - Insert - Valid", function (test) {
  var sc = validate(pss, {
    password: "password",
    confirmPassword: "password"
  });
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Validation Against Another Key - Upsert - Valid - $setOnInsert", function (test) {
  var sc = validate(pss, {
    $setOnInsert: {
      password: "password",
      confirmPassword: "password"
    }
  }, true, true);
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Validation Against Another Key - Update - Valid - $set", function (test) {
  var sc = validate(pss, {
    $set: {
      password: "password",
      confirmPassword: "password"
    }
  }, true);

  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Validation Against Another Key - Insert - Invalid", function (test) {
  var sc = validate(pss, {
    password: "password",
    confirmPassword: "password1"
  });
  test.length(sc.invalidKeys(), 1);
  test.equal(sc.invalidKeys()[0].type, "passwordMismatch");
});

Tinytest.add("SimpleSchema - Validation Against Another Key - Upsert - Invalid - $setOnInsert", function (test) {
  var sc = validate(pss, {
    $setOnInsert: {
      password: "password",
      confirmPassword: "password1"
    }
  }, true, true);
  test.length(sc.invalidKeys(), 1);
  test.equal(sc.invalidKeys()[0].type, "passwordMismatch");
});

Tinytest.add("SimpleSchema - Validation Against Another Key - Update - Invalid - $set", function (test) {
  var sc = validate(pss, {
    $set: {
      password: "password",
      confirmPassword: "password1"
    }
  }, true);
  test.length(sc.invalidKeys(), 1);
  test.equal(sc.invalidKeys()[0].type, "passwordMismatch");
});

Tinytest.add("SimpleSchema - Validate Typed Arrays", function (test) {
  var taS = new SimpleSchema({
    ta: {
      type: Uint8Array
    }
  });

  var bin = new Uint8Array(100000000);
  var ctx = validate(taS, {
    ta: bin
  });
  test.length(ctx.invalidKeys(), 0);
});

Tinytest.add("SimpleSchema - Extend Schema Definition", function (test) {
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
    test.fail({
      type: 'exception',
      message: 'define a schema with a unique option in field definition'
    });
  }
});

Tinytest.add("SimpleSchema - Array of Objects", function (test) {

  var sc = validate(friends, {
    $set: {
      enemies: [{}]
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {
    $set: {
      enemies: [{
        name: "Zach"
      }]
    }
  }, true);
  test.length(sc.invalidKeys(), 0);

  sc = validate(friends, {
    $set: {
      enemies: [{
        name: "Zach",
        traits: []
      }]
    }
  }, true);
  test.length(sc.invalidKeys(), 0);

  sc = validate(friends, {
    $set: {
      enemies: [{
        name: "Zach",
        traits: [{}]
      }]
    }
  }, true);
  test.length(sc.invalidKeys(), 2);

  sc = validate(friends, {
    $set: {
      enemies: [{
        name: "Zach",
        traits: [{}, {}]
      }]
    }
  }, true);
  test.length(sc.invalidKeys(), 4);

  sc = validate(friends, {
    $set: {
      enemies: [{
        name: "Zach",
        traits: [{
          name: "evil"
        }]
      }]
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {
    $set: {
      enemies: [{
        name: "Zach",
        traits: [{
          name: "evil",
          weight: "heavy"
        }]
      }]
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {
    $set: {
      enemies: [{
        name: "Zach",
        traits: [{
          name: "evil",
          weight: 9.5
        }]
      }]
    }
  }, true);
  test.length(sc.invalidKeys(), 0);

  sc = validate(friends, {
    $push: {
      friends: {
        name: "Bob"
      }
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {
    $push: {
      friends: {
        name: "Bob",
        type: "best"
      }
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(friends, {
    $push: {
      friends: {
        name: "Bobby",
        type: "best"
      }
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {
    $push: {
      friends: {
        $each: [{
          name: "Bob",
          type: "best"
        }, {
          name: "Bob",
          type: "best"
        }]
      }
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(friends, {
    $push: {
      friends: {
        $each: [{
          name: "Bob",
          type: "best"
        }, {
          name: "Bobby",
          type: "best"
        }]
      }
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {
    $push: {
      friends: {
        $each: [{
          name: "Bob",
          type: 2
        }, {
          name: "Bobby",
          type: "best"
        }]
      }
    }
  }, true);
  test.length(sc.invalidKeys(), 2);

  sc = validate(friends, {
    $addToSet: {
      friends: {
        name: "Bob"
      }
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {
    $addToSet: {
      friends: {
        name: "Bob",
        type: "best"
      }
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(friends, {
    $addToSet: {
      friends: {
        name: "Bobby",
        type: "best"
      }
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {
    $addToSet: {
      friends: {
        $each: [{
          name: "Bob",
          type: "best"
        }, {
          name: "Bob",
          type: "best"
        }]
      }
    }
  }, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(friends, {
    $addToSet: {
      friends: {
        $each: [{
          name: "Bob",
          type: "best"
        }, {
          name: "Bobby",
          type: "best"
        }]
      }
    }
  }, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {
    $addToSet: {
      friends: {
        $each: [{
          name: "Bob",
          type: 2
        }, {
          name: "Bobby",
          type: "best"
        }]
      }
    }
  }, true);
  test.length(sc.invalidKeys(), 2);
});

Tinytest.add("SimpleSchema - Multiple Contexts", function (test) {
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

Tinytest.add("SimpleSchema - Custom Types", function (test) {
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

Tinytest.add("SimpleSchema - Nested Schemas", function (test) {
  var childDef = {
    type: String,
    min: 10,
    label: 'foo',
    optional: false
  };
  var parentDef = {
    type: Number,
    min: 10,
    label: 'foo',
    optional: false
  };

  var child = new SimpleSchema({
    copied: childDef,
    overridden: childDef
  });

  var parent = new SimpleSchema({
    value: {
      type: child
    },
    array: {
      type: Array
    },
    'array.$': {
      type: child
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

Tinytest.add("SimpleSchema - Labels", function (test) {
  //inflection
  test.equal(ss.label("minMaxNumber"), "Min max number", '"minMaxNumber" should have inflected to "Min max number" label');
  test.equal(ssr.label("optionalObject.requiredString"), "Required string", '"optionalObject.requiredString" should have inflected to "Required string" label');

  //dynamic
  ss.labels({
    "sub.number": "A different label"
  });
  test.equal(ss.label("sub.number"), "A different label", '"sub.number" label should have been changed to "A different label"');

  //callback
  ss.labels({
    "sub.number": function () {
      return "A callback label";
    }
  });
  test.equal(ss.label("sub.number"), "A callback label", '"sub.number" label should be "A callback label" through the callback function');
});

Tinytest.add("SimpleSchema - RegEx and Messages", function (test) {

  // global
  SimpleSchema.messages({
    'regEx one': [{
      msg: 'Global Message Two'
    }, {
      exp: /^A/,
      msg: 'Global Message Three'
    }, {
      exp: /B$/,
      msg: 'Global Message Four'
    }]
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
  c1.validate({
    one: "BBB"
  });
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("one"), 'Global Message Three');

  c1.validate({
    one: "AAA"
  });
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("one"), 'Global Message Four');

  c1.validate({
    one: "CCC"
  });
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("one"), 'Global Message Three');

  c1.validate({
    one: "ACB"
  });
  test.length(c1.invalidKeys(), 0);

  // schema-specific messages
  testSchema.messages({
    'regEx one': [{
      msg: 'Message Two'
    }, {
      exp: /^A/,
      msg: 'Message Three'
    }, {
      exp: /B$/,
      msg: 'Message Four'
    }]
  });

  c1 = testSchema.newContext();
  c1.validate({
    one: "BBB"
  });
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("one"), 'Message Three');

  c1.validate({
    one: "AAA"
  });
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("one"), 'Message Four');

  c1.validate({
    one: "CCC"
  });
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("one"), 'Message Three');

  c1.validate({
    one: "ACB"
  });
  test.length(c1.invalidKeys(), 0);
});

Tinytest.add("SimpleSchema - Built-In RegEx and Messages", function (test) {

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
  c1.validate({
    email: "foo"
  });
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("email"), "Email must be a valid e-mail address");

  c1.validate({
    domain: "foo"
  });
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("domain"), "Domain must be a valid domain");

  c1.validate({
    weakDomain: "///jioh779&%"
  });
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("weakDomain"), "Weak domain must be a valid domain");

  c1.validate({
    ip: "foo"
  });
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("ip"), "Ip must be a valid IPv4 or IPv6 address");

  c1.validate({
    ip4: "foo"
  });
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("ip4"), "Ip4 must be a valid IPv4 address");

  c1.validate({
    ip6: "foo"
  });
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("ip6"), "Ip6 must be a valid IPv6 address");

  c1.validate({
    url: "foo"
  });
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("url"), "Url must be a valid URL");

  c1.validate({
    id: "%#$%"
  });
  test.length(c1.invalidKeys(), 1);
  test.equal(c1.keyErrorMessage("id"), "ID must be a valid alphanumeric ID");
});

Tinytest.add("SimpleSchema - Issue 28", function (test) {
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

  var is28sc = validate(is28ss, {
    $set: {
      name: "name"
    }
  }, true);
  test.length(is28sc.invalidKeys(), 0);

});

Tinytest.add("SimpleSchema - Basic Schema Merge", function (test) {

  var s1 = new SimpleSchema([{
    a: {
      type: Boolean,
      label: 'foo',
      optional: false
    },
    b: {
      type: String,
      label: 'foo',
      optional: false
    }
  }, {
    c: {
      type: String,
      label: 'foo',
      optional: false
    },
    d: {
      type: String,
      label: 'foo',
      optional: false
    }
  }]);

  test.equal(s1._schema, {
    a: {
      type: Boolean,
      label: 'foo',
      optional: false
    },
    b: {
      type: String,
      label: 'foo',
      optional: false
    },
    c: {
      type: String,
      label: 'foo',
      optional: false
    },
    d: {
      type: String,
      label: 'foo',
      optional: false
    }
  }, "schema was not merged correctly");

  // test validation
  var ctx = s1.namedContext();
  ctx.validate({
    a: "Wrong"
  });
  test.length(ctx.invalidKeys(), 4);

});

Tinytest.add("SimpleSchema - Mixed Schema Merge", function (test) {

  var s1 = new SimpleSchema({
    a: {
      type: Boolean,
      label: 'foo',
      optional: false
    },
    b: {
      type: Array,
      label: 'foo',
      optional: false
    },
    'b.$': {
      type: String,
      label: 'foo',
    }
  });

  var s2 = new SimpleSchema([s1, {
    c: {
      type: String,
      label: 'foo',
      optional: false
    },
    d: {
      type: String,
      label: 'foo',
      optional: false
    }
  }]);

  test.equal(s2._schema, {
    a: {
      type: Boolean,
      label: 'foo',
      optional: false
    },
    b: {
      type: Array,
      label: 'foo',
      optional: false
    },
    'b.$': {
      type: String,
      optional: true,
      label: 'foo'
    },
    c: {
      type: String,
      label: 'foo',
      optional: false
    },
    d: {
      type: String,
      label: 'foo',
      optional: false
    }
  }, "schema was not merged correctly");

  // test validation
  var ctx = s2.namedContext();
  ctx.validate({
    a: "Wrong"
  });
  test.length(ctx.invalidKeys(), 4);

});

Tinytest.add("SimpleSchema - Mixed Schema Merge With Base Extend and Override", function (test) {

  var s1 = new SimpleSchema({
    a: {
      type: Boolean,
      label: 'foo',
      optional: false
    },
    b: {
      type: Array,
      label: 'foo',
      optional: false
    },
    'b.$': {
      type: String,
      label: 'foo',
    }
  });

  var s2 = new SimpleSchema([s1, {
    a: {
      type: Number,
      label: 'foo',
      optional: false
    },
    b: {
      label: "Bacon",
      optional: false
    },
    c: {
      type: String,
      label: 'foo',
      optional: false
    },
    d: {
      type: String,
      label: 'foo',
      optional: false
    }
  }]);

  test.equal(s2._schema, {
    a: {
      type: Number,
      label: 'foo',
      optional: false
    },
    b: {
      type: Array,
      label: "Bacon",
      optional: false
    },
    'b.$': {
      type: String,
      optional: true,
      label: "foo"
    },
    c: {
      type: String,
      label: 'foo',
      optional: false
    },
    d: {
      type: String,
      label: 'foo',
      optional: false
    }
  }, "schema was not merged correctly");

  // test validation
  var ctx = s2.namedContext();
  ctx.validate({
    a: "Wrong"
  });
  test.length(ctx.invalidKeys(), 4);

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

  isValid = c.validate({
    foo: {}
  });
  test.isTrue(isValid);

  isValid = c.validate({
    foo: {
      url: null
    }
  });
  test.isTrue(isValid);

  isValid = c.validate({
    $set: {
      foo: {}
    }
  }, {
    modifier: true
  });
  test.isTrue(isValid);

  isValid = c.validate({
    $set: {
      'foo.url': null
    }
  }, {
    modifier: true
  });
  test.isTrue(isValid);

  isValid = c.validate({
    $unset: {
      'foo.url': ""
    }
  }, {
    modifier: true
  });
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

  var isValid = c.validate({
    $set: {
      "profile": {}
    }
  }, {
    modifier: true
  });
  test.isFalse(isValid);

  // With $push
  userSchema = new SimpleSchema({
    "profile": {
      type: Array
    },
    "profile.$": {
      type: Object
    },
    "profile.$.name": {
      type: String
    }
  });

  c = userSchema.namedContext();

  isValid = c.validate({
    $push: {
      "profile": {}
    }
  }, {
    modifier: true
  });
  test.isFalse(isValid);
});

Tinytest.add("SimpleSchema - Optional Custom", function (test) {
  var ctx = optCust.namedContext();
  // Ensure that custom validation runs even when the optional
  // field is undefined.
  ctx.validate({});
  test.equal(ctx.invalidKeys().length, 1, 'expected 1 invalid key');
  test.equal(ctx.invalidKeys()[0].type, 'custom', 'expected custom error');
});

Tinytest.add("SimpleSchema - Optional Conditional Requiredness With $unset", function (test) {
  var ctx = optCust.namedContext();
  // Ensure that custom requiredness works when string is $unset
  ctx.validate({
    $unset: {
      "foo": ""
    }
  }, {
    modifier: true
  });
  test.equal(ctx.invalidKeys().length, 1, 'expected 1 invalid key');
  test.equal(ctx.invalidKeys()[0].type, 'custom', 'expected custom error');
});

Tinytest.add("SimpleSchema - Required Custom", function (test) {
  var ctx = reqCust.namedContext();
  // Ensure that we don't get required errors for a required field that
  // has a `custom` function when we're doing an UPDATE
  ctx.validate({
    $set: {
      a: [{}]
    }
  }, {
    modifier: true
  });
  test.equal(ctx.invalidKeys().length, 0, 'expected no validation errors');

  ctx.validate({
    $set: {
      'a.0': {}
    }
  }, {
    modifier: true
  });
  test.equal(ctx.invalidKeys().length, 0, 'expected no validation errors');

  ctx.validate({
    $push: {
      'a': {}
    }
  }, {
    modifier: true
  });
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

  var testObj = new CustObj({
    foo: 1,
    baz: "Remove Me"
  });
  opS.clean(testObj);
  test.instanceOf(testObj, CustObj);
  var c = opS.namedContext();
  var valid = c.validate(testObj);
  test.isTrue(valid);
  test.length(c.invalidKeys(), 0);
});

Tinytest.add("SimpleSchema - AllowsKey", function (test) {
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
  var isTrue = function (s) {
    test.isTrue(expr.test(s), s);
  };
  var isFalse = function (s) {
    test.isFalse(expr.test(s), s);
  };
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
  var isTrue = function (s) {
    test.isTrue(expr.test(s), s);
  };
  var isFalse = function (s) {
    test.isFalse(expr.test(s), s);
  };
  isTrue("domain.com");
  isFalse("localhost");
  isFalse("192.168.200.5");
  isFalse("BCDF:45AB:1245:75B9:0987:1562:4567:1234:AB36");
});

Tinytest.add("SimpleSchema - RegEx - WeakDomain", function (test) {
  var expr = SimpleSchema.RegEx.WeakDomain;
  var isTrue = function (s) {
    test.isTrue(expr.test(s), s);
  };
  isTrue("domain.com");
  isTrue("localhost");
  isTrue("192.168.200.5");
  isTrue("BCDF:45AB:1245:75B9:0987:1562:4567:1234");
});

Tinytest.add("SimpleSchema - RegEx - IP (4 and 6)", function (test) {
  var expr = SimpleSchema.RegEx.IP;
  var isTrue = function (s) {
    test.isTrue(expr.test(s), s);
  };
  var isFalse = function (s) {
    test.isFalse(expr.test(s), s);
  };
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
  var isTrue = function (s) {
    test.isTrue(expr.test(s), s);
  };
  var isFalse = function (s) {
    test.isFalse(expr.test(s), s);
  };
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
  var isTrue = function (s) {
    test.isTrue(expr.test(s), s);
  };
  var isFalse = function (s) {
    test.isFalse(expr.test(s), s);
  };
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

Tinytest.add('SimpleSchema - Multi-Dimensional Arrays', function (test) {
  var schema = new SimpleSchema({
    geometry: {
      type: Object,
      optional: true
    },

    'geometry.coordinates': {
      type: Array,
    },

    'geometry.coordinates.$': {
      type: Array,
    },

    'geometry.coordinates.$.$': {
      type: Array,
    },

    'geometry.coordinates.$.$.$': {
      type: Number,
    }
  });

  var doc = {
    geometry: {
      coordinates: [
        [
          [30, 50]
        ]
      ]
    }
  };
  var expected = JSON.stringify(doc);
  schema.clean(doc);
  test.equal(JSON.stringify(doc), expected);
});

Tinytest.add('SimpleSchema - Weird Type', function (test) {
  test.throws(function () {
    new SimpleSchema({
      name: {
        type: Array[Object]
      }
    });
  });
});

Tinytest.add('SimpleSchema - extend', function (test) {
  var schema1 = new SimpleSchema({
    firstName: {
      type: String,
      label: 'First name',
      optional: false
    },
    lastName: {
      type: String,
      label: 'Last name',
      optional: false
    }
  });

  var schema2 = schema1.extend({
    firstName: {
      optional: true
    }
  });

  test.equal(schema2.schema(), {
    firstName: {
      type: String,
      label: 'First name',
      optional: true
    },
    lastName: {
      type: String,
      label: 'Last name',
      optional: false
    }
  });
});

/*
 * END TESTS
 */
