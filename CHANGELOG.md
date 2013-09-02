simple-schema
=========================

A simple, reactive schema validation smart package for Meteor. 

## Change Log

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