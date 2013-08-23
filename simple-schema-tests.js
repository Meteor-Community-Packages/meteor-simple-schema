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
    test.isTrue(ssr.invalidKeys().length === 8);

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
    test.isTrue(ssr.invalidKeys().length === 8);

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
    test.isTrue(ssr.invalidKeys().length === 8);

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
    test.isTrue(ssr.invalidKeys().length === 8);

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
    test.isTrue(ssr.invalidKeys().length === 8);

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
    test.isTrue(ssr.invalidKeys().length === 0);
});

Tinytest.add("SimpleSchema - Set Required", function(test) {
    validate(ssr, {$set: {}});
    test.isTrue(ssr.invalidKeys().length === 0); //would not cause DB changes, so should not be an error

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
    test.isTrue(ssr.invalidKeys().length === 8);

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
    test.isTrue(ssr.invalidKeys().length === 0); //would not cause DB changes, so should not be an error

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
    test.isTrue(ssr.invalidKeys().length === 8);

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
    test.isTrue(ssr.invalidKeys().length === 8);

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
    test.isTrue(ssr.invalidKeys().length === 0);
});

Tinytest.add("SimpleSchema - Unset Required", function(test) {
    validate(ssr, {$unset: {}});
    test.isTrue(ssr.invalidKeys().length === 0); //would not cause DB changes, so should not be an error

    validate(ssr, {$unset: {
            requiredString: 1,
            requiredBoolean: 1,
            requiredNumber: 1,
            requiredDate: 1,
            requiredEmail: 1,
            requiredUrl: 1
        }});
    test.isTrue(ssr.invalidKeys().length === 6);

    //make sure an optional can be unset when others are required
    validate(ssr, {$unset: {
            anOptionalOne: 1
        }});
    test.isTrue(ssr.invalidKeys().length === 0);
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
    test.isTrue(ss.invalidKeys().length === 0);

    /* STRING FAILURES */

    //boolean string failure
    ss.validate({
        string: true
    });
    test.isTrue(ss.invalidKeys().length === 1); //without typeconvert
    
    validate(ss, {
        string: true
    });
    test.isTrue(ss.invalidKeys().length === 0); //with typeconvert

    //number string failure
    ss.validate({
        string: 1
    });
    test.isTrue(ss.invalidKeys().length === 1); //without typeconvert
    
    validate(ss, {
        string: 1
    });
    test.isTrue(ss.invalidKeys().length === 0); //with typeconvert

    //object string failure
    ss.validate({
        string: {test: "test"}
    });
    test.isTrue(ss.invalidKeys().length === 1); //without typeconvert
    
    validate(ss, {
        string: {test: "test"}
    });
    test.isTrue(ss.invalidKeys().length === 0); //with typeconvert

    //array string failure
    validate(ss, {
        string: ["test"]
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //instance string failure
    ss.validate({
        string: (new Date())
    });
    test.isTrue(ss.invalidKeys().length === 1); //without typeconvert
    
    validate(ss, {
        string: (new Date())
    });
    test.isTrue(ss.invalidKeys().length === 0); //with typeconvert

    /* BOOLEAN FAILURES */

    //string bool failure
    validate(ss, {
        boolean: "test"
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //number bool failure
    validate(ss, {
        boolean: 1
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //object bool failure
    validate(ss, {
        boolean: {test: "test"}
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //array bool failure
    validate(ss, {
        boolean: ["test"]
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //instance bool failure
    validate(ss, {
        boolean: (new Date())
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* NUMBER FAILURES */

    //string number failure
    validate(ss, {
        number: "test"
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //boolean number failure
    validate(ss, {
        number: true
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //object number failure
    validate(ss, {
        number: {test: "test"}
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //array number failure
    validate(ss, {
        number: ["test"]
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //instance number failure
    validate(ss, {
        number: (new Date())
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //decimal number failure
    validate(ss, {
        number: 1.1
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* INSTANCE FAILURES */

    //string date failure
    validate(ss, {
        date: "test"
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //boolean date failure
    validate(ss, {
        date: true
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //object date failure
    validate(ss, {
        date: {test: "test"}
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //array date failure
    validate(ss, {
        date: ["test"]
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //number date failure
    validate(ss, {
        date: 1
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* REGEX FAILURES */

    validate(ss, {
        url: "blah"
    });
    test.isTrue(ss.invalidKeys().length === 1);

    validate(ss, {
        email: "blah"
    });
    test.isTrue(ss.invalidKeys().length === 1);

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
    test.isTrue(ss.invalidKeys().length === 0);

    /* STRING FAILURES */

    //boolean string failure
    ss.validate({$set: {
            string: true
        }});
    test.isTrue(ss.invalidKeys().length === 1); //without typeconvert
    
    validate(ss, {$set: {
            string: true
        }});
    test.isTrue(ss.invalidKeys().length === 0); //with typeconvert

    //number string failure
    ss.validate({$set: {
            string: 1
        }});
    test.isTrue(ss.invalidKeys().length === 1); //without typeconvert
    
    validate(ss, {$set: {
            string: 1
        }});
    test.isTrue(ss.invalidKeys().length === 0); //with typeconvert

    //object string failure
    ss.validate({$set: {
            string: {test: "test"}
        }});
    test.isTrue(ss.invalidKeys().length === 1); //without typeconvert
    
    validate(ss, {$set: {
            string: {test: "test"}
        }});
    test.isTrue(ss.invalidKeys().length === 0); //with typeconvert

    //array string failure
    validate(ss, {$set: {
            string: ["test"]
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //instance string failure
    ss.validate({$set: {
            string: (new Date())
        }});
    test.isTrue(ss.invalidKeys().length === 1); //without typeconvert
    
    validate(ss, {$set: {
            string: (new Date())
        }});
    test.isTrue(ss.invalidKeys().length === 0); //with typeconvert

    /* BOOLEAN FAILURES */

    //string bool failure
    validate(ss, {$set: {
            boolean: "test"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //number bool failure
    validate(ss, {$set: {
            boolean: 1
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //object bool failure
    validate(ss, {$set: {
            boolean: {test: "test"}
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //array bool failure
    validate(ss, {$set: {
            boolean: ["test"]
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //instance bool failure
    validate(ss, {$set: {
            boolean: (new Date())
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* NUMBER FAILURES */

    //string number failure
    validate(ss, {$set: {
            number: "test"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //boolean number failure
    validate(ss, {$set: {
            number: true
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //object number failure
    validate(ss, {$set: {
            number: {test: "test"}
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //array number failure
    validate(ss, {$set: {
            number: ["test"]
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //instance number failure
    validate(ss, {$set: {
            number: (new Date())
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* INSTANCE FAILURES */

    //string date failure
    validate(ss, {$set: {
            date: "test"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //boolean date failure
    validate(ss, {$set: {
            date: true
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //object date failure
    validate(ss, {$set: {
            date: {test: "test"}
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //array date failure
    validate(ss, {$set: {
            date: ["test"]
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //number date failure
    validate(ss, {$set: {
            date: 1
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* REGEX FAILURES */

    validate(ss, {$set: {
            url: "blah"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    validate(ss, {$set: {
            email: "blah"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

});

Tinytest.add("SimpleSchema - Insert Min Check", function(test) {
    /* STRING LENGTH */
    validate(ss, {
        minMaxString: "longenough"
    });
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {
        minMaxString: "short"
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* NUMBER */
    validate(ss, {
        minMaxNumber: 10
    });
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {
        minMaxNumber: 9
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* DATE */
    validate(ss, {
        minMaxDate: (new Date(Date.UTC(2013, 0, 1)))
    });
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {
        minMaxDate: (new Date(Date.UTC(2012, 11, 31)))
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* ARRAY COUNT PLUS STRING LENGTH */
    validate(ss, {
        minMaxStringArray: ["longenough", "longenough"]
    });
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {
        minMaxStringArray: ["short", "short"]
    });
    test.isTrue(ss.invalidKeys().length === 1);

    validate(ss, {
        minMaxStringArray: []
    });
    test.isTrue(ss.invalidKeys().length === 1);

});

Tinytest.add("SimpleSchema - Update Min Check", function(test) {
    /* STRING LENGTH */
    validate(ss, {$set: {
            minMaxString: "longenough"
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {$set: {
            minMaxString: "short"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* NUMBER */
    validate(ss, {$set: {
            minMaxNumber: 10
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {$set: {
            minMaxNumber: 9
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* DATE */
    validate(ss, {$set: {
            minMaxDate: (new Date(Date.UTC(2013, 0, 1)))
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {$set: {
            minMaxDate: (new Date(Date.UTC(2012, 11, 31)))
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* ARRAY COUNT PLUS STRING LENGTH */
    validate(ss, {$set: {
            minMaxStringArray: ["longenough", "longenough"]
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {$set: {
            minMaxStringArray: ["short", "short"]
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    validate(ss, {$set: {
            minMaxStringArray: []
        }});
    test.isTrue(ss.invalidKeys().length === 1);

});

Tinytest.add("SimpleSchema - Insert Max Check", function(test) {
    /* STRING LENGTH */
    validate(ss, {
        minMaxString: "nottoolongnottoolong"
    });
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {
        minMaxString: "toolongtoolongtoolong"
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* NUMBER */
    validate(ss, {
        minMaxNumber: 20
    });
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {
        minMaxNumber: 21
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* DATE */
    validate(ss, {
        minMaxDate: (new Date(Date.UTC(2013, 11, 31)))
    });
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {
        minMaxDate: (new Date(Date.UTC(2014, 0, 1)))
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* ARRAY COUNT PLUS STRING LENGTH */
    validate(ss, {
        minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong"]
    });
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {
        minMaxStringArray: ["toolongtoolongtoolong", "toolongtoolongtoolong"]
    });
    test.isTrue(ss.invalidKeys().length === 1);

    validate(ss, {
        minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong", "nottoolongnottoolong"]
    });
    test.isTrue(ss.invalidKeys().length === 1);
});

Tinytest.add("SimpleSchema - Update Max Check", function(test) {
    /* STRING LENGTH */
    validate(ss, {$set: {
            minMaxString: "nottoolongnottoolong"
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {$set: {
            minMaxString: "toolongtoolongtoolong"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* NUMBER */
    validate(ss, {$set: {
            minMaxNumber: 20
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {$set: {
            minMaxNumber: 21
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* DATE */
    validate(ss, {$set: {
            minMaxDate: (new Date(Date.UTC(2013, 11, 31)))
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {$set: {
            minMaxDate: (new Date(Date.UTC(2014, 0, 1)))
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* ARRAY COUNT PLUS STRING LENGTH */
    validate(ss, {$set: {
            minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong"]
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {$set: {
            minMaxStringArray: ["toolongtoolongtoolong", "toolongtoolongtoolong"]
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    validate(ss, {$set: {
            minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong", "nottoolongnottoolong"]
        }});
    test.isTrue(ss.invalidKeys().length === 1);
});

Tinytest.add("SimpleSchema - Insert Allowed Values Check", function(test) {
    /* STRING */
    validate(ss, {
        allowedStrings: "tuna"
    });
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {
        allowedStrings: "tunas"
    });
    test.isTrue(ss.invalidKeys().length === 1);

    validate(ss, {
        valueIsAllowedString: "pumpkin"
    });
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {
        valueIsAllowedString: "pumpkins"
    });
    test.isTrue(ss.invalidKeys().length === 1);

    validate(ss, {
        allowedStringsArray: ["tuna", "fish", "salad"]
    });
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {
        allowedStringsArray: ["tuna", "fish", "sandwich"]
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* NUMBER */
    validate(ss, {
        allowedNumbers: 1
    });
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {
        allowedNumbers: 4
    });
    test.isTrue(ss.invalidKeys().length === 1);

    validate(ss, {
        valueIsAllowedNumber: 1
    });
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {
        valueIsAllowedNumber: 2
    });
    test.isTrue(ss.invalidKeys().length === 1);

    validate(ss, {
        allowedNumbersArray: [1, 2, 3]
    });
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {
        allowedNumbersArray: [1, 2, 3, 4]
    });
    test.isTrue(ss.invalidKeys().length === 1);
});

Tinytest.add("SimpleSchema - Update Allowed Values Check", function(test) {
    /* STRING */
    validate(ss, {$set: {
            allowedStrings: "tuna"
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {$set: {
            allowedStrings: "tunas"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    validate(ss, {$set: {
            valueIsAllowedString: "pumpkin"
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {$set: {
            valueIsAllowedString: "pumpkins"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    validate(ss, {$set: {
            allowedStringsArray: ["tuna", "fish", "salad"]
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {$set: {
            allowedStringsArray: ["tuna", "fish", "sandwich"]
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* NUMBER */
    validate(ss, {$set: {
            allowedNumbers: 1
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {$set: {
            allowedNumbers: 4
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    validate(ss, {$set: {
            valueIsAllowedNumber: 1
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {$set: {
            valueIsAllowedNumber: 2
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    validate(ss, {$set: {
            allowedNumbersArray: [1, 2, 3]
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    validate(ss, {$set: {
            allowedNumbersArray: [1, 2, 3, 4]
        }});
    test.isTrue(ss.invalidKeys().length === 1);
});

Tinytest.add("SimpleSchema - Validate Against Another Key", function(test) {
    validate(pss, {
        password: "password",
        confirmPassword: "password"
    });
    test.isTrue(pss.invalidKeys().length === 0);

    validate(pss, {$set: {
            password: "password",
            confirmPassword: "password"
        }});
    test.isTrue(pss.invalidKeys().length === 0);

    validate(pss, {
        password: "password",
        confirmPassword: "password1"
    });
    test.isTrue(pss.invalidKeys().length === 1);

    validate(pss, {$set: {
            password: "password",
            confirmPassword: "password1"
        }});
    test.isTrue(pss.invalidKeys().length === 1);

});