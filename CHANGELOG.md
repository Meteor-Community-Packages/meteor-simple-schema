simple-schema
=========================

A simple, reactive schema validation smart package for Meteor. 

## Change Log

### 0.2.31

* When combining and extending SimpleSchema instances, the individual field
definitions are now extended, meaning that you can add or override the
schema options for an already-defined schema key.
* Error messages can now be defined globally using `SimpleSchema.messages()`.
Instance-specific messages are still supported and are given precedence over
global messages.
* The `label` option can now be a function that returns a string. Whenever you
need a schema key's label, use the new `mySchema.label(key)` method to get it.
* Support `custom` option. This will likely replace `valueIsAllowed` eventually.
Refer to "Custom Validation" and "Validating One Key Against Another" sections
in the README.

### 0.2.30

Made a change that fixes an issue with the autoform package. When you specified
a `doc` attribute for an autoform and that document was retrieved from a
collection that had helpers attached using the `collection-helpers` package,
the autoform fields were not populated with the values from the document. Now
they are.

### 0.2.29

* Autoconvert to numbers from strings using `Number()` instead of `parseFloat()`.
* Minor improvements to validation logic.
* README additions

### 0.2.28

Remove automatic call to `clean` when validating. This has no effect on 
validation done through a collection with the `collection2` package. However,
validation done directly with a SimpleSchema instance will now catch more
schema issues than it previously did (since 0.2.18).

### 0.2.27

Clone schema argument before modifying it

### 0.2.26

Fix basic object checking for IE 8

### 0.2.25

Complete rewrite of the internal validation logic. This solves some sticky
issues with array validation in more complex objects. It should not affect
the API or validation results, but you may notice some additional or slightly
different validation errors. Also, if you make use of the internally cached
copy of the schema definitions (`ss._schema or ss.schema()`), you may notice
some differences there.

The main change internally is that an array definition is now split into two
definitions. For example, if your schema is:

```js
{
  myArray: {
    type: [String]
  }
}
```

It is internally split and stored as:

```js
{
  myArray: {
    type: Array
  },
  'myArray.$': {
    type: String
  }
}
```

### 0.2.24

* Correctly validate $inc operator
* Allow passing an array of schemas to SimpleSchema constructor, which merges
them to create the actual schema definition.

### 0.2.23

Fix an issue, introduced in 0.2.21, that prevented autoconversion of values
in arrays.

### 0.2.22

Add tests for MongoObject and fix some issues found by the tests.

### 0.2.21

Fix an issue where cleaning a doc would convert empty arrays to empty strings.

### 0.2.20

Improve and export `MongoObject` class for use by collection2 and others.

### 0.2.19

Make sure min/max string length settings are respected when there is also
a regEx option specified.

### 0.2.18

* Add support for named contexts. Use `mySimpleSchema.namedContext(name)`
method to access the named context, creating it if it does not exist yet.
* The `validate` and `validateOne` methods on a SimpleSchema context now
clean (filter and autoconvert) the doc before validating it. You should no
longer call the `clean` method yourself before validating. If you do have a
good reason to call the `clean` method before calling `validate` or
`validateOne`, then set the `filter` and `autoConvert` options to `false`
when calling `validate` or `validateOne` to prevent double cleaning.
* The `validate` and `validateOne` methods on a SimpleSchema context now return
`true` or `false` to indicate the validity of the document or field, respectively.
You do not need to call a separate method to check validity.

### 0.2.17

Throw an error when the modifier is an empty object for an update or upsert.
This prevents overwriting the entire document with nothing, leaving only
an `_id` field left.

### 0.2.16

Fix handling of min or max when set to 0.

### 0.2.15

Adjust handling of validation errors for arrays of objects. Now when a validation
error is added to the list for a property of an object that is a member of an
array, the key name is listed with the array index instead of a dollar sign. For
example, `friends.0.name` instead of `friends.$.name`.

### 0.2.14

* Ensure valueIsAllowed function is called for undefined and null values. This
change means that you must not ensure that your valueIsAllowed function returns
true when the value is `null` or `undefined`, if you want the field to be optional.
* Fix an issue with false "required" errors for some arrays of objects when
validating a modifier.

### 0.2.13

Fix $pullAll and clean $pushAll by converting it to $push+$each rather than
deleting it.

### 0.2.12

Add workaround for Safari bug.

### 0.2.11

`Clean` method should now clean everything.

### 0.2.10

Validate upserts

### 0.2.9

Fix validation of required subobjects when omitted from a $set

### 0.2.8

* Add label inflection and allow labels to be changed dynamically with `labels` method.
* Allow min and max to be a function that returns a min/max value
* Allow array of regEx with specific messages for each

### 0.2.7

Refactor validation loop to improve and not use collapse/expand

### 0.2.6

Add subschema support (@sbking) and use Match.Any for `type` schema key test

### 0.2.5

Fix validation of $push or $addToSet for non-objects

### 0.2.4

Fix validation of objects as values of modifier keys

### 0.2.3

Fix validation of custom objects

### 0.2.2

Fix validation of arrays of objects

### 0.2.1

Fix minor issues related to $unset key validation

### 0.2.0

*(Backwards compatibility break!)*

* Validation contexts are now supported, allowing you to track validity separately for multiple objects that use the same SimpleSchema
* Some of the API has changed, related to the support for validation contexts
* All mongo modifier operators are now recognized and properly validated; as part of this, you must now tell the validation functions whether you are passing them a normal object or a mongo modifier object
* Validation errors are now thrown if fields not allowed by the schema are present in the object
* When you create a schema, your definition object is now checked to make sure you didn't misspell any of the rules

### 0.1.13

* A SimpleSchema object is now a valid second parameter for the built-in `check` and `Match.test` functions
* `.match()` method is deprecated

### 0.1.12

Return true from `match()`

### 0.1.11

Fix issue where `filter()` could strip out `$` keys

### 0.1.10

Support custom validation functions (used by collection2 package)

### 0.1.9

Pass doc to `valueIsAllowed` function so that validating one key against another is possible

### 0.1.8

Deprecated the regExMessage key in schema definition and replaced with the
ability to customize all validation error messages per error type and per schema
key if necessary. Refer to the Read Me.