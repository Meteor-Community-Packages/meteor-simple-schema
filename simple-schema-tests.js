/*
 * BEGIN SETUP FOR TESTS
 */

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
    regEx: SchemaRegEx.Email
  },
  requiredUrl: {
    type: String,
    regEx: SchemaRegEx.Url
  },
  requiredObject: {
    type: Object
  },
  'subdoc.requiredString': {
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
    max: 20
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
  valueIsAllowedString: {
    type: String,
    optional: true,
    valueIsAllowed: function(val) {
      return val === void 0 || val === null || val === "pumpkin";
    }
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
  allowedNumbers: {
    type: Number,
    optional: true,
    allowedValues: [1, 2, 3]
  },
  valueIsAllowedNumber: {
    type: Number,
    optional: true,
    valueIsAllowed: function(val) {
      return val === void 0 || val === null || val === 1;
    }
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
    regEx: SchemaRegEx.Email,
    optional: true
  },
  url: {
    type: String,
    regEx: SchemaRegEx.Url,
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
    valueIsAllowed: function(val, doc) {
      var pass = ("$set" in doc) ? doc.$set.password : doc.password;
      return pass === val;
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
  }
});

/*
 * END SETUP FOR TESTS
 */

/*
 * BEGIN HELPER METHODS
 */

var validate = function(ss, doc, isModifier, isUpsert) {
//we will filter, type convert, and validate everything
//so that we can be sure the filtering and type converting are not invalidating
//documents that should be valid
  doc = ss.clean(doc);
  var context = ss.newContext();
  context.validate(doc, {modifier: isModifier, upsert: isUpsert});
  return context;
};

/*
 * END HELPER METHODS
 */

/*
 * BEGIN TESTS
 */

Tinytest.add("SimpleSchema - Required Checks - Insert - Valid", function(test) {
  var sc = validate(ssr, {
    requiredString: "test",
    requiredBoolean: true,
    requiredNumber: 1,
    requiredDate: (new Date()),
    requiredEmail: "test123@sub.example.edu",
    requiredUrl: "http://google.com",
    requiredObject: {},
    subdoc: {
      requiredString: "test"
    }
  });
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Required Checks - Insert - Invalid", function(test) {
  var sc = validate(ssr, {});
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {
    requiredString: null,
    requiredBoolean: null,
    requiredNumber: null,
    requiredDate: null,
    requiredEmail: null,
    requiredUrl: null,
    requiredObject: null,
    subdoc: {
      requiredString: null
    }
  });
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {
    requiredString: void 0,
    requiredBoolean: void 0,
    requiredNumber: void 0,
    requiredDate: void 0,
    requiredEmail: void 0,
    requiredUrl: void 0,
    requiredObject: void 0,
    subdoc: {
      requiredString: void 0
    }
  });
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {
    requiredString: "",
    requiredBoolean: null,
    requiredNumber: null,
    requiredDate: null,
    requiredEmail: null,
    requiredUrl: null,
    requiredObject: null,
    subdoc: {
      requiredString: ""
    }
  });
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {
    requiredString: "   ",
    requiredBoolean: null,
    requiredNumber: null,
    requiredDate: null,
    requiredEmail: null,
    requiredUrl: null,
    requiredObject: null,
    subdoc: {
      requiredString: "   "
    }
  });
  test.length(sc.invalidKeys(), 8);

  //array of objects
  sc = validate(friends, {
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
      requiredObject: {},
      subdoc: {
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
      requiredObject: {},
      'subdoc.requiredString': "test"
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
      requiredObject: {},
      subdoc: {
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
      requiredObject: {},
      'subdoc.requiredString': "test"
    }}, true, true);
  test.equal(sc.invalidKeys(), []);

  //array of objects
  sc = validate(friends, {$setOnInsert: {
      friends: [{name: 'Bob'}],
      enemies: []
    }}, true, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Required Checks - Upsert - Valid - Combined", function(test) {
  //some in $set and some in $setOnInsert, make sure they're merged for validation purposes
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
      requiredObject: {},
      'subdoc.requiredString': "test"
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
      requiredObject: {},
      'subdoc.requiredString': "test"
    }
  }, true, true);
  test.length(ssrCon.invalidKeys(), 0);
});

