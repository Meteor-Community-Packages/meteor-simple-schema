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

In the examples above, we did not explicitly define the `mailingAddress` object or
the `addresses` array or the `addresses.$` object. This is fine because they will be
implicitly defined for you. However,
__note that implicit objects and arrays of objects are assumed to be optional__.
This means their required properties will only be required if the object
itself is present in the document or modifier being validated. So in general, it's
clearer if you explicitly define objects and arrays of objects in your schema.
Here's an example of explicitly defining an array of objects such that it will be
required and have a minimum and maximum array count:

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

### label

A string that will be used to refer to this field in validation error messages.
The default is an inflected (humanized) derivation of the key name itself. For
example, the key "firstName" will have a default label of "First name".

If you require a field that changes it's meaning in some
circumstances you can provide a callback function as a label.

```js
MySchema = new SimpleSchema({
  firstName: {
    type: String,
    label: function () {
      return Session.get("lang") == "de"
            ? "Vorname" : "first name";
    }
  }
});
```

Alternatively, you can use the `labels` method to alter one or more labels on
the fly:

```js
MySchema.labels({
    password: "Enter your password"
});
```

This method causes reactive labels to update.

To get the label for a field, use `MySchema.label(fieldName)`, which returns
a usable string. This method is reactive.

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

Deprecated. Use the `custom` option and return "notAllowed" if the value
is not allowed.

### regEx

Any regular expression that must be matched for the key to be valid, or
an array of regular expressions that will be tested in order.

The `SimpleSchema.RegEx` object defines standard regular
expressions you can use as the value for the `regEx` key.
- `SimpleSchema.RegEx.Email` for external emails (requires a tld like `.com`)
- `SimpleSchema.RegEx.WeakEmail` for a less strict email validation (allows: `name@localhost` and `name@192.168.200.5`)
- `SimpleSchema.RegEx.Domain` for external domains and the domain only (requires a tld like `.com`)
- `SimpleSchema.RegEx.WeakDomain` for less strict domains and IPv4 and IPv6
- `SimpleSchema.RegEx.IP` for IPv4 or IPv6
- `SimpleSchema.RegEx.IPv4` for just IPv4
- `SimpleSchema.RegEx.IPv6` for just IPv6
- `SimpleSchema.RegEx.Url` for http, https and ftp urls
- `SimpleSchema.RegEx.Id` for id's generated by `Random.id()` of the random package, also usable to validate a relation id.

Feel free to add more with a pull request. If
you use the built-in e-mail or url validation with an AutoForm, the
form input will be of type `email` or `url`, respectively, by default.

### blackbox

If you have a key with type `Object`, the properties of the object will be
validated as well, so you must define all allowed properties in the schema. If this is
not possible or you don't care to validate the object's properties, use the
`blackbox: true` option to skip validation for everything within the object.

Custom object types are treated as blackbox objects by default. However, 
when using collection2, you must ensure that the custom type is not lost
between client and server. This can be done with a `transform` function that
converts the generic Object to the custom object. Without this transformation,
client-side inserts and updates might succeed on the client but then fail on
the server. Alternatively, if you don't care about losing the custom type,
you can explicitly set `blackbox: true` for a custom object type instead of
using a transformation.

### custom

Refer to the "Custom Validation" section.

### defaultValue

Set this to any value that you want to be used as the default when an object
does not include this field or has this field set to `undefined`. This value
will be injected into the object by a call to `mySimpleSchema.clean()`. Default
values are set only when cleaning *non-modifier* objects.

If you need more control, use the `autoValue` option instead.

### autoValue

The `autoValue` option allows you to specify a function that is called by
`mySimpleSchema.clean()` to potentially change the value of a property in the
object being cleaned. This is a powerful feature that allows you to set up
either forced values or default values, potentially based on the values of
other fields in the object.

An `autoValue` function is passed the document or modifier as its only argument,
but you will generally not need it. Instead, the function context provides a
variety of properties and methods to help you determine what you should return.

If an `autoValue` function returns `undefined`, the field's value will be
whatever the document or modifier says it should be. Any other return value will
be used as the field's value. You may also return special pseudo-modifier objects
for update operations. Examples are `{$inc: 1}` and `{$push: new Date}`.

The following properties and methods are available in `this` for an `autoValue`
function:

