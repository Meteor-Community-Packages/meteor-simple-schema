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
    integer: true,
    optional: true
  },
  sub: {
    type: Object,
    optional: true
  },
  'sub.number': {
    type: Number,
    integer: true,
    optional: true
  },
  minMaxNumber: {
    type: Number,
    integer: true,
    optional: true,
    min: 10,
    max: 20
  },
  minZero: {
    type: Number,
    integer: true,
    optional: true,
    min: 0
  },
  maxZero: {
    type: Number,
    integer: true,
    optional: true,
    max: 0
  },
  minMaxNumberCalculated: {
    type: Number,
    integer: true,
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
    integer: true,
    optional: true,
    min: 10,
    max: 20,
    exclusiveMax: true,
    exclusiveMin: true
  },
  minMaxNumberInclusive: {
    type: Number,
    integer: true,
    optional: true,
    min: 10,
    max: 20,
    exclusiveMax: false,
    exclusiveMin: false
  },
  allowedNumbers: {
    type: Number,
    integer: true,
    optional: true,
    allowedValues: [1, 2, 3]
  },
  allowedNumbersArray: {
    type: Array,
    optional: true,
  },
  'allowedNumbersArray.$': {
    type: Number,
    integer: true,
    allowedValues: [1, 2, 3]
  },
  decimal: {
    type: Number,
    optional: true
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
    type: Array,
    optional: true
  },
  'oid.$': {
    type: Meteor.Collection.ObjectID,
  },
  noTrimString: {
    type: String,
    optional: true,
    trim: false
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

  // Type convert to array
  myObj = {allowedStringsArray: 'tuna'};
  ss.clean(myObj);
  test.equal(myObj, {allowedStringsArray: ['tuna']});

  myObj = {$set: {allowedStringsArray: 'tuna'}};
  ss.clean(myObj, {isModifier: true});
  test.equal(myObj, {$set: {allowedStringsArray: ['tuna']}});

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

  // Trim false
  doTest(false, {noTrimString: "    This is a string    "}, {noTrimString: "    This is a string    "});

  // Trim false with autoConvert
  var cleanObj = ss.clean({noTrimString: "    This is a string    "}, {
    filter: false,
    autoConvert: true,
    removeEmptyStrings: false,
    trimStrings: true,
    getAutoValues: false,
    isModifier: false
  });
  test.equal(cleanObj, {noTrimString: "    This is a string    "});
});
