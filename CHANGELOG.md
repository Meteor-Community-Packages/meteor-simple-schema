simple-schema
=========================

A simple, reactive schema validation smart package for Meteor. 

## Change Log

### next

* A SimpleSchema object is now a valid second parameter for the build-in `check` and `Match.test` functions
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