Tinytest.add("SimpleSchema - Required Checks - Upsert - Invalid - $set", function(test) {
  var sc = validate(ssr, {$set: {}}, true, true);
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {$set: {
      requiredString: null,
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'subdoc.requiredString': null
    }}, true, true);
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {$set: {
      requiredString: void 0,
      requiredBoolean: void 0,
      requiredNumber: void 0,
      requiredDate: void 0,
      requiredEmail: void 0,
      requiredUrl: void 0,
      requiredObject: void 0,
      'subdoc.requiredString': void 0
    }}, true, true);
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {$set: {
      requiredString: "",
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'subdoc.requiredString': ""
    }}, true, true);
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {$set: {
      requiredString: "   ",
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'subdoc.requiredString': "   "
    }}, true, true);
  test.length(sc.invalidKeys(), 8);
});

Tinytest.add("SimpleSchema - Required Checks - Upsert - Invalid - $setOnInsert", function(test) {
  var sc = validate(ssr, {$setOnInsert: {}}, true, true);
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {$setOnInsert: {
      requiredString: null,
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'subdoc.requiredString': null
    }}, true, true);
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {$setOnInsert: {
      requiredString: void 0,
      requiredBoolean: void 0,
      requiredNumber: void 0,
      requiredDate: void 0,
      requiredEmail: void 0,
      requiredUrl: void 0,
      requiredObject: void 0,
      'subdoc.requiredString': void 0
    }}, true, true);
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {$setOnInsert: {
      requiredString: "",
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'subdoc.requiredString': ""
    }}, true, true);
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {$setOnInsert: {
      requiredString: "   ",
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'subdoc.requiredString': "   "
    }}, true, true);
  test.length(sc.invalidKeys(), 8);
});

Tinytest.add("SimpleSchema - Required Checks - Upsert - Invalid - Combined", function(test) {
  //some in $set and some in $setOnInsert, make sure they're merged for validation purposes

  var sc = validate(ssr, {$setOnInsert: {}, $set: {}}, true, true);
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {
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
      'subdoc.requiredString': null
    }
  }, true, true);
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {
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
      'subdoc.requiredString': void 0
    }
  }, true, true);
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {
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
      'subdoc.requiredString': ""
    }
  }, true, true);
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {
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
      'subdoc.requiredString': "   "
    }
  }, true, true);
  test.length(sc.invalidKeys(), 8);
});

