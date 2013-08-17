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
                       //default is the key name itself
        optional: true, //default is false, meaning the key must be present
        min: min, //minimum numeric value, or minimum string length,
                  //or minimum date, inclusive
        max: max, //maximum numeric value, or maximum string length,
                  //or maximum date, inclusive
        minCount: minCount, //minimum array length, used only if type is an array
        maxCount: maxCount, //maximum array length, used only if type is an array
        allowedValues: [], //an array of allowed values; the key's value
                           //must match one of these
        valueIsAllowed: function, //a function that accepts the value as
                                  //its only argument and returns true 
                                  //if the value is allowed
        decimal: true, //default is false; set to true if type=Number
                       //and you want to allow non-integers
        regEx: /[0-255]/, //any regular expression that must be matched
                          //for the key to be valid
        regExMessage: "is not valid" //when the regEx test fails, what
                                     //should come after the label in
                                     //the error message
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

Your SimpleSchema object has two methods you can use to clean data in an object.

### SimpleSchema.filter(obj)

Removes keys from obj if they are not listed in the schema. Returns the filtered object. It's a
good idea to call this method before validating if you're dealing with user-entered data.

### SimpleSchema.autoTypeConvert(obj)

Returns an object that has values automatically type-converted to match the schema,
if possible. For example, non-string values can be converted to a String if the
schema expects a String, and strings that are numbers can be converted to Numbers
if the schema expects a Number. It's a good idea to call this method before
validating if you're dealing with user-entered data, so as to avoid unnecessary
validation errors.

## Validating Data

To validate an object against the schema, use `MySchema.validate(obj)`. This
method returns undefined, but it also stores a list of invalid fields and corresponding
error messages in the SimpleSchema object.

Now you can call `MySchema.valid()` to see if the object passed into `validate()`
was found to be valid. This is a reactive method that returns true or false.

### Other Methods

Call `MySchema.invalidKeys()` to get the full array of invalid key data. Each object
in the array has two keys: `name`, which is the key name exactly as specified
in the schema object, and `message`, which is the error message for that key. This
is a reactive method.

`MySchema.keyIsInvalid(key)` returns true if the specified key is currently
invalid, or false if it is valid. This is a reactive method.

`MySchema.keyErrorMessage(key)` returns the error message for the specified
key if it is invalid. If it is valid, this method returns an empty string. This
is a reactive method.

Call `MySchema.schema(key)` to get the original schema object that you passed in
as the only argument to the SimpleSchema constructor function. If you specify a
key, then only that schema key's value (the schema definition for that key) 
is returned.

Call `MySchema.resetValidation()` if you need to reset the SimpleSchema object,
clearing out any invalid field messages.

### check()

The `simple-schema` package extends Meteor's `check()` method so that you
can specify an object as the first parameter and a SimpleSchema instance as the
second parameter. When you call `check()` in this way, it throws a Match.Error
if the object specified in the first parameter is not valid according to the
schema.

### The Object

The object you pass in can be a normal object, or it can use the $set or $unset
format of a mongo-style object. In other words, you can pass in the exact object
that you are going to pass to `Collection.insert()` or `Collection.update()`. This
is what the collection2 smart package does for you.

## Collection2 and AutoForm

This all becomes pretty great when put to use in the [collection2](https://github.com/aldeed/meteor-collection2) and [autoform](https://github.com/aldeed/meteor-autoform) packages. Take a look at their documentation.

## Contributing

Anyone is welcome to contribute. Fork, make and test your changes (`meteor test-packages ./`),
and then submit a pull request.
