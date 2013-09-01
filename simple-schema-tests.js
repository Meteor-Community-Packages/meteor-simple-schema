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
        optional: true
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
            return val === "pumpkin";
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
    minMaxNumber: {
        type: Number,
        optional: true,
        min: 10,
        max: 20
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
            return val === 1;
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
var validate = function(ss, doc, isModifier) {
//we will filter, type convert, and validate everything
//so that we can be sure the filtering and type converting are not invalidating
//documents that should be valid
    doc = ss.clean(doc);
    var context = ss.newContext();
    context.validate(doc, {modifier: isModifier});
    return context;
};

Tinytest.add("SimpleSchema - Insert Required", function(test) {
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

    //test opposite case
    sc = validate(ssr, {
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
    test.length(sc.invalidKeys(), 0);
});

Tinytest.add("SimpleSchema - Upsert Required", function(test) {
    //$setOnInsert should be validated just like inserts

    var sc = validate(ssr, {$setOnInsert: {}}, true);
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
        }}, true);
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
        }}, true);
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
        }}, true);
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
        }}, true);
    test.length(sc.invalidKeys(), 8);

    //test opposite case
    sc = validate(ssr, {$setOnInsert: {
            requiredString: "test",
            requiredBoolean: true,
            requiredNumber: 1,
            requiredDate: (new Date()),
            requiredEmail: "test123@sub.example.edu",
            requiredUrl: "http://google.com",
            requiredObject: {},
            'subdoc.requiredString': "test"
        }}, true);
    test.length(sc.invalidKeys(), 0);
});

