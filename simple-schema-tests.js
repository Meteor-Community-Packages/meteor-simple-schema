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

Deps.autorun(function () {
    var errors = ssr.invalidKeys();
    for (var i = 0, ln = errors.length, error; i < ln; i++) {
        error = errors[i];
        console.log(error.name + ": " + error.type + " (" + error.message + ")");
    }
});

Deps.autorun(function () {
    var errors = ss.invalidKeys();
    for (var i = 0, ln = errors.length, error; i < ln; i++) {
        error = errors[i];
        console.log(error.name + ": " + error.type + " (" + error.message + ")");
    }
});

Tinytest.add("SimpleSchema - Insert Required", function(test) {
    ssr.validate({});
    test.isTrue(ssr.invalidKeys().length === 8);

    ssr.validate({
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

    ssr.validate({
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

    ssr.validate({
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

    ssr.validate({
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
    ssr.validate({
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
    ssr.validate({$set: {}});
    test.isTrue(ssr.invalidKeys().length === 0); //would not cause DB changes, so should not be an error

    ssr.validate({$set: {
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

    ssr.validate({$set: {
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

    ssr.validate({$set: {
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

    ssr.validate({$set: {
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
    ssr.validate({$set: {
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
    ssr.validate({$unset: {}});
    test.isTrue(ssr.invalidKeys().length === 0); //would not cause DB changes, so should not be an error

    ssr.validate({$unset: {
            requiredString: 1,
            requiredBoolean: 1,
            requiredNumber: 1,
            requiredDate: 1,
            requiredEmail: 1,
            requiredUrl: 1
        }});
    test.isTrue(ssr.invalidKeys().length === 6);
});

Tinytest.add("SimpleSchema - Insert Type Check", function(test) {
    ss.validate({
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
    test.isTrue(ss.invalidKeys().length === 1);

    //number string failure
    ss.validate({
        string: 1
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //object string failure
    ss.validate({
        string: {test: "test"}
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //array string failure
    ss.validate({
        string: ["test"]
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //instance string failure
    ss.validate({
        string: (new Date())
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* BOOLEAN FAILURES */

    //string bool failure
    ss.validate({
        boolean: "test"
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //number bool failure
    ss.validate({
        boolean: 1
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //object bool failure
    ss.validate({
        boolean: {test: "test"}
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //array bool failure
    ss.validate({
        boolean: ["test"]
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //instance bool failure
    ss.validate({
        boolean: (new Date())
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* NUMBER FAILURES */

    //string number failure
    ss.validate({
        number: "test"
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //boolean number failure
    ss.validate({
        number: true
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //object number failure
    ss.validate({
        number: {test: "test"}
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //array number failure
    ss.validate({
        number: ["test"]
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //instance number failure
    ss.validate({
        number: (new Date())
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //decimal number failure
    ss.validate({
        number: 1.1
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* INSTANCE FAILURES */

    //string date failure
    ss.validate({
        date: "test"
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //boolean date failure
    ss.validate({
        date: true
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //object date failure
    ss.validate({
        date: {test: "test"}
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //array date failure
    ss.validate({
        date: ["test"]
    });
    test.isTrue(ss.invalidKeys().length === 1);

    //number date failure
    ss.validate({
        date: 1
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* REGEX FAILURES */

    ss.validate({
        url: "blah"
    });
    test.isTrue(ss.invalidKeys().length === 1);

    ss.validate({
        email: "blah"
    });
    test.isTrue(ss.invalidKeys().length === 1);

});

Tinytest.add("SimpleSchema - Update Type Check", function(test) {
    ss.validate({$set: {
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
    test.isTrue(ss.invalidKeys().length === 1);

    //number string failure
    ss.validate({$set: {
            string: 1
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //object string failure
    ss.validate({$set: {
            string: {test: "test"}
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //array string failure
    ss.validate({$set: {
            string: ["test"]
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //instance string failure
    ss.validate({$set: {
            string: (new Date())
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* BOOLEAN FAILURES */

    //string bool failure
    ss.validate({$set: {
            boolean: "test"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //number bool failure
    ss.validate({$set: {
            boolean: 1
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //object bool failure
    ss.validate({$set: {
            boolean: {test: "test"}
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //array bool failure
    ss.validate({$set: {
            boolean: ["test"]
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //instance bool failure
    ss.validate({$set: {
            boolean: (new Date())
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* NUMBER FAILURES */

    //string number failure
    ss.validate({$set: {
            number: "test"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //boolean number failure
    ss.validate({$set: {
            number: true
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //object number failure
    ss.validate({$set: {
            number: {test: "test"}
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //array number failure
    ss.validate({$set: {
            number: ["test"]
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //instance number failure
    ss.validate({$set: {
            number: (new Date())
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* INSTANCE FAILURES */

    //string date failure
    ss.validate({$set: {
            date: "test"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //boolean date failure
    ss.validate({$set: {
            date: true
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //object date failure
    ss.validate({$set: {
            date: {test: "test"}
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //array date failure
    ss.validate({$set: {
            date: ["test"]
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    //number date failure
    ss.validate({$set: {
            date: 1
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* REGEX FAILURES */

    ss.validate({$set: {
            url: "blah"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    ss.validate({$set: {
            email: "blah"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

});

Tinytest.add("SimpleSchema - Insert Min Check", function(test) {
    /* STRING LENGTH */
    ss.validate({
        minMaxString: "longenough"
    });
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({
        minMaxString: "short"
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* NUMBER */
    ss.validate({
        minMaxNumber: 10
    });
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({
        minMaxNumber: 9
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* DATE */
    ss.validate({
        minMaxDate: (new Date(Date.UTC(2013, 0, 1)))
    });
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({
        minMaxDate: (new Date(Date.UTC(2012, 11, 31)))
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* ARRAY COUNT PLUS STRING LENGTH */
    ss.validate({
        minMaxStringArray: ["longenough", "longenough"]
    });
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({
        minMaxStringArray: ["short", "short"]
    });
    test.isTrue(ss.invalidKeys().length === 1);

    ss.validate({
        minMaxStringArray: []
    });
    test.isTrue(ss.invalidKeys().length === 1);

});

Tinytest.add("SimpleSchema - Update Min Check", function(test) {
    /* STRING LENGTH */
    ss.validate({$set: {
            minMaxString: "longenough"
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({$set: {
            minMaxString: "short"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* NUMBER */
    ss.validate({$set: {
            minMaxNumber: 10
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({$set: {
            minMaxNumber: 9
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* DATE */
    ss.validate({$set: {
            minMaxDate: (new Date(Date.UTC(2013, 0, 1)))
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({$set: {
            minMaxDate: (new Date(Date.UTC(2012, 11, 31)))
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* ARRAY COUNT PLUS STRING LENGTH */
    ss.validate({$set: {
            minMaxStringArray: ["longenough", "longenough"]
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({$set: {
            minMaxStringArray: ["short", "short"]
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    ss.validate({$set: {
            minMaxStringArray: []
        }});
    test.isTrue(ss.invalidKeys().length === 1);

});

Tinytest.add("SimpleSchema - Insert Max Check", function(test) {
    /* STRING LENGTH */
    ss.validate({
        minMaxString: "nottoolongnottoolong"
    });
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({
        minMaxString: "toolongtoolongtoolong"
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* NUMBER */
    ss.validate({
        minMaxNumber: 20
    });
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({
        minMaxNumber: 21
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* DATE */
    ss.validate({
        minMaxDate: (new Date(Date.UTC(2013, 11, 31)))
    });
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({
        minMaxDate: (new Date(Date.UTC(2014, 0, 1)))
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* ARRAY COUNT PLUS STRING LENGTH */
    ss.validate({
        minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong"]
    });
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({
        minMaxStringArray: ["toolongtoolongtoolong", "toolongtoolongtoolong"]
    });
    test.isTrue(ss.invalidKeys().length === 1);

    ss.validate({
        minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong", "nottoolongnottoolong"]
    });
    test.isTrue(ss.invalidKeys().length === 1);
});

Tinytest.add("SimpleSchema - Update Max Check", function(test) {
    /* STRING LENGTH */
    ss.validate({$set: {
            minMaxString: "nottoolongnottoolong"
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({$set: {
            minMaxString: "toolongtoolongtoolong"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* NUMBER */
    ss.validate({$set: {
            minMaxNumber: 20
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({$set: {
            minMaxNumber: 21
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* DATE */
    ss.validate({$set: {
            minMaxDate: (new Date(Date.UTC(2013, 11, 31)))
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({$set: {
            minMaxDate: (new Date(Date.UTC(2014, 0, 1)))
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* ARRAY COUNT PLUS STRING LENGTH */
    ss.validate({$set: {
            minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong"]
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({$set: {
            minMaxStringArray: ["toolongtoolongtoolong", "toolongtoolongtoolong"]
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    ss.validate({$set: {
            minMaxStringArray: ["nottoolongnottoolong", "nottoolongnottoolong", "nottoolongnottoolong"]
        }});
    test.isTrue(ss.invalidKeys().length === 1);
});

Tinytest.add("SimpleSchema - Insert Allowed Values Check", function(test) {
    /* STRING */
    ss.validate({
        allowedStrings: "tuna"
    });
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({
        allowedStrings: "tunas"
    });
    test.isTrue(ss.invalidKeys().length === 1);

    ss.validate({
        valueIsAllowedString: "pumpkin"
    });
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({
        valueIsAllowedString: "pumpkins"
    });
    test.isTrue(ss.invalidKeys().length === 1);

    ss.validate({
        allowedStringsArray: ["tuna", "fish", "salad"]
    });
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({
        allowedStringsArray: ["tuna", "fish", "sandwich"]
    });
    test.isTrue(ss.invalidKeys().length === 1);

    /* NUMBER */
    ss.validate({
        allowedNumbers: 1
    });
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({
        allowedNumbers: 4
    });
    test.isTrue(ss.invalidKeys().length === 1);

    ss.validate({
        valueIsAllowedNumber: 1
    });
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({
        valueIsAllowedNumber: 2
    });
    test.isTrue(ss.invalidKeys().length === 1);

    ss.validate({
        allowedNumbersArray: [1, 2, 3]
    });
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({
        allowedNumbersArray: [1, 2, 3, 4]
    });
    test.isTrue(ss.invalidKeys().length === 1);
});

Tinytest.add("SimpleSchema - Update Allowed Values Check", function(test) {
    /* STRING */
    ss.validate({$set: {
            allowedStrings: "tuna"
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({$set: {
            allowedStrings: "tunas"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    ss.validate({$set: {
            valueIsAllowedString: "pumpkin"
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({$set: {
            valueIsAllowedString: "pumpkins"
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    ss.validate({$set: {
            allowedStringsArray: ["tuna", "fish", "salad"]
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({$set: {
            allowedStringsArray: ["tuna", "fish", "sandwich"]
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    /* NUMBER */
    ss.validate({$set: {
            allowedNumbers: 1
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({$set: {
            allowedNumbers: 4
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    ss.validate({$set: {
            valueIsAllowedNumber: 1
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({$set: {
            valueIsAllowedNumber: 2
        }});
    test.isTrue(ss.invalidKeys().length === 1);

    ss.validate({$set: {
            allowedNumbersArray: [1, 2, 3]
        }});
    test.isTrue(ss.invalidKeys().length === 0);

    ss.validate({$set: {
            allowedNumbersArray: [1, 2, 3, 4]
        }});
    test.isTrue(ss.invalidKeys().length === 1);
});

Tinytest.add("SimpleSchema - JSON stringify", function(test) {
    test.equal(JSON.stringify(ss), '{"string":{"optional":true},"minMaxStr' +
        'ing":{"optional":true,"min":10,"max":20},"minMaxStringArray":{"ty' +
        'pe":[null],"optional":true,"min":10,"max":20,"minCount":1,"maxCou' +
        'nt":2},"allowedStrings":{"optional":true,"allowedValues":["tuna",' +
        '"fish","salad"]},"valueIsAllowedString":{"optional":true},"allowe' +
        'dStringsArray":{"type":[null],"optional":true,"allowedValues":["t' +
        'una","fish","salad"]},"boolean":{"optional":true},"number":{"opti' +
        'onal":true},"minMaxNumber":{"optional":true,"min":10,"max":20},"a' +
        'llowedNumbers":{"optional":true,"allowedValues":[1,2,3]},"valueIs' +
        'AllowedNumber":{"optional":true},"allowedNumbersArray":{"type":[n' +
        'ull],"optional":true,"allowedValues":[1,2,3]},"decimal":{"optiona' +
        'l":true,"decimal":true},"date":{"optional":true},"minMaxDate":{"o' +
        'ptional":true,"min":"2013-01-01T00:00:00.000Z","max":"2013-12-31T' +
        '00:00:00.000Z"},"email":{"regEx":{},"optional":true},"url":{"regE' +
        'x":{},"optional":true}}');
});