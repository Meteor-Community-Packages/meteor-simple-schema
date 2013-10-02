simple-schema
=========================

A simple, reactive schema validation smart package for Meteor. It's used by the [collection2](https://github.com/aldeed/meteor-collection2) and [autoform](https://github.com/aldeed/meteor-autoform) packages, but you can use it by itself, too.

## Basic Usage

If you're using the `autoform` or `collection2` package, you define your schema as part of constructing those objects. Otherwise,
set up a SimpleSchema instance like so:

```js
MySchema = new SimpleSchema({
    key: {
        type: type, //allow only this data type
        label: "Name", //how to refer to this key in the error messages;
                       //default is an inflected (humanized) derivation of the key name itself
        optional: true, //default is false, meaning the key must be present
        min: min, //minimum numeric value, or minimum string length,
                  //or minimum date, inclusive; or a function that takes
                  //no arguments and returns one of these
        max: max, //maximum numeric value, or maximum string length,
                  //or maximum date, inclusive; or a function that takes
                  //no arguments and returns one of these
        minCount: minCount, //minimum array length, used only if type is an array
        maxCount: maxCount, //maximum array length, used only if type is an array
        allowedValues: [], //an array of allowed values; the key's value
                           //must match one of these
        valueIsAllowed: function, //see the Defining Allowed Values section
        decimal: true, //default is false; set to true if type=Number
                       //and you want to allow non-integers
        regEx: /[0-255]/, //any regular expression that must be matched
                          //for the key to be valid, or an array of regular expressions
                          //that will be tested in order
    }
});
```

### Types

Type can be a standard Javascript object like:
* `String`
* `Number`
* `Boolean`
* `Object`

Or it can be a constructor function like `Date`.

Or it can be any of those wrapped in array brackets, to indicate that you're expecting an array of values
of that type.
* `[String]`
* `[Number]`
* `[Boolean]`
* `[Object]`
* `[Date]`

If you have schemas that share one or more subproperties, you can define them in a sub-schema
to make your code cleaner and more concise. Here's an example:

```javascript
AdressSchema = new SimpleSchema({
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

### Keys

A basic schema key is just the name of the key to expect in the objects that will be validated.
If necessary, though, you can use string keys with mongo-style dot notation to validate
nested arrays and objects.

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

### Provided RegEx Patterns

A global object, `SchemaRegEx`, is exported. It defines standard regular expressions you can use
as the value for the `regEx` key in the schema. Currently `SchemaRegEx.Email` and
`SchemaRegEx.Url` are the only values. Feel free to add more with a pull request.

## Cleaning Data

Use the `clean()` method on an instance of SimpleSchema to clean an object prior to validating it. This
is highly recommended if security is a concern because it will ensure that any keys
not explicitly or implicitly allowed by the schema are removed. It will also automatically
typeconvert some values when possible to avoid needless validation errors.
For example, non-string values can be converted to a String if the
schema expects a String, and strings that are numbers can be converted to Numbers
if the schema expects a Number.

If you want to skip either filtering or type conversion, set the corresponding
option to false:

```js
MySchema.clean(obj, {
  filter: false,
  autoConvert: false
});
```

## Validating Data

Before you can validate an object against your schema, you need to get a new
validation context from the SimpleSchema. A validation context provides
reactive methods for validating and checking the validation status of a particular
object.

To obtain a validation context, call `newContext()`:

```js
var ss = new SimpleSchema({
    requiredString: {
        type: String
    }
});
var ssContext1 = ss.newContext();
```

To validate an object against the schema in a validation context, call
`myContext.validate(obj, options)`. This method returns undefined, but it also
stores a list of invalid fields and corresponding error messages in the
context object and causes the reactive methods to react.

Now you can call `myContext.isValid()` to see if the object passed into `validate()`
was found to be valid. This is a reactive method that returns true or false.

### Validating Only One Key

You may have the need to validate just one key. For this, use `myContext.validateOne(obj, key, options)`.
Only the specified schema key will be validated. This may cause all of the
reactive methods to react.

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

Call `MySchema.schema(key)` to get the original schema object that you passed in
as the first argument to the SimpleSchema constructor function. If you specify a
key, then only that schema key's value (the schema definition for that key) 
is returned.

### check()

A schema can be passed as the second argument of the built-in `check()` function. 
This will throw a Match.Error if the object specified in the first argument is not
valid according to the schema. It works with `Match.test` as well:
```js
var mySchema = new SimpleSchema({name: {type: String}});

Match.test({name: 'Steve'}, mySchema); // Return true
Match.test({admin: true}, mySchema); // Return false
check({admin: true}, mySchema); // throw a Match.Error
```

### The Object

The object you pass in when validating can be a normal object, or it can be
a mongo modifier object (with `$set`, etc. keys). In other words, you can pass
in the exact object that you are going to pass to `Collection.insert()` or
`Collection.update()`. This is what the collection2 smart package does for you.

When you are passing in a mongo modifier object, set the `modifier` option to true:

```js
myContext.validate({$set: { age: 29 }}, { modifier: true });
```

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

## Changing Labels

If you need to alter labels on the fly, such as to support user-selectable
languages, you can do so using the `labels` method.

```js
MySchema.labels({
    password: "Enter your password"
});
```

This is not currently reactive but should be. (Pull request welcome.)

## Defining Allowed Values

To define which values are allowed for a schema key, use the `allowedValues` option
or the `valueIsAllowed` option.

`allowedValues` is simply an array of values that are allowed. A key will be
invalid if it's value is not one of these.

`valueIsAllowed` can be set to a function that must return true to allow the value.
The function is passed three arguments:

* `value`: The value to be validated
* `obj`: The entire object being validated (could be a mongo modifier)
* `operator`: A string identifying which operator is currently being validated if `obj` is a modifier. For normal objects, this will be null.

The valueIsAllowed function may be called multiple times with different `operator` arguments
for a single validation run. If you are unsure what operators might be used, your
code must handle all possible operators or return false for operators you don't want to allow.

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

## Collection2 and AutoForm

This all becomes pretty great when put to use in the [collection2](https://github.com/aldeed/meteor-collection2) and [autoform](https://github.com/aldeed/meteor-autoform) packages. Take a look at their documentation.

## Contributing

Anyone is welcome to contribute. Fork, make and test your changes (`meteor test-packages ./`),
and then submit a pull request.

### Major Contributors

@mquandalle