Tinytest.add("SimpleSchema - Set Required", function(test) {
    var sc = validate(ssr, {$set: {}}, true);
    test.length(sc.invalidKeys(), 0); //would not cause DB changes, so should not be an error

    sc = validate(ssr, {$set: {
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
            requiredString: void 0,
            requiredBoolean: void 0,
            requiredNumber: void 0,
            requiredDate: void 0,
            requiredEmail: void 0,
            requiredUrl: void 0,
            requiredObject: void 0,
            'subdoc.requiredString': void 0
        }}, true);
    test.length(sc.invalidKeys(), 0); //would not cause DB changes, so should not be an error

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

    //test opposite case
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
    test.length(sc.invalidKeys(), 0);
});
Tinytest.add("SimpleSchema - Unset Required", function(test) {
    var sc = validate(ssr, {$unset: {}}, true);
    test.length(sc.invalidKeys(), 0); //would not cause DB changes, so should not be an error

    sc = validate(ssr, {$unset: {
            requiredString: 1,
            requiredBoolean: 1,
            requiredNumber: 1,
            requiredDate: 1,
            requiredEmail: 1,
            requiredUrl: 1
        }}, true);
    test.length(sc.invalidKeys(), 6);
    //make sure an optional can be unset when others are required
    sc = validate(ssr, {$unset: {
            anOptionalOne: 1
        }}, true);
    test.length(sc.invalidKeys(), 0);
});
Tinytest.add("SimpleSchema - Insert Type Check", function(test) {
    var sc = validate(ss, {
        string: "test",
        boolean: true,
        number: 1,
        decimal: 1.1,
        date: (new Date()),
        url: "http://google.com",
        email: "test123@sub.example.edu"
    });
    test.length(sc.invalidKeys(), 0);
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
    test.length(sc.invalidKeys(), 0); //with typeconvert

    //number string failure
    sc2.validate({
        string: 1
    });
    test.length(sc2.invalidKeys(), 1); //without typeconvert

    sc = validate(ss, {
        string: 1
    });
    test.length(sc.invalidKeys(), 0); //with typeconvert

    //object string failure
    sc2.validate({
        string: {test: "test"}
    });
    test.length(sc2.invalidKeys(), 1); //without typeconvert

    sc = validate(ss, {
        string: {test: "test"}
    });
    test.length(sc.invalidKeys(), 0); //with typeconvert

    //array string failure
    sc = validate(ss, {
        string: ["test"]
    });
    test.length(sc.invalidKeys(), 1);
    //instance string failure
    sc2.validate({
        string: (new Date())
    });
    test.length(sc2.invalidKeys(), 1); //without typeconvert

    sc = validate(ss, {
        string: (new Date())
    });
    test.length(sc.invalidKeys(), 0); //with typeconvert

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
    sc = validate(ss, {
        boolean: {test: "test"}
    });
    test.length(sc.invalidKeys(), 1);
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
    sc = validate(ss, {
        number: {test: "test"}
    });
    test.length(sc.invalidKeys(), 1);
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
    sc = validate(ss, {
        date: {test: "test"}
    });
    test.length(sc.invalidKeys(), 1);
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

Tinytest.add("SimpleSchema - Upsert Type Check", function(test) {
    //$setOnInsert should validate the same as insert

    var sc = validate(ss, {$setOnInsert: {
            string: "test",
            boolean: true,
            number: 1,
            decimal: 1.1,
            date: (new Date()),
            url: "http://google.com",
            email: "test123@sub.example.edu"
        }}, true);
    test.length(sc.invalidKeys(), 0);
    /* STRING FAILURES */

    //boolean string failure
    var sc2 = ss.newContext();
    sc2.validate({$setOnInsert: {
            string: true
        }}, {modifier: true});
    test.length(sc2.invalidKeys(), 1); //without typeconvert

    sc = validate(ss, {$setOnInsert: {
            string: true
        }}, true);
    test.length(sc.invalidKeys(), 0); //with typeconvert

    //number string failure
    sc2.validate({$setOnInsert: {
            string: 1
        }}, {modifier: true});
    test.length(sc2.invalidKeys(), 1); //without typeconvert

    sc = validate(ss, {$setOnInsert: {
            string: 1
        }}, true);
    test.length(sc.invalidKeys(), 0); //with typeconvert

    //object string failure
    sc2.validate({$setOnInsert: {
            string: {test: "test"}
        }}, {modifier: true});
    test.length(sc2.invalidKeys(), 1); //without typeconvert

    sc = validate(ss, {$setOnInsert: {
            string: {test: "test"}
        }}, true);
    test.length(sc.invalidKeys(), 0); //with typeconvert

    //array string failure
    sc = validate(ss, {$setOnInsert: {
            string: ["test"]
        }}, true);
    test.length(sc.invalidKeys(), 1);
    //instance string failure
    sc2.validate({$setOnInsert: {
            string: (new Date())
        }}, {modifier: true});
    test.length(sc2.invalidKeys(), 1); //without typeconvert

    sc = validate(ss, {$setOnInsert: {
            string: (new Date())
        }}, true);
    test.length(sc.invalidKeys(), 0); //with typeconvert

    /* BOOLEAN FAILURES */

    //string bool failure
    sc = validate(ss, {$setOnInsert: {
            boolean: "test"
        }}, true);
    test.length(sc.invalidKeys(), 1);
    //number bool failure
    sc = validate(ss, {$setOnInsert: {
            boolean: 1
        }}, true);
    test.length(sc.invalidKeys(), 1);
    //object bool failure
    sc = validate(ss, {$setOnInsert: {
            boolean: {test: "test"}
        }}, true);
    test.length(sc.invalidKeys(), 1);
    //array bool failure
    sc = validate(ss, {$setOnInsert: {
            boolean: ["test"]
        }}, true);
    test.length(sc.invalidKeys(), 1);
    //instance bool failure
    sc = validate(ss, {$setOnInsert: {
            boolean: (new Date())
        }}, true);
    test.length(sc.invalidKeys(), 1);
    /* NUMBER FAILURES */

    //string number failure
    sc = validate(ss, {$setOnInsert: {
            number: "test"
        }}, true);
    test.length(sc.invalidKeys(), 1);
    //boolean number failure
    sc = validate(ss, {$setOnInsert: {
            number: true
        }}, true);
    test.length(sc.invalidKeys(), 1);
    //object number failure
    sc = validate(ss, {$setOnInsert: {
            number: {test: "test"}
        }}, true);
    test.length(sc.invalidKeys(), 1);
    //array number failure
    sc = validate(ss, {$setOnInsert: {
            number: ["test"]
        }}, true);
    test.length(sc.invalidKeys(), 1);
    //instance number failure
    sc = validate(ss, {$setOnInsert: {
            number: (new Date())
        }}, true);
    test.length(sc.invalidKeys(), 1);
    //decimal number failure
    sc = validate(ss, {$setOnInsert: {
            number: 1.1
        }}, true);
    test.length(sc.invalidKeys(), 1);
    /* INSTANCE FAILURES */

    //string date failure
    sc = validate(ss, {$setOnInsert: {
            date: "test"
        }}, true);
    test.length(sc.invalidKeys(), 1);
    //boolean date failure
    sc = validate(ss, {$setOnInsert: {
            date: true
        }}, true);
    test.length(sc.invalidKeys(), 1);
    //object date failure
    sc = validate(ss, {$setOnInsert: {
            date: {test: "test"}
        }}, true);
    test.length(sc.invalidKeys(), 1);
    //array date failure
    sc = validate(ss, {$setOnInsert: {
            date: ["test"]
        }}, true);
    test.length(sc.invalidKeys(), 1);
    //number date failure
    sc = validate(ss, {$setOnInsert: {
            date: 1
        }}, true);
    test.length(sc.invalidKeys(), 1);
    /* REGEX FAILURES */

    sc = validate(ss, {$setOnInsert: {
            url: "blah"
        }}, true);
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {$setOnInsert: {
            email: "blah"
        }}, true);
    test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Update Type Check", function(test) {
    var sc = validate(ss, {$set: {
            string: "test",
            boolean: true,
            number: 1,
            date: (new Date()),
            url: "http://google.com",
            email: "test123@sub.example.edu"
        }}, true);
    test.length(sc.invalidKeys(), 0);
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
    test.length(sc.invalidKeys(), 0); //with typeconvert

    //number string failure
    sc2.validate({$set: {
            string: 1
        }}, {modifier: true});
    test.length(sc2.invalidKeys(), 1); //without typeconvert

    sc = validate(ss, {$set: {
            string: 1
        }}, true);
    test.length(sc.invalidKeys(), 0); //with typeconvert

    //object string failure
    sc2.validate({$set: {
            string: {test: "test"}
        }}, {modifier: true});
    test.length(sc2.invalidKeys(), 1); //without typeconvert

    sc = validate(ss, {$set: {
            string: {test: "test"}
        }}, true);
    test.length(sc.invalidKeys(), 0); //with typeconvert

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
    test.length(sc.invalidKeys(), 0); //with typeconvert

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
    sc = validate(ss, {$set: {
            boolean: {test: "test"}
        }}, true);
    test.length(sc.invalidKeys(), 1);
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
    sc = validate(ss, {$set: {
            number: {test: "test"}
        }}, true);
    test.length(sc.invalidKeys(), 1);
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
    sc = validate(ss, {$set: {
            date: {test: "test"}
        }}, true);
    test.length(sc.invalidKeys(), 1);
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
    test.length(sc.invalidKeys(), 0);

    sc = validate(ss, {$addToSet: {
            booleanArray: {$each: [false, true]},
            dateArray: {$each: [(new Date()), (new Date())]},
            allowedStringsArray: {$each: ["tuna", "fish"]},
            allowedNumbersArray: {$each: [2, 1]}
        }}, true);
    test.length(sc.invalidKeys(), 0);
    
    //make sure slice is ignored
    sc = validate(ss, {$push: {
            booleanArray: {$each: [false, true], $slice: -5},
            dateArray: {$each: [(new Date()), (new Date())], $slice: -5},
            allowedStringsArray: {$each: ["tuna", "fish"], $slice: -5},
            allowedNumbersArray: {$each: [2, 1], $slice: -5}
        }}, true);
    test.length(sc.invalidKeys(), 0);

    //pull, pullAll, and pop should be ignored; no validation
    sc = validate(ss, {$pull: {
            booleanArray: "foo",
            dateArray: "foo",
            allowedStringsArray: "foo",
            allowedNumbersArray: 200
        }}, true);
    test.length(sc.invalidKeys(), 0);

    sc = validate(ss, {$pull: {
            booleanArray: {$each: ["foo", "bar"]},
            dateArray: {$each: ["foo", "bar"]},
            allowedStringsArray: {$each: ["foo", "bar"]},
            allowedNumbersArray: {$each: [200, 500]}
        }}, true);
    test.length(sc.invalidKeys(), 0);

    sc = validate(ss, {$pullAll: {
            booleanArray: ["foo", "bar"],
            dateArray: ["foo", "bar"],
            allowedStringsArray: ["foo", "bar"],
            allowedNumbersArray: [200, 500]
        }}, true);
    test.length(sc.invalidKeys(), 0);
    
    sc = validate(ss, {$pop: {
            booleanArray: 1,
            dateArray: 1,
            allowedStringsArray: 1,
            allowedNumbersArray: 1
        }}, true);
    test.length(sc.invalidKeys(), 0);
    
    sc = validate(ss, {$pop: {
            booleanArray: -1,
            dateArray: -1,
            allowedStringsArray: -1,
            allowedNumbersArray: -1
        }}, true);
    test.length(sc.invalidKeys(), 0);
});

Tinytest.add("SimpleSchema - Insert Min Check", function(test) {
    /* STRING LENGTH */
    var sc = validate(ss, {
        minMaxString: "longenough"
    });
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {
        minMaxString: "short"
    });
    test.length(sc.invalidKeys(), 1);
    /* NUMBER */
    sc = validate(ss, {
        minMaxNumber: 10
    });
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {
        minMaxNumber: 9
    });
    test.length(sc.invalidKeys(), 1);
    /* DATE */
    sc = validate(ss, {
        minMaxDate: (new Date(Date.UTC(2013, 0, 1)))
    });
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {
        minMaxDate: (new Date(Date.UTC(2012, 11, 31)))
    });
    test.length(sc.invalidKeys(), 1);
    /* ARRAY COUNT PLUS STRING LENGTH */
    sc = validate(ss, {
        minMaxStringArray: ["longenough", "longenough"]
    });
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {
        minMaxStringArray: ["short", "short"]
    });
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {
        minMaxStringArray: []
    });
    test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Upsert Min Check", function(test) {
    /* STRING LENGTH */
    var sc = validate(ss, {$setOnInsert: {
            minMaxString: "longenough"
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$setOnInsert: {
            minMaxString: "short"
        }}, true);
    test.length(sc.invalidKeys(), 1);
    /* NUMBER */
    sc = validate(ss, {$setOnInsert: {
            minMaxNumber: 10
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$setOnInsert: {
            minMaxNumber: 9
        }}, true);
    test.length(sc.invalidKeys(), 1);
    /* DATE */
    sc = validate(ss, {$setOnInsert: {
            minMaxDate: (new Date(Date.UTC(2013, 0, 1)))
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$setOnInsert: {
            minMaxDate: (new Date(Date.UTC(2012, 11, 31)))
        }}, true);
    test.length(sc.invalidKeys(), 1);
    /* ARRAY COUNT PLUS STRING LENGTH */
    sc = validate(ss, {$setOnInsert: {
            minMaxStringArray: ["longenough", "longenough"]
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$setOnInsert: {
            minMaxStringArray: ["short", "short"]
        }}, true);
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {$setOnInsert: {
            minMaxStringArray: []
        }}, true);
    test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Update Min Check", function(test) {
    /* STRING LENGTH */
    var sc = validate(ss, {$set: {
            minMaxString: "longenough"
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$set: {
            minMaxString: "short"
        }}, true);
    test.length(sc.invalidKeys(), 1);
    /* NUMBER */
    sc = validate(ss, {$set: {
            minMaxNumber: 10
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$set: {
            minMaxNumber: 9
        }}, true);
    test.length(sc.invalidKeys(), 1);
    /* DATE */
    sc = validate(ss, {$set: {
            minMaxDate: (new Date(Date.UTC(2013, 0, 1)))
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$set: {
            minMaxDate: (new Date(Date.UTC(2012, 11, 31)))
        }}, true);
    test.length(sc.invalidKeys(), 1);
    /* ARRAY COUNT PLUS STRING LENGTH */
    sc = validate(ss, {$set: {
            minMaxStringArray: ["longenough", "longenough"]
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$set: {
            minMaxStringArray: ["short", "short"]
        }}, true);
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {$set: {
            minMaxStringArray: []
        }}, true);
    test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Insert Max Check", function(test) {
    /* STRING LENGTH */
    var sc = validate(ss, {
        minMaxString: "nottoolongnottoolong"
    });
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {
        minMaxString: "toolongtoolongtoolong"
    });
    test.length(sc.invalidKeys(), 1);
    /* NUMBER */
    sc = validate(ss, {
        minMaxNumber: 20
    });
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {
        minMaxNumber: 21
    });
    test.length(sc.invalidKeys(), 1);
    /* DATE */
    sc = validate(ss, {
        minMaxDate: (new Date(Date.UTC(2013, 11, 31)))
    });
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {
        minMaxDate: (new Date(Date.UTC(2014, 0, 1)))
    });
    test.length(sc.invalidKeys(), 1);
    /* ARRAY COUNT PLUS STRING LENGTH */
    sc = validate(ss, {
        minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong"]
    });
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {
        minMaxStringArray: ["toolongtoolongtoolong", "toolongtoolongtoolong"]
    });
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {
        minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong", "nottoolongnottoolong"]
    });
    test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Upsert Max Check", function(test) {
    /* STRING LENGTH */
    var sc = validate(ss, {$setOnInsert: {
            minMaxString: "nottoolongnottoolong"
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$setOnInsert: {
            minMaxString: "toolongtoolongtoolong"
        }}, true);
    test.length(sc.invalidKeys(), 1);
    /* NUMBER */
    sc = validate(ss, {$setOnInsert: {
            minMaxNumber: 20
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$setOnInsert: {
            minMaxNumber: 21
        }}, true);
    test.length(sc.invalidKeys(), 1);
    /* DATE */
    sc = validate(ss, {$setOnInsert: {
            minMaxDate: (new Date(Date.UTC(2013, 11, 31)))
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$setOnInsert: {
            minMaxDate: (new Date(Date.UTC(2014, 0, 1)))
        }}, true);
    test.length(sc.invalidKeys(), 1);
    /* ARRAY COUNT PLUS STRING LENGTH */
    sc = validate(ss, {$setOnInsert: {
            minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong"]
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$setOnInsert: {
            minMaxStringArray: ["toolongtoolongtoolong", "toolongtoolongtoolong"]
        }}, true);
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {$setOnInsert: {
            minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong", "nottoolongnottoolong"]
        }}, true);
    test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Update Max Check", function(test) {
    /* STRING LENGTH */
    var sc = validate(ss, {$set: {
            minMaxString: "nottoolongnottoolong"
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$set: {
            minMaxString: "toolongtoolongtoolong"
        }}, true);
    test.length(sc.invalidKeys(), 1);
    /* NUMBER */
    sc = validate(ss, {$set: {
            minMaxNumber: 20
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$set: {
            minMaxNumber: 21
        }}, true);
    test.length(sc.invalidKeys(), 1);
    /* DATE */
    sc = validate(ss, {$set: {
            minMaxDate: (new Date(Date.UTC(2013, 11, 31)))
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$set: {
            minMaxDate: (new Date(Date.UTC(2014, 0, 1)))
        }}, true);
    test.length(sc.invalidKeys(), 1);
    /* ARRAY COUNT PLUS STRING LENGTH */
    sc = validate(ss, {$set: {
            minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong"]
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$set: {
            minMaxStringArray: ["toolongtoolongtoolong", "toolongtoolongtoolong"]
        }}, true);
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {$set: {
            minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong", "nottoolongnottoolong"]
        }}, true);
    test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Insert Allowed Values Check", function(test) {
    /* STRING */
    var sc = validate(ss, {
        allowedStrings: "tuna"
    });
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {
        allowedStrings: "tunas"
    });
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {
        valueIsAllowedString: "pumpkin"
    });
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {
        valueIsAllowedString: "pumpkins"
    });
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {
        allowedStringsArray: ["tuna", "fish", "salad"]
    });
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {
        allowedStringsArray: ["tuna", "fish", "sandwich"]
    });
    test.length(sc.invalidKeys(), 1);
    /* NUMBER */
    sc = validate(ss, {
        allowedNumbers: 1
    });
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {
        allowedNumbers: 4
    });
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {
        valueIsAllowedNumber: 1
    });
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {
        valueIsAllowedNumber: 2
    });
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {
        allowedNumbersArray: [1, 2, 3]
    });
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {
        allowedNumbersArray: [1, 2, 3, 4]
    });
    test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Upsert Allowed Values Check", function(test) {
    /* STRING */
    var sc = validate(ss, {$setOnInsert: {
            allowedStrings: "tuna"
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$setOnInsert: {
            allowedStrings: "tunas"
        }}, true);
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {$setOnInsert: {
            valueIsAllowedString: "pumpkin"
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$setOnInsert: {
            valueIsAllowedString: "pumpkins"
        }}, true);
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {$setOnInsert: {
            allowedStringsArray: ["tuna", "fish", "salad"]
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$setOnInsert: {
            allowedStringsArray: ["tuna", "fish", "sandwich"]
        }}, true);
    test.length(sc.invalidKeys(), 1);
    /* NUMBER */
    sc = validate(ss, {$setOnInsert: {
            allowedNumbers: 1
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$setOnInsert: {
            allowedNumbers: 4
        }}, true);
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {$setOnInsert: {
            valueIsAllowedNumber: 1
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$setOnInsert: {
            valueIsAllowedNumber: 2
        }}, true);
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {$setOnInsert: {
            allowedNumbersArray: [1, 2, 3]
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$setOnInsert: {
            allowedNumbersArray: [1, 2, 3, 4]
        }}, true);
    test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Update Allowed Values Check", function(test) {
    /* STRING */
    var sc = validate(ss, {$set: {
            allowedStrings: "tuna"
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$set: {
            allowedStrings: "tunas"
        }}, true);
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {$set: {
            valueIsAllowedString: "pumpkin"
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$set: {
            valueIsAllowedString: "pumpkins"
        }}, true);
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {$set: {
            allowedStringsArray: ["tuna", "fish", "salad"]
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$set: {
            allowedStringsArray: ["tuna", "fish", "sandwich"]
        }}, true);
    test.length(sc.invalidKeys(), 1);
    /* NUMBER */
    sc = validate(ss, {$set: {
            allowedNumbers: 1
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$set: {
            allowedNumbers: 4
        }}, true);
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {$set: {
            valueIsAllowedNumber: 1
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$set: {
            valueIsAllowedNumber: 2
        }}, true);
    test.length(sc.invalidKeys(), 1);
    sc = validate(ss, {$set: {
            allowedNumbersArray: [1, 2, 3]
        }}, true);
    test.length(sc.invalidKeys(), 0);
    sc = validate(ss, {$set: {
            allowedNumbersArray: [1, 2, 3, 4]
        }}, true);
    test.length(sc.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Validate Against Another Key", function(test) {
    var sc = validate(pss, {
        password: "password",
        confirmPassword: "password"
    });
    test.length(sc.invalidKeys(), 0);

    sc = validate(pss, {$set: {
            password: "password",
            confirmPassword: "password"
        }}, true);

    test.length(sc.invalidKeys(), 0);
    sc = validate(pss, {$setOnInsert: {
            password: "password",
            confirmPassword: "password"
        }}, true);
    test.length(sc.invalidKeys(), 0);

    sc = validate(pss, {
        password: "password",
        confirmPassword: "password1"
    });
    test.length(sc.invalidKeys(), 1);

    sc = validate(pss, {$set: {
            password: "password",
            confirmPassword: "password1"
        }}, true);
    test.length(sc.invalidKeys(), 1);

    sc = validate(pss, {$setOnInsert: {
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

    // [backwards compatibility]
    test.isFalse(Match.test({password: 'pass'}, pss.match()));
    test.isTrue(Match.test({password: 'pass', confirmPassword: 'pass'}, pss.match()));
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
});
