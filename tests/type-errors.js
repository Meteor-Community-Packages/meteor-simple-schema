var ss = new SimpleSchema({
  string: {
    type: String,
    optional: true
  },
  allowedStringsArray: {
    type: Array,
    optional: true
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
    type: Boolean
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
  allowedNumbersArray: {
    type: Array,
    optional: true
  },
  'allowedNumbersArray.$': {
    type: Number,
    integer: true,
    allowedValues: [1, 2, 3]
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
    type: Date
  }
});

function validate(doc, isModifier, isUpsert) {
  var context = ss.newContext();
  context.validate(doc, {modifier: isModifier, upsert: isUpsert});
  return context;
}

Tinytest.add("SimpleSchema - Type Checks - Insert", function(test) {
  var sc = validate({
    string: "test",
    boolean: true,
    number: 1,
    date: new Date()
  });
  test.equal(sc.validationErrors(), []);

  /* STRING FAILURES */

  // Boolean should be String
  sc = validate({
    string: true
  });
  test.length(sc.validationErrors(), 1);

  // Number should be String
  sc = validate({
    string: 1
  });
  test.length(sc.validationErrors(), 1);

  // Object should be String
  sc = validate({
    string: {test: "test"}
  });
  test.length(sc.validationErrors(), 2);

  // Array should be String
  sc = validate({
    string: ["test"]
  });
  test.length(sc.validationErrors(), 2);

  // Date should be String
  sc = validate({
    string: new Date()
  });
  test.length(sc.validationErrors(), 1);

  /* BOOLEAN FAILURES */

  // String should be Boolean
  sc = validate({
    boolean: "test"
  });
  test.length(sc.validationErrors(), 1);

  // Number should be Boolean
  sc = validate({
    boolean: 1
  });
  test.length(sc.validationErrors(), 1);

  // Object should be Boolean
  sc = validate({
    boolean: {test: "test"}
  });
  test.length(sc.validationErrors(), 2);

  // Array should be Boolean
  sc = validate({
    boolean: ["test"]
  });
  test.length(sc.validationErrors(), 2);

  // Date should be Boolean
  sc = validate({
    boolean: new Date()
  });
  test.length(sc.validationErrors(), 1);

  /* NUMBER FAILURES */

  // String should be Number
  sc = validate({
    number: "test"
  });
  test.length(sc.validationErrors(), 1);

  // Boolean should be Number
  sc = validate({
    number: true
  });
  test.length(sc.validationErrors(), 1);

  // Object should be Number
  sc = validate({
    number: {test: "test"}
  });
  test.length(sc.validationErrors(), 2);

  // Array should be Number
  sc = validate({
    number: ["test"]
  });
  test.length(sc.validationErrors(), 2);

  // Date should be Number
  sc = validate({
    number: new Date()
  });
  test.length(sc.validationErrors(), 1);

  // NaN should be Number
  sc = validate({
    number: NaN
  });
  test.length(sc.validationErrors(), 1);

  /* INSTANCE FAILURES */

  // String should be Date
  sc = validate({
    date: "test"
  });
  test.length(sc.validationErrors(), 1);

  // Boolean should be Date
  sc = validate({
    date: true
  });
  test.length(sc.validationErrors(), 1);

  // Invalid Date should be Date
  sc = validate({
    date: new Date('foo')
  });
  test.length(sc.validationErrors(), 1);

  // Object should be Date
  sc = validate({
    date: {test: "test"}
  });
  test.length(sc.validationErrors(), 2);

  // Array should be Date
  sc = validate({
    date: ["test"]
  });
  test.length(sc.validationErrors(), 2);
});

Tinytest.add("SimpleSchema - Type Checks - Upsert", function(test) {
  // These should validate the same as insert

  var sc = validate({$setOnInsert: {
      string: "test",
      boolean: true,
      number: 1,
      date: new Date()
    }}, true, true);
  test.equal(sc.validationErrors(), []);

  /* STRING FAILURES */

  // Boolean should be String
  sc = validate({$setOnInsert: {
    string: true
  }}, true, true);
  test.length(sc.validationErrors(), 1);

  // Number should be String
  sc = validate({$setOnInsert: {
    string: 1
  }}, true, true);
  test.length(sc.validationErrors(), 1);

  // Object should be String
  sc = validate({$setOnInsert: {
    string: {test: "test"}
  }}, true, true);
  test.length(sc.validationErrors(), 2);

  // Array should be String
  sc = validate({$setOnInsert: {
    string: ["test"]
  }}, true, true);
  test.length(sc.validationErrors(), 2);

  // Date should be String
  sc = validate({$setOnInsert: {
    string: new Date()
  }}, true, true);
  test.length(sc.validationErrors(), 1);

  /* BOOLEAN FAILURES */

  // String should be Boolean
  sc = validate({$setOnInsert: {
    boolean: "test"
  }}, true, true);
  test.length(sc.validationErrors(), 1);

  // Number should be Boolean
  sc = validate({$setOnInsert: {
    boolean: 1
  }}, true, true);
  test.length(sc.validationErrors(), 1);

  // Object should be Boolean
  sc = validate({$setOnInsert: {
    boolean: {test: "test"}
  }}, true, true);
  test.length(sc.validationErrors(), 2);

  // Array should be Boolean
  sc = validate({$setOnInsert: {
    boolean: ["test"]
  }}, true, true);
  test.length(sc.validationErrors(), 2);

  // Date should be Boolean
  sc = validate({$setOnInsert: {
    boolean: new Date()
  }}, true, true);
  test.length(sc.validationErrors(), 1);

  /* NUMBER FAILURES */

  // String should be Number
  sc = validate({$setOnInsert: {
    number: "test"
  }}, true, true);
  test.length(sc.validationErrors(), 1);

  // Boolean should be Number
  sc = validate({$setOnInsert: {
    number: true
  }}, true, true);
  test.length(sc.validationErrors(), 1);

  // Object should be Number
  sc = validate({$setOnInsert: {
    number: {test: "test"}
  }}, true, true);
  test.length(sc.validationErrors(), 2);

  // Array should be Number
  sc = validate({$setOnInsert: {
    number: ["test"]
  }}, true, true);
  test.length(sc.validationErrors(), 2);

  // Date should be Number
  sc = validate({$setOnInsert: {
    number: new Date()
  }}, true, true);
  test.length(sc.validationErrors(), 1);

  /* INSTANCE FAILURES */

  // String should be Date
  sc = validate({$setOnInsert: {
    date: "test"
  }}, true, true);
  test.length(sc.validationErrors(), 1);

  // Boolean should be Date
  sc = validate({$setOnInsert: {
    date: true
  }}, true, true);
  test.length(sc.validationErrors(), 1);

  // Object should be Date
  sc = validate({$setOnInsert: {
    date: {test: "test"}
  }}, true, true);
  test.length(sc.validationErrors(), 2);

  // Array should be Date
  sc = validate({$setOnInsert: {
    date: ["test"]
  }}, true, true);
  test.length(sc.validationErrors(), 2);
});

Tinytest.add("SimpleSchema - Type Checks - Update", function(test) {
  var sc = validate({$set: {
    string: "test",
    boolean: true,
    number: 1,
    date: new Date()
  }}, true);
  test.equal(sc.validationErrors(), []);

  /* STRING FAILURES */

  // Boolean should be String
  sc = validate({$set: {
    string: true
  }}, true);
  test.length(sc.validationErrors(), 1);

  // Number should be String
  sc = validate({$set: {
    string: 1
  }}, true);
  test.length(sc.validationErrors(), 1);

  // Object should be String
  sc = validate({$set: {
    string: {test: "test"}
  }}, true);
  test.length(sc.validationErrors(), 2);

  // Array should be String
  sc = validate({$set: {
    string: ["test"]
  }}, true);
  test.length(sc.validationErrors(), 2);

  //instance string failure
  sc = validate({$set: {
    string: (new Date())
  }}, true);
  test.length(sc.validationErrors(), 1);

  /* BOOLEAN FAILURES */

  // String should be Boolean
  sc = validate({$set: {
    boolean: "test"
  }}, true);
  test.length(sc.validationErrors(), 1);

  // Number should be Boolean
  sc = validate({$set: {
    boolean: 1
  }}, true);
  test.length(sc.validationErrors(), 1);

  // Object should be Boolean
  sc = validate({$set: {
    boolean: {test: "test"}
  }}, true);
  test.length(sc.validationErrors(), 2);

  // Array should be Boolean
  sc = validate({$set: {
    boolean: ["test"]
  }}, true);
  test.length(sc.validationErrors(), 2);

  // Date should be Boolean
  sc = validate({$set: {
    boolean: new Date()
  }}, true);
  test.length(sc.validationErrors(), 1);

  /* NUMBER FAILURES */

  // String should be Number
  sc = validate({$set: {
    number: "test"
  }}, true);
  test.length(sc.validationErrors(), 1);

  // Boolean should be Number
  sc = validate({$set: {
    number: true
  }}, true);
  test.length(sc.validationErrors(), 1);

  // Object should be Number
  sc = validate({$set: {
    number: {test: "test"}
  }}, true);
  test.length(sc.validationErrors(), 2);

  // Array should be Number
  sc = validate({$set: {
    number: ["test"]
  }}, true);
  test.length(sc.validationErrors(), 2);

  // Date should be Number
  sc = validate({$set: {
    number: new Date()
  }}, true);
  test.length(sc.validationErrors(), 1);

  // Number should be Number in dotted $set
  sc = validate({$set: {
    'sub.number': 29
  }}, true);
  test.length(sc.validationErrors(), 0);

  // Number should be Number in $set to object
  sc = validate({$set: {
    sub: {number: 29}
  }}, true);
  test.length(sc.validationErrors(), 0);

  // Boolean should be Number in $set to object
  sc = validate({$set: {
    sub: {number: true}
  }}, true);
  test.length(sc.validationErrors(), 1);

  // Array of Numbers should be Number in $set to object
  sc = validate({$set: {
    sub: {number: [29]}
  }}, true);
  test.length(sc.validationErrors(), 2);

  /* INSTANCE FAILURES */

  // String should be Date
  sc = validate({$set: {
    date: "test"
  }}, true);
  test.length(sc.validationErrors(), 1);

  // Boolean should be Date
  sc = validate({$set: {
    date: true
  }}, true);
  test.length(sc.validationErrors(), 1);

  // Object should be Date
  sc = validate({$set: {
    date: {test: "test"}
  }}, true);
  test.length(sc.validationErrors(), 2);

  // Array should be Date
  sc = validate({$set: {
    date: ["test"]
  }}, true);
  test.length(sc.validationErrors(), 2);

  /* ARRAY FAILURES */

  // Should be Array
  sc = validate({$set: {
    booleanArray: true,
    dateArray: new Date(),
    allowedStringsArray: "tuna",
    allowedNumbersArray: 2
  }}, true);
  test.length(sc.validationErrors(), 4);

  // Should be Array
  sc = validate({$push: {
    booleanArray: "blah",
    dateArray: "blah",
    allowedStringsArray: "blah",
    allowedNumbersArray: 200
  }}, true);
  test.length(sc.validationErrors(), 4);

  // Should be Array
  sc = validate({$addToSet: {
    booleanArray: "blah",
    dateArray: "blah",
    allowedStringsArray: "blah",
    allowedNumbersArray: 200
  }}, true);
  test.length(sc.validationErrors(), 4);

  // Array should be Array
  sc = validate({$set: {
    booleanArray: [true],
    dateArray: [new Date()],
    allowedStringsArray: ["tuna"],
    allowedNumbersArray: [2]
  }}, true);
  test.equal(sc.validationErrors(), []);

  // Check array item type if operator is $push
  sc = validate({$push: {
    booleanArray: true,
    dateArray: new Date(),
    allowedStringsArray: "tuna",
    allowedNumbersArray: 2
  }}, true);
  test.equal(sc.validationErrors(), []);

  // Check array item type if operator is $addToSet
  sc = validate({$addToSet: {
    booleanArray: true,
    dateArray: new Date(),
    allowedStringsArray: "tuna",
    allowedNumbersArray: 2
  }}, true);
  test.equal(sc.validationErrors(), []);

  // $push + $each with two invalid array items
  sc = validate({$push: {
    booleanArray: {
      $each: ["foo", "bar"]
    },
    dateArray: {
      $each: ["foo", "bar"]
    },
    allowedStringsArray: {
      $each: ["foo", "bar"]
    },
    allowedNumbersArray: {
      $each: [200, 500]
    }
  }
}, true);
  test.length(sc.validationErrors(), 8);

  // $addToSet + $each with two invalid array items
  sc = validate({$addToSet: {
    booleanArray: {$each: ["foo", "bar"]},
    dateArray: {$each: ["foo", "bar"]},
    allowedStringsArray: {$each: ["foo", "bar"]},
    allowedNumbersArray: {$each: [200, 500]}
  }}, true);
  test.length(sc.validationErrors(), 8);

  // $push + $each with one invalid and one valid array item
  sc = validate({$push: {
    booleanArray: {$each: ["foo", true]},
    dateArray: {$each: ["foo", (new Date())]},
    allowedStringsArray: {$each: ["foo", "tuna"]},
    allowedNumbersArray: {$each: [200, 1]}
  }}, true);
  test.length(sc.validationErrors(), 4);

  // $addToSet + $each with one invalid and one valid array item
  sc = validate({$addToSet: {
    booleanArray: {$each: ["foo", true]},
    dateArray: {$each: ["foo", (new Date())]},
    allowedStringsArray: {$each: ["foo", "tuna"]},
    allowedNumbersArray: {$each: [200, 1]}
  }}, true);
  test.length(sc.validationErrors(), 4);

  // $push + $each with two valid array items
  sc = validate({$push: {
    booleanArray: {$each: [false, true]},
    dateArray: {$each: [(new Date()), (new Date())]},
    allowedStringsArray: {$each: ["tuna", "fish"]},
    allowedNumbersArray: {$each: [2, 1]}
  }}, true);
  test.equal(sc.validationErrors(), []);

  // $addToSet + $each with two valid array items
  sc = validate({$addToSet: {
    booleanArray: {$each: [false, true]},
    dateArray: {$each: [(new Date()), (new Date())]},
    allowedStringsArray: {$each: ["tuna", "fish"]},
    allowedNumbersArray: {$each: [2, 1]}
  }}, true);
  test.equal(sc.validationErrors(), []);

  // It ignores $slice
  sc = validate({$push: {
    booleanArray: {$each: [false, true], $slice: -5},
    dateArray: {$each: [(new Date()), (new Date())], $slice: -5},
    allowedStringsArray: {$each: ["tuna", "fish"], $slice: -5},
    allowedNumbersArray: {$each: [2, 1], $slice: -5}
  }}, true);
  test.equal(sc.validationErrors(), []);

  // Pull, pullAll, and pop should be ignored; no validation
  sc = validate({$pull: {
    booleanArray: "foo",
    dateArray: "foo",
    allowedStringsArray: "foo",
    allowedNumbersArray: 200
  }}, true);
  test.equal(sc.validationErrors(), []);

  sc = validate({$pull: {
    booleanArray: {$each: ["foo", "bar"]},
    dateArray: {$each: ["foo", "bar"]},
    allowedStringsArray: {$each: ["foo", "bar"]},
    allowedNumbersArray: {$each: [200, 500]}
  }}, true);
  test.equal(sc.validationErrors(), []);

  sc = validate({$pullAll: {
    booleanArray: ["foo", "bar"],
    dateArray: ["foo", "bar"],
    allowedStringsArray: ["foo", "bar"],
    allowedNumbersArray: [200, 500]
  }}, true);
  test.equal(sc.validationErrors(), []);

  sc = validate({$pop: {
    booleanArray: 1,
    dateArray: 1,
    allowedStringsArray: 1,
    allowedNumbersArray: 1
  }}, true);
  test.equal(sc.validationErrors(), []);

  sc = validate({$pop: {
    booleanArray: -1,
    dateArray: -1,
    allowedStringsArray: -1,
    allowedNumbersArray: -1
  }}, true);
  test.equal(sc.validationErrors(), []);
});
