simple-schema [![Build Status](https://travis-ci.org/aldeed/meteor-simple-schema.png?branch=master)](https://travis-ci.org/aldeed/meteor-simple-schema)
=========================

A simple, reactive schema validation smart package for Meteor. It's used by the [collection2](https://github.com/aldeed/meteor-collection2) and [autoform](https://github.com/aldeed/meteor-autoform) packages, but you can use it by itself, too.

## Basic Usage

If you're using the `autoform` or `collection2` package, you define your schema
as part of constructing those objects. Otherwise, create one or more SimpleSchema
instances and then use them to validate objects.

### Example

```js
// Define the schema
BookSchema = new SimpleSchema({
  title: {
    type: String,
    label: "Title",
    max: 200
  },
  author: {
    type: String,
    label: "Author"
  },
  copies: {
    type: Number,
    label: "Number of copies",
    min: 0
  },
  lastCheckedOut: {
    type: Date,
    label: "Last date this book was checked out",
    optional: true
  },
  summary: {
    type: String,
    label: "Brief summary",
    optional: true,
    max: 1000
  }
});

// Validate an object against the schema
obj = {title: "Ulysses", author: "James Joyce"};

isValid = mySchema.namedContext("myContext").validate(obj);
// OR
isValid = mySchema.namedContext("myContext").validateOne(obj, "keyToValidate");
// OR
isValid = Match.test(obj, mySchema);
// OR
check(obj, mySchema);

// Validation errors are available through reactive methods
if (Meteor.isClient) {
  Meteor.startup(function() {
    Deps.autorun(function() {
      var context = BookSchema.namedContext("myContext");
      if (!context.isValid()) {
        console.log(context.invalidKeys());
      }
    });
  });
}
```

### Combining SimpleSchemas

If you have schemas that share one or more subproperties, you can define them in a sub-schema
to make your code cleaner and more concise. Here's an example:

```js
AddressSchema = new SimpleSchema({
  street: {
    type: String,
    max: 100
  },
  city: {
    type: String,
    max: 50
  },
  state: {
    type: String,
    regEx: /^A[LKSZRAEP]|C[AOT]|D[EC]|F[LM]|G[AU]|HI|I[ADLN]|K[SY]|LA|M[ADEHINOPST]|N[CDEHJMVY]|O[HKR]|P[ARW]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY]$/
  },
  zip: {
    type: String,
    regEx: /^[0-9]{5}$/
  }
});

CustomerSchema = new SimpleSchema({
  billingAddress: {
    type: AddressSchema
  },
  shippingAddresses: {
    type: [AddressSchema],
    minCount: 1
  }
});
```

Alternatively, if you want to reuse mini-schemas in multiple places but you don't want a
subdocument like you get with sub-schemas, you can pass multiple schemas to
the SimpleSchema constructor, and they will be combined.

```js
cmsBaseSchema = new SimpleSchema({ ... });
cmsPageSchema = new SimpleSchema([cmsBaseSchema, {additionalField: {type: String} }]);
```

## Schema Keys

A basic schema key is just the name of the key (property) to expect in the
objects that will be validated. If necessary, though, you can use string
keys with mongo-style dot notation to validate nested arrays and objects.

For example:

```js
MySchema = new SimpleSchema({
    "mailingAddress.street": {
        type: String,
    },
    "mailingAddress.city": {
        type: String,
    }
});
```

To indicate the presence of an array, use a `$`:

```js
MySchema = new SimpleSchema({
    "addresses.$.street": {
        type: String,
    },
    "addresses.$.city": {
        type: String,
    }
});
```

In the example above, adding the `addresses` key itself isn't necessary, but
you could do so if you want to, particularly if you want to specify a minimum or maximum array count:

```js
MySchema = new SimpleSchema({
    addresses: {
        type: [Object],
        minCount: 1,
        maxCount: 4
    },
    "addresses.$.street": {
        type: String,
    },
    "addresses.$.city": {
        type: String,
    }
});
```

## Schema Rules

Here are some specifics about the various rules you can define in your schema.

### type

Type can be a standard Javascript object like:
* `String`
* `Number`
* `Boolean`
* `Object`

Or it can be a constructor function like `Date` or any custom object.

Or it can be any of those wrapped in array brackets, to indicate that you're expecting an array of values
of that type.
* `[String]`
* `[Number]`
* `[Boolean]`
* `[Object]`
* `[Date]`

Note that "black box" `Object`s are not allowed. All non-custom `Object`s are
traversed. This means that if you use `type: Object`, you must define all of
that object's allowed properties in your schema, too. If you want to accept
a "black box" object, create a custom object type and use `type: MyCustomObject`.

### label

A string that will be used to refer to this field in validation error messages.
The default is an inflected (humanized) derivation of the key name itself. For
example, the key "firstName" will have a default label of "First name".

If you require realtime translation or a field that changes it's meaning in some
circumstances you can provide a callback function as a label.

If you need to alter labels on the fly you can do so using the `labels` method.

```js
MySchema.labels({
    password: "Enter your password"
});
```

To access the labels again use `schema.label(fieldName)` which will generate you
a usable string. If this is done inside a `Meteor.render()` the label will be reactive.

### optional

By default, all keys are required. Set `optional: true` to change that.

With complex keys, it might be difficult to understand what "required" means.
Here's a brief explanation of how requiredness is interpreted:

* If `type` is `Array` or is an array (any type surrounded by array brackets),
then "required" means that key must have a value, but an empty array is fine.
(If an empty array is *not* fine, add `minCount: 1` option.)
* For items within an array, or when the key name ends with ".$", the `optional`
option has no effect. That is, something cannot be "required" to be in an array.
* If a key is required at a deeper level, the key must have a value *only if*
the object it belongs to is present.
* When the object being validated is a Mongo modifier object, changes that
would unset or `null` a required key result in validation errors.

That last point can be confusing, so let's look at a couple examples:

* Say you have a required key "friends.address.city" but "friends.address" is
optional. If "friends.address" is set in the object you're validating, but
"friends.address.city" is not, there is a validation error. However, if
"friends.address" is *not* set, then there is no validation error for 
"friends.address.city" because the object it belongs to is not present.
* If you have a required key "friends.$.name", but the `friends` array has
no objects in the object you are validating, there is no validation error
for "friends.$.name". When the `friends` array *does* have objects,
every present object is validated, and each object could potentially have a
validation error if it is missing the `name` property. For example, when there
are two objects in the friends array and both are missing the `name` property,
there will be a validation error for both "friends.0.name" and "friends.1.name".

### min/max

* If `type` is `Number` or `[Number]`, these rules define the minimum or
maximum numeric value.
* If `type` is `String` or `[String]`, these rules define the minimum or
maximum string length.
* If `type` is `Date` or `[Date]`, these rules define the minimum or
maximum date, inclusive.

You can alternatively provide a function that takes no arguments and returns
the appropriate minimum or maximum value. This is useful, for example, if
the minimum Date for a field should be "today".

### decimal

Set to `true` if `type` is `Number` or `[Number]` and you want to allow
non-integers. The default is `false`.

### minCount/maxCount

Define the minimum or maximum array length. Used only when type is an array
or is `Array`.

### allowedValues

An array of values that are allowed. A key will be invalid if its value
is not one of these.

### valueIsAllowed

A function that must return true to allow the value.

The function is passed three arguments:

* `value`: The value to be validated
* `obj`: The entire object (document or modifier) being validated
* `operator`: A string identifying which operator is currently being validated if `obj` is a modifier. For non-modifier objects, this will be null.

The valueIsAllowed function may be called multiple times with different `operator` arguments
for a single validation run. If you are unsure what operators might be used, your
code must handle all possible operators or return false for operators you don't want to allow.

The valueIsAllowed function is called for undefined or null values, too. If the
field is `optional: true`, be sure to return true from your valueIsAllowed
function whenever `value` is null or undefined, unless you want to override the
`optional` setting and make it required in certain circumstances.

### regEx

Any regular expression that must be matched for the key to be valid, or
an array of regular expressions that will be tested in order.

A global object, `SchemaRegEx`, is exported. It defines standard regular
expressions you can use as the value for the `regEx` key.
Currently `SchemaRegEx.Email` and `SchemaRegEx.Url` are the only values.
Feel free to add more with a pull request.

## The Object

The object you pass in when validating can be a normal object, or it can be
a mongo modifier object (with `$set`, etc. keys). In other words, you can pass
in the exact object that you are going to pass to `Collection.insert()` or
`Collection.update()`. This is what the collection2 smart package does for you.

## Cleaning Data

SimpleSchema instances provide a `clean` method that you can use to autoConvert
and/or filter an object before validating it.

* Filtering removes any keys not explicitly or implicitly allowed by the schema,
which prevents errors being thrown for those keys during validation.
* Automatic value conversion helps eliminate unnecessary validation
messages by automatically converting values where possible. For example, non-string
values can be converted to a String if the schema expects a String, and strings
that are numbers can be converted to Numbers if the schema expects a Number.

By default, `clean` does both. If you want to skip either filtering or type
conversion, set the corresponding option to false:

```js
// This does nothing
obj = mySchema.clean(obj, {
  filter: false,
  autoConvert: false
});
```

NOTE: The `collection2` package always calls `clean` before every insert, update,
or upsert.

## Validating Data

Before you can validate an object against your schema, you need to get a new
validation context from the SimpleSchema. A validation context provides
reactive methods for validating and checking the validation status of a particular
object.

### Named Validation Contexts

It's usually best to use a named validation context. That way, the context is
automatically persisted by name, allowing you to easily rely on its reactive
methods.

To obtain a named validation context, call `namedContext(name)`:

```js
var ss = new SimpleSchema({
    requiredString: {
        type: String
    }
});
var ssContext1 = ss.namedContext("userForm");
```

The first time you request a context with a certain name, it is created. Calling
`namedContext()` is equivalent to calling `namedContext("default")`.

### Unnamed Validation Contexts

To obtain an unnamed validation context, call `newContext()`:

```js
var ss = new SimpleSchema({
    requiredString: {
        type: String
    }
});
var ssContext1 = ss.newContext();
```

An unnamed validation context is not persisted anywhere. It can be useful when
you need to see if a document is valid but you don't need any of the reactive
methods for that context.

### Validating an Object

To validate an object against the schema in a validation context, call
`myContext.validate(obj, options)`. This method returns `true` if the object is
valid according to the schema or `false` if it is not. It also
stores a list of invalid fields and corresponding error messages in the
context object and causes the reactive methods to react.

Now you can call `myContext.isValid()` to see if the object passed into `validate()`
was found to be valid. This is a reactive method that returns true or false.

Note: When you are passing in a mongo modifier object, set the `modifier` option to true:

```js
myContext.validate({$set: { age: 29 }}, { modifier: true });
```

### Validating Only One Key in an Object

You may have the need to validate just one key. For this, use `myContext.validateOne(obj, key, options)`.
Only the specified schema key will be validated. This may cause all of the
reactive methods to react.

This method returns `true` if the specified schema key is valid according to
the schema or `false` if it is not.

### Validating Using check() or Match.test()

A schema can be passed as the second argument of the built-in `check()` 
or ``Match.test()` methods. This will throw a Match.Error if the object
specified in the first argument is not valid according to the schema.

```js
var mySchema = new SimpleSchema({name: {type: String}});

Match.test({name: 'Steve'}, mySchema); // Return true
Match.test({admin: true}, mySchema); // Return false
check({admin: true}, mySchema); // throw a Match.Error
```

### Validating One Key Against Another

The second argument of the `valueIsAllowed` function is the full document or
mongo modifier object that's being validated. This allows you to declare one value
valid or invalid based on another value. Here's an example:

```js
MySchema = new SimpleSchema({
    password: {
        type: String,
        label: "Enter a password",
        min: 8
    },
    confirmPassword: {
        type: String,
        label: "Enter the password again",
        min: 8,
        valueIsAllowed: function (val, doc, op) {
            if (!op) { //insert
              return doc.password === val;
            }
            if (op === "$set") { //update
              return doc.$set.password === val;
            }
            return false; //allow only inserts and $set
        }
    }
});

MySchema.messages({
    "notAllowed confirmPassword": "Passwords do not match"
});
```

### Other Validation Context Methods

Call `myContext.invalidKeys()` to get the full array of invalid key data. Each object
in the array has three keys:
* `name`: The schema key as specified in the schema.
* `type`: The type of error. One of the following strings:
    * required
    * minString
    * maxString
    * minNumber
    * maxNumber
    * minDate
    * maxDate
    * minCount
    * maxCount
    * noDecimal
    * notAllowed
    * expectedString
    * expectedNumber
    * expectedBoolean
    * expectedArray
    * expectedObject
    * expectedConstructor
    * regEx
* `message`: The error message.

This is a reactive method.

`myContext.keyIsInvalid(key)` returns true if the specified key is currently
invalid, or false if it is valid. This is a reactive method.

`myContext.keyErrorMessage(key)` returns the error message for the specified
key if it is invalid. If it is valid, this method returns an empty string. This
is a reactive method.

Call `myContext.resetValidation()` if you need to reset the validation context,
clearing out any invalid field messages and making it valid.

### Other SimpleSchema Methods

Call `MySchema.schema(key)` to get the schema definition object. If you specify a
key, then only the schema definition for that key is returned.

Note that this may not match exactly what you passed into the SimpleSchema
constructor. The schema definition object is normalized internally, and this
method returns the normalized copy.

## Customizing Validation Messages

To customize validation messages, pass a messages object to `SimpleSchema.messages()`.
The format of the messages object is:

```js
{
  errorType: message
}
```

You can also specify override messages for specific fields:

```js
{
  "errorType schemaKey": message
}
```

You can also specify override messages for specific regular expressions:

```js
{
  "regEx.0": message,
  "regEx.0 schemaKey": message
}
```

Where `regEx.0` means the first regular expression in the regEx array for the schemaKey.

The message is a string. It can contain a number of different placeholders indicated by square brackets:
* `[label]` will be replaced with the field label
* `[min]` will be replaced with the minimum allowed value (string length, number, or date)
* `[max]` will be replaced with the maximum allowed value (string length, number, or date)
* `[minCount]` will be replaced with the minimum array count
* `[maxCount]` will be replaced with the maximum array count
* `[value]` will be replaced with the value that was provided to save but was invalid (not available for all error types)
* `[type]` will be replaced with the expected type; useful for the `expectedConstructor` error type

By way of example, here is what it would look like if you defined the default error messages yourself:

```js
MySchema.messages({
    required: "[label] is required",
    minString: "[label] must be at least [min] characters",
    maxString: "[label] cannot exceed [max] characters",
    minNumber: "[label] must be at least [min]",
    maxNumber: "[label] cannot exceed [max]",
    minDate: "[label] must be on or before [min]",
    maxDate: "[label] cannot be after [max]",
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
    regEx: "[label] failed regular expression validation"
});
```

You should call this method on both the client and the server to make sure that your messages are consistent.
If you are interested in supporting multiple languages, you should be able to rerun this method
to change the messages at any time, for example, in an autorun function based on a language value stored in session
that loads the message object from static json files.

## Dates

For consistency, you should generally validate and store Dates set to the UTC
time zone. If you care only about the date, then use a `Date` object set to the
desired date at midnight UTC. If you need the time, too, then use a `Date`
object set to the desired date and time UTC.

This goes for `min` and `max` dates, too. If you care only about the date
portion and you want to specify a minimum date, `min` should be set to midnight
UTC on the minimum date (inclusive).

Following these rules ensures maximum interoperability with HTML5 date inputs
and usually just makes sense. 

## Collection2 and AutoForm

This all becomes pretty great when put to use in the
[collection2](https://github.com/aldeed/meteor-collection2)
and [autoform](https://github.com/aldeed/meteor-autoform) packages.
Take a look at their documentation.

## License

MIT

## Contributing

Anyone is welcome to contribute. Fork, make and test your changes
(`meteor test-packages ./`), and then submit a pull request.

### Thanks

(Add your name if it's missing.)

@mquandalle
@Nemo64