Tinytest.add("SimpleSchema - Required Checks - Update - Valid - $set", function(test) {
  var sc = validate(ssr, {$set: {}}, true);
  test.equal(sc.invalidKeys(), []); //would not cause DB changes, so should not be an error

  sc = validate(ssr, {$set: {
      requiredString: void 0,
      requiredBoolean: void 0,
      requiredNumber: void 0,
      requiredDate: void 0,
      requiredEmail: void 0,
      requiredUrl: void 0,
      requiredObject: void 0,
      'subdoc.requiredString': void 0
    }}, true);
  test.equal(sc.invalidKeys(), []); //would not cause DB changes, so should not be an error

  sc = validate(ssr, {$set: {
      requiredString: "test",
      requiredBoolean: true,
      requiredNumber: 1,
      requiredDate: (new Date()),
      requiredEmail: "test123@sub.example.edu",
      requiredUrl: "http://google.com",
      requiredObject: {},
      'subdoc.requiredString': "test"
    }}, true);
  test.equal(sc.invalidKeys(), []);

  //array of objects
  sc = validate(friends, {$set: {
      'friends.1.name': "Bob"
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(friends, {$set: {
      friends: [{name: 'Bob', type: 'good'}]
    }}, true);
  test.equal(sc.invalidKeys(), []);
});

Tinytest.add("SimpleSchema - Required Checks - Update - Invalid - $set", function(test) {
  var sc = validate(ssr, {$set: {
      requiredString: null,
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'subdoc.requiredString': null
    }}, true);
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {$set: {
      requiredString: "",
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'subdoc.requiredString': ""
    }}, true);
  test.length(sc.invalidKeys(), 8);

  sc = validate(ssr, {$set: {
      requiredString: "   ",
      requiredBoolean: null,
      requiredNumber: null,
      requiredDate: null,
      requiredEmail: null,
      requiredUrl: null,
      requiredObject: null,
      'subdoc.requiredString': "   "
    }}, true);
  test.length(sc.invalidKeys(), 8);

  //array of objects
  sc = validate(friends, {$set: {
      'friends.1.name': null
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {$set: {
      friends: [{name: 'Bob'}]
    }}, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Required Checks - Update - Valid - $unset", function(test) {
  var sc = validate(ssr, {$unset: {}}, true);
  test.equal(sc.invalidKeys(), []); //would not cause DB changes, so should not be an error

  //make sure an optional can be unset when others are required
  //retest with various values to be sure the value is ignored
  sc = validate(ssr, {$unset: {
      anOptionalOne: 1
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ssr, {$unset: {
      anOptionalOne: null
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ssr, {$unset: {
      anOptionalOne: ""
    }}, true);
  test.equal(sc.invalidKeys(), []);

  //array of objects
  sc = validate(friends, {$unset: {
      'friends.1.a.b': ""
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(friends, {$unset: {
      'friends.1.a.b': 1,
      'friends.2.a.b': 1,
      'friends.3.a.b': 1
    }}, true);
  test.equal(sc.invalidKeys(), []);

});

Tinytest.add("SimpleSchema - Required Checks - Update - Invalid - $unset", function(test) {
  var sc = validate(ssr, {$unset: {
      requiredString: 1,
      requiredBoolean: 1,
      requiredNumber: 1,
      requiredDate: 1,
      requiredEmail: 1,
      requiredUrl: 1
    }}, true);
  test.length(sc.invalidKeys(), 6);

  //array of objects
  sc = validate(friends, {$unset: {
      'friends.1.name': 1
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(friends, {$unset: {
      'friends.1.name': 1,
      'friends.2.name': 1,
      'friends.3.name': 1
    }}, true);
  test.length(sc.invalidKeys(), 1);
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
  test.length(sc.invalidKeys(), 1);

  //rename from required key
  sc = ssr.newContext();
  sc.validate({$rename: {requiredString: "newRequiredString"}}, {modifier: true});
  test.length(sc.invalidKeys(), 2); //old is required and new is not in schema
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
  test.length(sc2.invalidKeys(), 1); //without filter

  sc = validate(ss, {
    string: {test: "test"}
  });
  test.equal(sc.invalidKeys(), []); //with filter

  //array string failure
  sc = validate(ss, {
    string: ["test"]
  });
  test.length(sc.invalidKeys(), 1);

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
  test.length(sc2.invalidKeys(), 1); //without filter

  sc = validate(ss, {
    boolean: {test: "test"}
  });
  test.equal(sc.invalidKeys(), []); //with filter

  //array bool failure
  sc = validate(ss, {
    boolean: ["test"]
  });
  test.length(sc.invalidKeys(), 1);

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
  test.length(sc2.invalidKeys(), 1); //without filter

  sc = validate(ss, {
    number: {test: "test"}
  });
  test.equal(sc.invalidKeys(), []); //with filter

  //array number failure
  sc = validate(ss, {
    number: ["test"]
  });
  test.length(sc.invalidKeys(), 1);

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

  //object date failure
  sc2.validate({
    date: {test: "test"}
  });
  test.length(sc2.invalidKeys(), 1); //without filter

  sc = validate(ss, {
    date: {test: "test"}
  });
  test.equal(sc.invalidKeys(), []); //with filter

  //array date failure
  sc = validate(ss, {
    date: ["test"]
  });
  test.length(sc.invalidKeys(), 1);

  //number date failure
  sc = validate(ss, {
    date: 1
  });
  test.length(sc.invalidKeys(), 1);

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
    }}, {modifier: true, upsert: true});
  test.length(sc2.invalidKeys(), 1); //without typeconvert

  sc = validate(ss, {$setOnInsert: {
      string: true
    }}, true, true);
  test.equal(sc.invalidKeys(), []); //with typeconvert

  //number string failure
  sc2.validate({$setOnInsert: {
      string: 1
    }}, {modifier: true, upsert: true});
  test.length(sc2.invalidKeys(), 1); //without typeconvert

  sc = validate(ss, {$setOnInsert: {
      string: 1
    }}, true, true);
  test.equal(sc.invalidKeys(), []); //with typeconvert

  //object string failure
  sc2.validate({$setOnInsert: {
      string: {test: "test"}
    }}, {modifier: true, upsert: true});
  test.length(sc2.invalidKeys(), 1); //without typeconvert

  sc = validate(ss, {$setOnInsert: {
      string: {test: "test"}
    }}, true, true);
  test.equal(sc.invalidKeys(), []); //with typeconvert

  //array string failure
  sc = validate(ss, {$setOnInsert: {
      string: ["test"]
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  //instance string failure
  sc2.validate({$setOnInsert: {
      string: (new Date())
    }}, {modifier: true, upsert: true});
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
    }}, {modifier: true, upsert: true});
  test.length(sc2.invalidKeys(), 1); //without filter

  sc = validate(ss, {$setOnInsert: {
      boolean: {test: "test"}
    }}, true, true);
  test.equal(sc.invalidKeys(), []); //with filter

  //array bool failure
  sc = validate(ss, {$setOnInsert: {
      boolean: ["test"]
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

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
    }}, {modifier: true, upsert: true});
  test.length(sc2.invalidKeys(), 1); //without filter

  sc = validate(ss, {$setOnInsert: {
      number: {test: "test"}
    }}, true, true);
  test.equal(sc.invalidKeys(), []); //with filter

  //array number failure
  sc = validate(ss, {$setOnInsert: {
      number: ["test"]
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

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
    }}, {modifier: true, upsert: true});
  test.length(sc2.invalidKeys(), 1); //without filter

  sc = validate(ss, {$setOnInsert: {
      date: {test: "test"}
    }}, true, true);
  test.equal(sc.invalidKeys(), []); //with filter

  //array date failure
  sc = validate(ss, {$setOnInsert: {
      date: ["test"]
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

  //number date failure
  sc = validate(ss, {$setOnInsert: {
      date: 1
    }}, true, true);
  test.length(sc.invalidKeys(), 1);

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
    }}, {modifier: true});
  test.length(sc2.invalidKeys(), 1); //without typeconvert

  sc = validate(ss, {$set: {
      string: true
    }}, true);
  test.equal(sc.invalidKeys(), []); //with typeconvert

  //number string failure
  sc2.validate({$set: {
      string: 1
    }}, {modifier: true});
  test.length(sc2.invalidKeys(), 1); //without typeconvert

  sc = validate(ss, {$set: {
      string: 1
    }}, true);
  test.equal(sc.invalidKeys(), []); //with typeconvert

  //object string failure
  sc2.validate({$set: {
      string: {test: "test"}
    }}, {modifier: true});
  test.length(sc2.invalidKeys(), 1); //without filter

  sc = validate(ss, {$set: {
      string: {test: "test"}
    }}, true);
  test.equal(sc.invalidKeys(), []); //with filter

  //array string failure
  sc = validate(ss, {$set: {
      string: ["test"]
    }}, true);
  test.length(sc.invalidKeys(), 1);

  //instance string failure
  sc2.validate({$set: {
      string: (new Date())
    }}, {modifier: true});
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
    }}, {modifier: true});
  test.length(sc2.invalidKeys(), 1); //without filter

  sc = validate(ss, {$set: {
      boolean: {test: "test"}
    }}, true);
  test.equal(sc.invalidKeys(), []); //with filter

  //array bool failure
  sc = validate(ss, {$set: {
      boolean: ["test"]
    }}, true);
  test.length(sc.invalidKeys(), 1);

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
    }}, {modifier: true});
  test.length(sc2.invalidKeys(), 1); //without filter

  sc = validate(ss, {$set: {
      number: {test: "test"}
    }}, true);
  test.equal(sc.invalidKeys(), []); //with filter

  //array number failure
  sc = validate(ss, {$set: {
      number: ["test"]
    }}, true);
  test.length(sc.invalidKeys(), 1);

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

  sc = validate(ss, {$set: {
      sub: {number: [29]}
    }}, true);
  test.length(sc.invalidKeys(), 1);

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
    }}, {modifier: true});
  test.length(sc2.invalidKeys(), 1); //without filter

  sc = validate(ss, {$set: {
      date: {test: "test"}
    }}, true);
  test.equal(sc.invalidKeys(), []); //with filter

  //array date failure
  sc = validate(ss, {$set: {
      date: ["test"]
    }}, true);
  test.length(sc.invalidKeys(), 1);

  //number date failure
  sc = validate(ss, {$set: {
      date: 1
    }}, true);
  test.length(sc.invalidKeys(), 1);

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
  sc = validate(ss, {$push: {
      booleanArray: true,
      dateArray: new Date,
      allowedStringsArray: "tuna",
      allowedNumbersArray: 2
    }}, true);
  test.equal(sc.invalidKeys(), []);

  sc = validate(ss, {$addToSet: {
      booleanArray: true,
      dateArray: new Date,
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
  test.length(sc.invalidKeys(), 4);

  sc = validate(ss, {$addToSet: {
      booleanArray: {$each: ["foo", "bar"]},
      dateArray: {$each: ["foo", "bar"]},
      allowedStringsArray: {$each: ["foo", "bar"]},
      allowedNumbersArray: {$each: [200, 500]}
    }}, true);
  test.length(sc.invalidKeys(), 4);

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
  test.length(sc.invalidKeys(), 1);

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
  test.length(sc.invalidKeys(), 1);
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
  test.length(sc.invalidKeys(), 1);
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
  test.length(sc.invalidKeys(), 1);
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
  test.length(sc.invalidKeys(), 1);
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
  test.length(sc.invalidKeys(), 1);
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
    valueIsAllowedString: "pumpkin"
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
    valueIsAllowedNumber: 1
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

  sc = validate(ss, {
    valueIsAllowedString: "pumpkins"
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

  sc = validate(ss, {
    valueIsAllowedNumber: 2
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

  sc = validate(ss, {$setOnInsert: {
      valueIsAllowedString: "pumpkin"
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

  sc = validate(ss, {$setOnInsert: {
      valueIsAllowedNumber: 1
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

  sc = validate(ss, {$setOnInsert: {
      valueIsAllowedString: "pumpkins"
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

  sc = validate(ss, {$setOnInsert: {
      valueIsAllowedNumber: 2
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

  sc = validate(ss, {$set: {
      valueIsAllowedString: "pumpkin"
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
      valueIsAllowedNumber: 1
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

  sc = validate(ss, {$set: {
      valueIsAllowedString: "pumpkins"
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
      valueIsAllowedNumber: 2
    }}, true);
  test.length(sc.invalidKeys(), 1);

  sc = validate(ss, {$set: {
      allowedNumbersArray: [1, 2, 3, 4]
    }}, true);
  test.length(sc.invalidKeys(), 1);
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
});

Tinytest.add("SimpleSchema - Validation Against Another Key - Upsert - Invalid - $setOnInsert", function(test) {
  var sc = validate(pss, {$setOnInsert: {
      password: "password",
      confirmPassword: "password1"
    }}, true, true);
  test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Validation Against Another Key - Update - Invalid - $set", function(test) {
  var sc = validate(pss, {$set: {
      password: "password",
      confirmPassword: "password1"
    }}, true);
  test.length(sc.invalidKeys(), 1);
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

Tinytest.add("SimpleSchema - additionalKeyPatterns", function(test) {
  try {
    var ssWithUnique = new SimpleSchema({
      name: {
        type: String,
        unique: true
      }
    }, {
      additionalKeyPatterns: {
        unique: Match.Optional(Boolean)
      }
    });
  } catch (exception) {
    test.fail({type: 'exception', message: 'define a schema with a unique option in field definition'});
  }

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
});

Tinytest.add("SimpleSchema - Array of Objects", function(test) {
  var sc = validate(friends, {$push: {
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
    requiredObject: {},
    subdoc: {
      requiredString: "test"
    }
  });
  test.length(ssContext1.invalidKeys(), 8);
  test.length(ssContext2.invalidKeys(), 0);
});

Tinytest.add("SimpleSchema - Cleanup With Modifier Operators", function(test) {

  function doTest(given, expected) {
    var cleanObj = ss.clean(given);
    test.equal(cleanObj, expected);
  }

  //BASELINE

  //when you clean a good object it's still good
  doTest({string: "This is a string"}, {string: "This is a string"});
  //when you clean a bad object it's now good
  doTest({string: "This is a string", admin: true}, {string: "This is a string"});
  //type conversion works
  doTest({string: 1}, {string: "1"});

  //$SET

  //when you clean a good object it's still good
  doTest({$set: {string: "This is a string"}}, {$set: {string: "This is a string"}});
  //when you clean a bad object it's now good
  doTest({$set: {string: "This is a string", admin: true}}, {$set: {string: "This is a string"}});
  //type conversion works
  doTest({$set: {string: 1}}, {$set: {string: "1"}});

  //$UNSET

  //when you clean a good object it's still good
  doTest({$unset: {string: null}}, {$unset: {string: null}});
  //when you clean a bad object it's now good
  doTest({$unset: {string: null, admin: null}}, {$unset: {string: null}});

  //$SETONINSERT

  //when you clean a good object it's still good
  doTest({$setOnInsert: {string: "This is a string"}}, {$setOnInsert: {string: "This is a string"}});
  //when you clean a bad object it's now good
  doTest({$setOnInsert: {string: "This is a string", admin: true}}, {$setOnInsert: {string: "This is a string"}});
  //type conversion works
  doTest({$setOnInsert: {string: 1}}, {$setOnInsert: {string: "1"}});

  //$INC

  //when you clean a good object it's still good
  doTest({$inc: {number: 1}}, {$inc: {number: 1}});
  //when you clean a bad object it's now good
  doTest({$inc: {number: 1, admin: 1}}, {$inc: {number: 1}});
  //type conversion works
  doTest({$inc: {number: "1"}}, {$inc: {number: 1}});

  //$ADDTOSET

  //when you clean a good object it's still good
  doTest({$addToSet: {allowedNumbersArray: 1}}, {$addToSet: {allowedNumbersArray: 1}});
  //when you clean a bad object it's now good
  doTest({$addToSet: {allowedNumbersArray: 1, admin: 1}}, {$addToSet: {allowedNumbersArray: 1}});
  //type conversion works
  doTest({$addToSet: {allowedNumbersArray: "1"}}, {$addToSet: {allowedNumbersArray: 1}});

  //$ADDTOSET WITH EACH

  //when you clean a good object it's still good
  doTest({$addToSet: {allowedNumbersArray: {$each: [1, 2, 3]}}}, {$addToSet: {allowedNumbersArray: {$each: [1, 2, 3]}}});
  //when you clean a bad object it's now good
  doTest({$addToSet: {allowedNumbersArray: {$each: [1, 2, 3]}, admin: {$each: [1, 2, 3]}}}, {$addToSet: {allowedNumbersArray: {$each: [1, 2, 3]}}});
  //type conversion works
  doTest({$addToSet: {allowedNumbersArray: {$each: ["1", 2, 3]}}}, {$addToSet: {allowedNumbersArray: {$each: [1, 2, 3]}}});

  //$PUSH

  //when you clean a good object it's still good
  doTest({$push: {allowedNumbersArray: 1}}, {$push: {allowedNumbersArray: 1}});
  //when you clean a bad object it's now good
  doTest({$push: {allowedNumbersArray: 1, admin: 1}}, {$push: {allowedNumbersArray: 1}});
  //type conversion works
  doTest({$push: {allowedNumbersArray: "1"}}, {$push: {allowedNumbersArray: 1}});

  //$PUSH WITH EACH

  //when you clean a good object it's still good
  doTest({$push: {allowedNumbersArray: {$each: [1, 2, 3]}}}, {$push: {allowedNumbersArray: {$each: [1, 2, 3]}}});
  //when you clean a bad object it's now good
  doTest({$push: {allowedNumbersArray: {$each: [1, 2, 3]}, admin: {$each: [1, 2, 3]}}}, {$push: {allowedNumbersArray: {$each: [1, 2, 3]}}});
  //type conversion works
  doTest({$push: {allowedNumbersArray: {$each: ["1", 2, 3]}}}, {$push: {allowedNumbersArray: {$each: [1, 2, 3]}}});

  //$PULL

  //when you clean a good object it's still good
  doTest({$pull: {allowedNumbersArray: 1}}, {$pull: {allowedNumbersArray: 1}});
  //when you clean a bad object it's now good
  doTest({$pull: {allowedNumbersArray: 1, admin: 1}}, {$pull: {allowedNumbersArray: 1}});
  //type conversion works
  doTest({$pull: {allowedNumbersArray: "1"}}, {$pull: {allowedNumbersArray: 1}});

  //$POP

  //when you clean a good object it's still good
  doTest({$pop: {allowedNumbersArray: 1}}, {$pop: {allowedNumbersArray: 1}});
  //when you clean a bad object it's now good
  doTest({$pop: {allowedNumbersArray: 1, admin: 1}}, {$pop: {allowedNumbersArray: 1}});
  //type conversion works
  doTest({$pop: {allowedNumbersArray: "1"}}, {$pop: {allowedNumbersArray: 1}});

  //$PULLALL

  doTest({$pullAll: {allowedNumbersArray: [1, 2, 3]}}, {$pullAll: {allowedNumbersArray: [1, 2, 3]}});
  doTest({$pullAll: {allowedNumbersArray: ["1", 2, 3]}}, {$pullAll: {allowedNumbersArray: [1, 2, 3]}});

  //$PUSHALL (DEPRECATED - SHOULD BE TRANSLATED TO $PUSH+$EACH

  doTest({$pushAll: {allowedNumbersArray: [1, 2, 3]}}, {$push: {allowedNumbersArray: {$each: [1, 2, 3]}}});
  doTest({$pushAll: {allowedNumbersArray: ["1", 2, 3]}}, {$push: {allowedNumbersArray: {$each: [1, 2, 3]}}});
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
  });

});

Tinytest.add("SimpleSchema - Custom Types", function(test) {

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
      if (!(other instanceof Address))
        return false;
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
  c1.validate(person);
  test.length(c1.invalidKeys(), 0);

  var person2 = {
    name: "Person Two",
    createdAt: {},
    file: {},
    address: {}
  };
  c1.validate(person2);
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
  c1 = peopleSchema.newContext();
  c1.validate(person);
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

  test.equal(defs['value'].type, Object, "should change parent definition types to Object");
  test.equal(defs['value.copied'], childDef, "should add child definitions to parent schema");
  test.equal(defs['value.overridden'], parentDef, "parent definitions should override child definitions");
  test.equal(defs['array'].type, [Object], "should change array parent definition types to [Object]");
  test.equal(defs['array.$.copied'], childDef, "should add array child definitions to parent schema");
  test.equal(defs['array.$.overridden'], parentDef, "parent definitions should override array child definitions");
});

Tinytest.add("SimpleSchema - Labels", function(test) {
  //inflection
  test.equal(ss.schema("minMaxNumber").label, "Min max number", '"minMaxNumber" should have inflected to "Min max number" label');

  //dynamic
  ss.labels({"sub.number": "A different label"});
  test.equal(ss.schema("sub.number").label, "A different label", '"sub.number" label should have been changed to "A different label"');
});

Tinytest.add("SimpleSchema - RegEx", function(test) {

  var testSchema = new SimpleSchema({
    one: {
      type: String,
      regEx: [
        /^A/,
        /B$/
      ]
    }
  });

  testSchema.messages({
    'regEx': 'Message One',
    'regEx one': 'Message Two',
    'regEx.0 one': 'Message Three',
    'regEx.1 one': 'Message Four'
  });

  var c1 = testSchema.newContext();
  c1.validate({one: "BBB"});
  test.length(c1.invalidKeys(), 1);

  var err = c1.invalidKeys()[0] || {};
  test.equal(err.message, 'Message Three');

  c1.validate({one: "AAA"});
  test.length(c1.invalidKeys(), 1);

  err = c1.invalidKeys()[0] || {};
  test.equal(err.message, 'Message Four');

  c1.validate({one: "CCC"});
  test.length(c1.invalidKeys(), 1);

  err = c1.invalidKeys()[0] || {};
  test.equal(err.message, 'Message Three');

  c1.validate({one: "ACB"});
  test.length(c1.invalidKeys(), 0);
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

Tinytest.add("SimpleSchema - Issue 30", function(test) {
  var is30ss = new SimpleSchema({
    firstname: {
      type: String,
      label: "First name",
      optional: true
    },
    lastname: {
      type: String,
      label: "Last name",
      optional: true,
      valueIsAllowed: function(val, doc, op) {
        if (!op) { //insert
          if ((doc.firstname && doc.firstname.length) && (!val || !val.length)) {
            return false;
          } else {
            return true;
          }
        }
        if (op === "$set") { //update
          if ((doc.$set.firstname && doc.$set.firstname.length)
                  && (!val || !val.length)) {
            return false;
          } else {
            return true;
          }
        }
        return false; //allow only inserts and $set
      }
    }
  });

  var is30sc = validate(is30ss, {
    firstname: "name"
  });
  test.equal(is30sc.invalidKeys()[0]["type"], "notAllowed");

  is30sc = validate(is30ss, {
    firstname: "name",
    lastname: ""
  });
  test.equal(is30sc.invalidKeys()[0]["type"], "notAllowed");

  is30sc = validate(is30ss, {
    firstname: "name",
    lastname: "name"
  });
  test.equal(is30sc.invalidKeys(), []);

  is30sc = validate(is30ss, {$set: {
      firstname: "name"
    }}, true);
  test.equal(is30sc.invalidKeys()[0]["type"], "notAllowed");

  is30sc = validate(is30ss, {$set: {
      firstname: "name",
      lastname: ""
    }}, true);
  test.equal(is30sc.invalidKeys()[0]["type"], "notAllowed");

  is30sc = validate(is30ss, {$set: {
      firstname: "name",
      lastname: "name"
    }}, true);
  test.equal(is30sc.invalidKeys(), []);

});

/*
 * END TESTS
 */