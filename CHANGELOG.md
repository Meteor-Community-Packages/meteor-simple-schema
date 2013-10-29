simple-schema
=========================

A simple, reactive schema validation smart package for Meteor. 

## Change Log

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