* `isSet`: True if the field is already set in the document or modifier
* `unset()`: Call this method to prevent the original value from being used when
you return undefined.
* `value`: If isSet = true, this contains the field's current (requested) value
in the document or modifier.
* `operator`: If isSet = true and isUpdate = true, this contains the name of the 
update operator in the modifier in which this field is being changed. For example,
if the modifier were `{$set: {name: "Alice"}}`, in the autoValue function for
the `name` field, `this.isSet` would be true, `this.value` would be "Alice",
and `this.operator` would be "$set".
* `field()`: Use this method to get information about other fields. Pass a field
name (schema key) as the only argument. The return object will have isSet, value,
and operator properties for that field.
* `siblingField()`: Use this method to get information about other fields that
have the same parent object. Works the same way as `field()`. This is helpful
when you use sub-schemas or when you're dealing with arrays of objects.

Refer to the collection2 package documentation for examples.

## The Object

The object you pass in when validating can be a normal object, or it can be
a mongo modifier object (with `$set`, etc. keys). In other words, you can pass
in the exact object that you are going to pass to `Collection.insert()` or
`Collection.update()`. This is what the collection2 smart package does for you.

## Cleaning Data

SimpleSchema instances provide a `clean` method that cleans or alters data in
a number of ways. It's intended to be called prior to validation to avoid
any avoidable validation errors.

The `clean` method takes the object to be cleaned as its first argument and
the following optional options as its second argument:

* `filter`: Filter properties not found in the schema? True by default.
* `autoConvert`: Type convert properties into the correct type where possible? True by default.
* `removeEmptyStrings`: Remove keys in normal object or $set where the value is an empty string? True by default.
* `getAutoValues`: Run `autoValue` functions and inject automatic and `defaultValue` values? True by default.
* `isModifier`: Is the first argument a modifier object? False by default.
* `extendAutoValueContext`: This object will be added to the `this` context of autoValue functions.

Additional notes:

* The object is cleaned in place. That is, the original referenced object will
be cleaned. You do not have to use the return value of the `clean` method.
* `filter` removes any keys not explicitly or implicitly allowed by the schema,
which prevents errors being thrown for those keys during validation.
* `autoConvert` helps eliminate unnecessary validation
messages by automatically converting values where possible. For example, non-string
values can be converted to a String if the schema expects a String, and strings
that are numbers can be converted to Numbers if the schema expects a Number.
* `extendAutoValueContext` can be used to give your `autoValue` functions
additional valuable information, such as `userId`. (Note that operations done
using the Collection2 package automatically add `userId` to the `autoValue`
context already.)

```js
mySchema.clean(obj);
//obj is now potentially changed
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

For a list of options, see the "Validation Options" section.

### Validating Only One Key in an Object

You may have the need to validate just one key. For this,
use `myContext.validateOne(obj, key, options)`. This works the same way as the
`validate` method, except that only the specified schema key will be validated.
This may cause all of the reactive methods to react.

This method returns `true` if the specified schema key is valid according to
the schema or `false` if it is not.

For a list of options, see the "Validation Options" section.

### Validation Options

Both `validate` and `validateOne` methods accept the following options:

* `modifier`: Are you validating a Mongo modifier object? False by default.
* `upsert`: Are you validating a Mongo modifier object potentially containing
upsert operators? False by default.
* `extendedCustomContext`: This object will be added to the `this` context in
any custom validation functions that are run during validation. See "Custom Validation" section.

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

### Custom Validation

There are three ways to attach custom validation methods:

* To add a custom validation function that is called for all keys in all 
defined schemas, use `SimpleSchema.addValidator(myFunction)`.
* To add a custom validation function that is called for all keys for a
specific SimpleSchema instance, use `mySimpleSchema.addValidator(myFunction)`.
* To add a custom validation function that is called for a specific key in
a specific schema, use the `custom` option in the schema definition for that key.

All custom validation functions work the same way and have the same `this` context:

* Do any necessary custom validation, and return an error type string if you
determine that the value is invalid. Any non-string return value means the value is valid.
* The error type string can be one of the built-in strings or any string you want.
If you return a custom string, you'll usually want to define a message for it.
* Within the function, `this` provides the following properties:
    * `key`: The name of the schema key (e.g., "addresses.0.street")
    * `genericKey`: The generic name of the schema key (e.g., "addresses.$.street")
    * `definition`: The schema definition object.
    * `isSet`: Does the object being validated have this key set?
    * `value`: The value to validate.
    * `operator`: The mongo operator for which we're doing validation. Might be `null`.
    * `field()`: Use this method to get information about other fields. Pass a field
name (non-generic schema key) as the only argument. The return object will have
`isSet`, `value`, and `operator` properties for that field.
    * `siblingField()`: Use this method to get information about other fields that
have the same parent object. Works the same way as `field()`. This is helpful
when you use sub-schemas or when you're dealing with arrays of objects.

NOTE: If you need to do some custom validation on the server and then display errors back on the client,
refer to the "Asynchronous Custom Validation on the Client" section.

### Manually Adding a Validation Error

If you want to reactively display an arbitrary validation error and it is not possible to use a custom validation function (perhaps you have to call a function `onSubmit` or wait for asynchronous results), you can add one or more errors to a validation context at any time by calling `myContext.addInvalidKeys(errors)`, where `errors` is an array of error objects with the following format:

```js
{name: key, type: errorType, value: anyValue}
```

* `name`: The schema key as specified in the schema.
* `type`: The type of error. Any string you want, or one of the following built-in strings:
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
* `value`: Optional. The value that was not valid. Will be used in place of `[value]` placeholder in error messages.

If you use a custom string for `type`, be sure to define a message for it. (See "Customizing Validation Messages").

Example:

```js
SimpleSchema.messages({wrongPassword: "Wrong password"});

