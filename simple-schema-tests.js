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
        type: String,
    },
    confirmPassword: {
        type: String,
        valueIsAllowed: function(val, doc) {
            var pass = ("$set" in doc) ? doc.$set.password : doc.password;
            return pass === val;
        }
    }
});

Deps.autorun(function() {
    var errors = ssr.invalidKeys();
    for (var i = 0, ln = errors.length, error; i < ln; i++) {
        error = errors[i];
        console.log(error.name + ": " + error.type + " (" + error.message + ")");
    }
});

Deps.autorun(function() {
    var errors = ss.invalidKeys();
    for (var i = 0, ln = errors.length, error; i < ln; i++) {
        error = errors[i];
        console.log(error.name + ": " + error.type + " (" + error.message + ")");
    }
});

var validate = function(ss, doc) {
    //we will filter, type convert, and validate everything
    //so that we can be sure the filtering and type converting are not invalidating
    //documents that should be valid
    doc = ss.filter(doc);
    doc = ss.autoTypeConvert(doc);
    ss.validate(doc);
};

Tinytest.add("SimpleSchema - Insert Required", function(test) {
    validate(ssr, {});
    test.length(ssr.invalidKeys(), 8)

    validate(ssr, {
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
    test.length(ssr.invalidKeys(), 8)

    validate(ssr, {
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
    test.length(ssr.invalidKeys(), 8)

    validate(ssr, {
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
    test.length(ssr.invalidKeys(), 8)

    validate(ssr, {
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
    test.length(ssr.invalidKeys(), 8)

    //test opposite case
    validate(ssr, {
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
    test.length(ssr.invalidKeys(), 0);
});

Tinytest.add("SimpleSchema - Set Required", function(test) {
    validate(ssr, {$set: {}});
    test.length(ssr.invalidKeys(), 0); //would not cause DB changes, so should not be an error

    validate(ssr, {$set: {
            requiredString: null,
            requiredBoolean: null,
            requiredNumber: null,
            requiredDate: null,
            requiredEmail: null,
            requiredUrl: null,
            requiredObject: null,
            'subdoc.requiredString': null
        }});
    test.length(ssr.invalidKeys(), 8)

    validate(ssr, {$set: {
            requiredString: void 0,
            requiredBoolean: void 0,
            requiredNumber: void 0,
            requiredDate: void 0,
            requiredEmail: void 0,
            requiredUrl: void 0,
            requiredObject: void 0,
            'subdoc.requiredString': void 0
        }});
    test.length(ssr.invalidKeys(), 0); //would not cause DB changes, so should not be an error

    validate(ssr, {$set: {
            requiredString: "",
            requiredBoolean: null,
            requiredNumber: null,
            requiredDate: null,
            requiredEmail: null,
            requiredUrl: null,
            requiredObject: null,
            'subdoc.requiredString': ""
        }});
    test.length(ssr.invalidKeys(), 8)

    validate(ssr, {$set: {
            requiredString: "   ",
            requiredBoolean: null,
            requiredNumber: null,
            requiredDate: null,
            requiredEmail: null,
            requiredUrl: null,
            requiredObject: null,
            'subdoc.requiredString': "   "
        }});
    test.length(ssr.invalidKeys(), 8)

    //test opposite case
    validate(ssr, {$set: {
            requiredString: "test",
            requiredBoolean: true,
            requiredNumber: 1,
            requiredDate: (new Date()),
            requiredEmail: "test123@sub.example.edu",
            requiredUrl: "http://google.com",
            requiredObject: {},
            'subdoc.requiredString': "test"
        }});
    test.length(ssr.invalidKeys(), 0);
});

Tinytest.add("SimpleSchema - Unset Required", function(test) {
    validate(ssr, {$unset: {}});
    test.length(ssr.invalidKeys(), 0); //would not cause DB changes, so should not be an error

    validate(ssr, {$unset: {
            requiredString: 1,
            requiredBoolean: 1,
            requiredNumber: 1,
            requiredDate: 1,
            requiredEmail: 1,
            requiredUrl: 1
        }});
    test.length(ssr.invalidKeys(), 6)

    //make sure an optional can be unset when others are required
    validate(ssr, {$unset: {
            anOptionalOne: 1
        }});
    test.length(ssr.invalidKeys(), 0);
});

Tinytest.add("SimpleSchema - Insert Type Check", function(test) {
    validate(ss, {
        string: "test",
        boolean: true,
        number: 1,
        decimal: 1.1,
        date: (new Date()),
        url: "http://google.com",
        email: "test123@sub.example.edu"
    });
    test.length(ss.invalidKeys(), 0);

    /* STRING FAILURES */

    //boolean string failure
    ss.validate({
        string: true
    });
    test.length(ss.invalidKeys(), 1); //without typeconvert
    
    validate(ss, {
        string: true
    });
    test.length(ss.invalidKeys(), 0); //with typeconvert

    //number string failure
    ss.validate({
        string: 1
    });
    test.length(ss.invalidKeys(), 1); //without typeconvert
    
    validate(ss, {
        string: 1
    });
    test.length(ss.invalidKeys(), 0); //with typeconvert

    //object string failure
    ss.validate({
        string: {test: "test"}
    });
    test.length(ss.invalidKeys(), 1); //without typeconvert
    
    validate(ss, {
        string: {test: "test"}
    });
    test.length(ss.invalidKeys(), 0); //with typeconvert

    //array string failure
    validate(ss, {
        string: ["test"]
    });
    test.length(ss.invalidKeys(), 1);

    //instance string failure
    ss.validate({
        string: (new Date())
    });
    test.length(ss.invalidKeys(), 1); //without typeconvert
    
    validate(ss, {
        string: (new Date())
    });
    test.length(ss.invalidKeys(), 0); //with typeconvert

    /* BOOLEAN FAILURES */

    //string bool failure
    validate(ss, {
        boolean: "test"
    });
    test.length(ss.invalidKeys(), 1);

    //number bool failure
    validate(ss, {
        boolean: 1
    });
    test.length(ss.invalidKeys(), 1);

    //object bool failure
    validate(ss, {
        boolean: {test: "test"}
    });
    test.length(ss.invalidKeys(), 1);

    //array bool failure
    validate(ss, {
        boolean: ["test"]
    });
    test.length(ss.invalidKeys(), 1);

    //instance bool failure
    validate(ss, {
        boolean: (new Date())
    });
    test.length(ss.invalidKeys(), 1);

    /* NUMBER FAILURES */

    //string number failure
    validate(ss, {
        number: "test"
    });
    test.length(ss.invalidKeys(), 1);

    //boolean number failure
    validate(ss, {
        number: true
    });
    test.length(ss.invalidKeys(), 1);

    //object number failure
    validate(ss, {
        number: {test: "test"}
    });
    test.length(ss.invalidKeys(), 1);

    //array number failure
    validate(ss, {
        number: ["test"]
    });
    test.length(ss.invalidKeys(), 1);

    //instance number failure
    validate(ss, {
        number: (new Date())
    });
    test.length(ss.invalidKeys(), 1);

    //decimal number failure
    validate(ss, {
        number: 1.1
    });
    test.length(ss.invalidKeys(), 1);

    /* INSTANCE FAILURES */

    //string date failure
    validate(ss, {
        date: "test"
    });
    test.length(ss.invalidKeys(), 1);

    //boolean date failure
    validate(ss, {
        date: true
    });
    test.length(ss.invalidKeys(), 1);

    //object date failure
    validate(ss, {
        date: {test: "test"}
    });
    test.length(ss.invalidKeys(), 1);

    //array date failure
    validate(ss, {
        date: ["test"]
    });
    test.length(ss.invalidKeys(), 1);

    //number date failure
    validate(ss, {
        date: 1
    });
    test.length(ss.invalidKeys(), 1);

    /* REGEX FAILURES */

    validate(ss, {
        url: "blah"
    });
    test.length(ss.invalidKeys(), 1);

    validate(ss, {
        email: "blah"
    });
    test.length(ss.invalidKeys(), 1);

});

Tinytest.add("SimpleSchema - Update Type Check", function(test) {
    validate(ss, {$set: {
            string: "test",
            boolean: true,
            number: 1,
            date: (new Date()),
            url: "http://google.com",
            email: "test123@sub.example.edu"
        }});
    test.length(ss.invalidKeys(), 0);

    /* STRING FAILURES */

    //boolean string failure
    ss.validate({$set: {
            string: true
        }});
    test.length(ss.invalidKeys(), 1); //without typeconvert
    
    validate(ss, {$set: {
            string: true
        }});
    test.length(ss.invalidKeys(), 0); //with typeconvert

    //number string failure
    ss.validate({$set: {
            string: 1
        }});
    test.length(ss.invalidKeys(), 1); //without typeconvert
    
    validate(ss, {$set: {
            string: 1
        }});
    test.length(ss.invalidKeys(), 0); //with typeconvert

    //object string failure
    ss.validate({$set: {
            string: {test: "test"}
        }});
    test.length(ss.invalidKeys(), 1); //without typeconvert
    
    validate(ss, {$set: {
            string: {test: "test"}
        }});
    test.length(ss.invalidKeys(), 0); //with typeconvert

    //array string failure
    validate(ss, {$set: {
            string: ["test"]
        }});
    test.length(ss.invalidKeys(), 1);

    //instance string failure
    ss.validate({$set: {
            string: (new Date())
        }});
    test.length(ss.invalidKeys(), 1); //without typeconvert
    
    validate(ss, {$set: {
            string: (new Date())
        }});
    test.length(ss.invalidKeys(), 0); //with typeconvert

    /* BOOLEAN FAILURES */

    //string bool failure
    validate(ss, {$set: {
            boolean: "test"
        }});
    test.length(ss.invalidKeys(), 1);

    //number bool failure
    validate(ss, {$set: {
            boolean: 1
        }});
    test.length(ss.invalidKeys(), 1);

    //object bool failure
    validate(ss, {$set: {
            boolean: {test: "test"}
        }});
    test.length(ss.invalidKeys(), 1);

    //array bool failure
    validate(ss, {$set: {
            boolean: ["test"]
        }});
    test.length(ss.invalidKeys(), 1);

    //instance bool failure
    validate(ss, {$set: {
            boolean: (new Date())
        }});
    test.length(ss.invalidKeys(), 1);

    /* NUMBER FAILURES */

    //string number failure
    validate(ss, {$set: {
            number: "test"
        }});
    test.length(ss.invalidKeys(), 1);

    //boolean number failure
    validate(ss, {$set: {
            number: true
        }});
    test.length(ss.invalidKeys(), 1);

    //object number failure
    validate(ss, {$set: {
            number: {test: "test"}
        }});
    test.length(ss.invalidKeys(), 1);

    //array number failure
    validate(ss, {$set: {
            number: ["test"]
        }});
    test.length(ss.invalidKeys(), 1);

    //instance number failure
    validate(ss, {$set: {
            number: (new Date())
        }});
    test.length(ss.invalidKeys(), 1);

    /* INSTANCE FAILURES */

    //string date failure
    validate(ss, {$set: {
            date: "test"
        }});
    test.length(ss.invalidKeys(), 1);

    //boolean date failure
    validate(ss, {$set: {
            date: true
        }});
    test.length(ss.invalidKeys(), 1);

    //object date failure
    validate(ss, {$set: {
            date: {test: "test"}
        }});
    test.length(ss.invalidKeys(), 1);

    //array date failure
    validate(ss, {$set: {
            date: ["test"]
        }});
    test.length(ss.invalidKeys(), 1);

    //number date failure
    validate(ss, {$set: {
            date: 1
        }});
    test.length(ss.invalidKeys(), 1);

    /* REGEX FAILURES */

    validate(ss, {$set: {
            url: "blah"
        }});
    test.length(ss.invalidKeys(), 1);

    validate(ss, {$set: {
            email: "blah"
        }});
    test.length(ss.invalidKeys(), 1);

});

Tinytest.add("SimpleSchema - Insert Min Check", function(test) {
    /* STRING LENGTH */
    validate(ss, {
        minMaxString: "longenough"
    });
    test.length(ss.invalidKeys(), 0);

    validate(ss, {
        minMaxString: "short"
    });
    test.length(ss.invalidKeys(), 1);

    /* NUMBER */
    validate(ss, {
        minMaxNumber: 10
    });
    test.length(ss.invalidKeys(), 0);

    validate(ss, {
        minMaxNumber: 9
    });
    test.length(ss.invalidKeys(), 1);

    /* DATE */
    validate(ss, {
        minMaxDate: (new Date(Date.UTC(2013, 0, 1)))
    });
    test.length(ss.invalidKeys(), 0);

    validate(ss, {
        minMaxDate: (new Date(Date.UTC(2012, 11, 31)))
    });
    test.length(ss.invalidKeys(), 1);

    /* ARRAY COUNT PLUS STRING LENGTH */
    validate(ss, {
        minMaxStringArray: ["longenough", "longenough"]
    });
    test.length(ss.invalidKeys(), 0);

    validate(ss, {
        minMaxStringArray: ["short", "short"]
    });
    test.length(ss.invalidKeys(), 1);

    validate(ss, {
        minMaxStringArray: []
    });
    test.length(ss.invalidKeys(), 1);

});

Tinytest.add("SimpleSchema - Update Min Check", function(test) {
    /* STRING LENGTH */
    validate(ss, {$set: {
            minMaxString: "longenough"
        }});
    test.length(ss.invalidKeys(), 0);

    validate(ss, {$set: {
            minMaxString: "short"
        }});
    test.length(ss.invalidKeys(), 1);

    /* NUMBER */
    validate(ss, {$set: {
            minMaxNumber: 10
        }});
    test.length(ss.invalidKeys(), 0);

    validate(ss, {$set: {
            minMaxNumber: 9
        }});
    test.length(ss.invalidKeys(), 1);

    /* DATE */
    validate(ss, {$set: {
            minMaxDate: (new Date(Date.UTC(2013, 0, 1)))
        }});
    test.length(ss.invalidKeys(), 0);

    validate(ss, {$set: {
            minMaxDate: (new Date(Date.UTC(2012, 11, 31)))
        }});
    test.length(ss.invalidKeys(), 1);

    /* ARRAY COUNT PLUS STRING LENGTH */
    validate(ss, {$set: {
            minMaxStringArray: ["longenough", "longenough"]
        }});
    test.length(ss.invalidKeys(), 0);

    validate(ss, {$set: {
            minMaxStringArray: ["short", "short"]
        }});
    test.length(ss.invalidKeys(), 1);

    validate(ss, {$set: {
            minMaxStringArray: []
        }});
    test.length(ss.invalidKeys(), 1);

});

Tinytest.add("SimpleSchema - Insert Max Check", function(test) {
    /* STRING LENGTH */
    validate(ss, {
        minMaxString: "nottoolongnottoolong"
    });
    test.length(ss.invalidKeys(), 0);

    validate(ss, {
        minMaxString: "toolongtoolongtoolong"
    });
    test.length(ss.invalidKeys(), 1);

    /* NUMBER */
    validate(ss, {
        minMaxNumber: 20
    });
    test.length(ss.invalidKeys(), 0);

    validate(ss, {
        minMaxNumber: 21
    });
    test.length(ss.invalidKeys(), 1);

    /* DATE */
    validate(ss, {
        minMaxDate: (new Date(Date.UTC(2013, 11, 31)))
    });
    test.length(ss.invalidKeys(), 0);

    validate(ss, {
        minMaxDate: (new Date(Date.UTC(2014, 0, 1)))
    });
    test.length(ss.invalidKeys(), 1);

    /* ARRAY COUNT PLUS STRING LENGTH */
    validate(ss, {
        minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong"]
    });
    test.length(ss.invalidKeys(), 0);

    validate(ss, {
        minMaxStringArray: ["toolongtoolongtoolong", "toolongtoolongtoolong"]
    });
    test.length(ss.invalidKeys(), 1);

    validate(ss, {
        minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong", "nottoolongnottoolong"]
    });
    test.length(ss.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Update Max Check", function(test) {
    /* STRING LENGTH */
    validate(ss, {$set: {
            minMaxString: "nottoolongnottoolong"
        }});
    test.length(ss.invalidKeys(), 0);

    validate(ss, {$set: {
            minMaxString: "toolongtoolongtoolong"
        }});
    test.length(ss.invalidKeys(), 1);

    /* NUMBER */
    validate(ss, {$set: {
            minMaxNumber: 20
        }});
    test.length(ss.invalidKeys(), 0);

    validate(ss, {$set: {
            minMaxNumber: 21
        }});
    test.length(ss.invalidKeys(), 1);

    /* DATE */
    validate(ss, {$set: {
            minMaxDate: (new Date(Date.UTC(2013, 11, 31)))
        }});
    test.length(ss.invalidKeys(), 0);

    validate(ss, {$set: {
            minMaxDate: (new Date(Date.UTC(2014, 0, 1)))
        }});
    test.length(ss.invalidKeys(), 1);

    /* ARRAY COUNT PLUS STRING LENGTH */
    validate(ss, {$set: {
            minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong"]
        }});
    test.length(ss.invalidKeys(), 0);

    validate(ss, {$set: {
            minMaxStringArray: ["toolongtoolongtoolong", "toolongtoolongtoolong"]
        }});
    test.length(ss.invalidKeys(), 1);

    validate(ss, {$set: {
            minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong", "nottoolongnottoolong"]
        }});
    test.length(ss.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Insert Allowed Values Check", function(test) {
    /* STRING */
    validate(ss, {
        allowedStrings: "tuna"
    });
    test.length(ss.invalidKeys(), 0);

    validate(ss, {
        allowedStrings: "tunas"
    });
    test.length(ss.invalidKeys(), 1);

    validate(ss, {
        valueIsAllowedString: "pumpkin"
    });
    test.length(ss.invalidKeys(), 0);

    validate(ss, {
        valueIsAllowedString: "pumpkins"
    });
    test.length(ss.invalidKeys(), 1);

    validate(ss, {
        allowedStringsArray: ["tuna", "fish", "salad"]
    });
    test.length(ss.invalidKeys(), 0);

    validate(ss, {
        allowedStringsArray: ["tuna", "fish", "sandwich"]
    });
    test.length(ss.invalidKeys(), 1);

    /* NUMBER */
    validate(ss, {
        allowedNumbers: 1
    });
    test.length(ss.invalidKeys(), 0);

    validate(ss, {
        allowedNumbers: 4
    });
    test.length(ss.invalidKeys(), 1);

    validate(ss, {
        valueIsAllowedNumber: 1
    });
    test.length(ss.invalidKeys(), 0);

    validate(ss, {
        valueIsAllowedNumber: 2
    });
    test.length(ss.invalidKeys(), 1);

    validate(ss, {
        allowedNumbersArray: [1, 2, 3]
    });
    test.length(ss.invalidKeys(), 0);

    validate(ss, {
        allowedNumbersArray: [1, 2, 3, 4]
    });
    test.length(ss.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Update Allowed Values Check", function(test) {
    /* STRING */
    validate(ss, {$set: {
            allowedStrings: "tuna"
        }});
    test.length(ss.invalidKeys(), 0);

    validate(ss, {$set: {
            allowedStrings: "tunas"
        }});
    test.length(ss.invalidKeys(), 1);

    validate(ss, {$set: {
            valueIsAllowedString: "pumpkin"
        }});
    test.length(ss.invalidKeys(), 0);

    validate(ss, {$set: {
            valueIsAllowedString: "pumpkins"
        }});
    test.length(ss.invalidKeys(), 1);

    validate(ss, {$set: {
            allowedStringsArray: ["tuna", "fish", "salad"]
        }});
    test.length(ss.invalidKeys(), 0);

    validate(ss, {$set: {
            allowedStringsArray: ["tuna", "fish", "sandwich"]
        }});
    test.length(ss.invalidKeys(), 1);

    /* NUMBER */
    validate(ss, {$set: {
            allowedNumbers: 1
        }});
    test.length(ss.invalidKeys(), 0);

    validate(ss, {$set: {
            allowedNumbers: 4
        }});
    test.length(ss.invalidKeys(), 1);

    validate(ss, {$set: {
            valueIsAllowedNumber: 1
        }});
    test.length(ss.invalidKeys(), 0);

    validate(ss, {$set: {
            valueIsAllowedNumber: 2
        }});
    test.length(ss.invalidKeys(), 1);

    validate(ss, {$set: {
            allowedNumbersArray: [1, 2, 3]
        }});
    test.length(ss.invalidKeys(), 0);

    validate(ss, {$set: {
            allowedNumbersArray: [1, 2, 3, 4]
        }});
    test.length(ss.invalidKeys(), 1);
});

Tinytest.add("SimpleSchema - Validate Against Another Key", function(test) {
    validate(pss, {
        password: "password",
        confirmPassword: "password"
    });
    test.length(pss.invalidKeys(), 0);

    validate(pss, {$set: {
            password: "password",
            confirmPassword: "password"
        }});
    test.length(pss.invalidKeys(), 0);

    validate(pss, {
        password: "password",
        confirmPassword: "password1"
    });
    test.length(pss.invalidKeys(), 1);

    validate(pss, {$set: {
            password: "password",
            confirmPassword: "password1"
        }});
    test.length(pss.invalidKeys(), 1);

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