myContext.addInvalidKeys([{name: 'password', type: 'wrongPassword'}]);
```

### Asynchronous Custom Validation on the Client

Validation runs synchronously for many reasons, and likely always will. This makes it difficult to wait for asynchronous results as part of custom validation. Here's one example of how you might validate that a username is unique on the client, without publishing all usernames to every client:

```js
username: {
  type: String,
  regEx: /^[a-z0-9A-Z_]{3,15}$/,
  unique: true,
  custom: function () {
    if (Meteor.isClient && this.isSet) {
      Meteor.call('accountsIsUsernameAvailable', this.value, function (error, result) {
        if (!result) {
          Meteor.users.simpleSchema().namedContext('createUserForm').addInvalidKeys([{name: 'username', type: 'notUnique'}]);
        }
      });
    }
  }
}
```

Note that we're calling our "accountsIsUsernameAvailable" server method and waiting for an asynchronous result, which is a boolean that indicates whether that username is available. If it's taken, we manually invalidate the `username` key with a "notUnique" error.

This doesn't change the fact that validation is synchronous. If you use this with an autoform and there are no validation errors, the form would still be submitted. However, the user creation would fail and a second or two later, the form would display the "notUnique" error, so the end result is very similar to actual asynchronous validation.

You can use a technique similar to this to work around asynchronicity issues in both client and server code.

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

To customize validation messages, pass a messages object to either 
`SimpleSchema.messages()` or `mySimpleSchemaInstance.messages()`. Instance-specific
messages are given priority over global messages.

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
SimpleSchema.messages({
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

You should call this method on both the client and the server to make sure
that your messages are consistent. You can call this method multiple times,
for example to change languages on the fly, and the messages on screen will
reactively change. If your message contains a `[label]` placeholder, the
label name reactively updates when changed, too.

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

## Best Practice Code Examples

### Make a field conditionally required

If you have a field that should be required only in certain circumstances, first make the field
optional, and then use a custom function similar to this:

```js
{
  field: {
    type: String,
    optional: true,
    custom: function () {
      if (customCondition && !this.isSet && (!this.operator || (this.value === null || this.value === ""))) {
        return "required";
      }
    }
  }
}
```

Where `customCondition` is whatever should trigger it being required.

Note: In the future we could make this a bit simpler by allowing `optional` to be a function that returns
true or false. Pull request welcome.

### Validate one key against another

Here's an example of declaring one value valid or invalid based on another
value using a custom validation function.

```js
SimpleSchema.messages({
  "passwordMismatch": "Passwords do not match"
});

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
    custom: function () {
      if (this.value !== this.field('password').value) {
        return "passwordMismatch";
      }
    }
  }
});
```

## Debug Mode

Set `SimpleSchema.debug = true` in your app before creating any named
validation contexts to cause all named validation contexts to automatically
log all invalid key errors to the browser console. This can be helpful while
developing an app to figure out why certain actions are failing validation.

## License

MIT

## Contributing

Anyone is welcome to contribute. Fork, make and test your changes
(`meteor test-packages ./`), and then submit a pull request.

### Thanks

(Add your name if it's missing.)

- @mquandalle
- @Nemo64

[![Support via Gittip](https://rawgithub.com/twolfson/gittip-badge/0.2.0/dist/gittip.png)](https://www.gittip.com/aldeed/)
