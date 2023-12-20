# aldeed:simple-schema CHANGELOG

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [1.7.3 and higher](#173-and-higher)
- [1.7.2](#172)
- [1.7.1](#171)
- [1.7.0](#170)
- [1.6.2](#162)
- [1.6.1](#161)
- [1.6.0](#160)
- [1.5.9](#159)
- [1.5.8](#158)
- [1.5.7](#157)
- [1.5.6](#156)
- [1.5.5](#155)
- [1.5.4](#154)
- [1.5.3](#153)
- [1.5.2](#152)
- [1.5.1](#151)
- [1.5.0](#150)
- [1.4.3](#143)
- [1.4.2](#142)
- [1.4.1](#141)
- [1.4.0](#140)
- [1.3.0](#130)
- [1.2.2](#122)
- [1.2.1](#121)
- [1.2.0](#120)
- [1.1.2](#112)
- [1.1.1](#111)
- [1.1.0](#110)
- [1.0.0](#100)
- [0.5.0](#050)
- [0.4.2](#042)
- [0.4.1](#041)
- [0.4.0](#040)
- [0.3.2](#032)
- [0.3.1](#031)
- [0.3.0](#030)
- [0.2.3](#023)
- [0.2.2](#022)
- [0.2.1](#021)
- [0.2.0](#020)
- [0.1.1](#011)
- [0.1.0](#010)
- [0.0.4](#004)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 2.0.0

- back in maintenance
- moved all code from npm `simpl-schema@1.13.1` to this repo
- updated all tests to use `meteortesting:mocha` + chai
- prepare for Meteor 3.0 compatibility
- update CI
- publish as Meteor package

## 1.7.3 and higher

Release notes for versions 1.7.3 and higher can be found at https://github.com/aldeed/simpl-schema/releases

## 1.7.2

Update `message-box` dependency again to fix IE11 support

## 1.7.1

Update `message-box` dependency to fix IE11 support

## 1.7.0

If an array item (field ending with `.$`) has `optional: true`, this now allows it to have `null` items without any validation error being thrown. Previously adding `optional: true` to an array item had no effect.

## 1.6.2

- Adds `SimpleSchema.regEx.idOfLength` for variable length IDs
- Removes `deep-extend` dependency to fix undefined `Buffer` errors

## 1.6.1

Omit test files from the published package

## 1.6.0

- Removes all `lodash` packages
- Replaces `extend` package with `deep-extend`, which is smaller and is the same package used by the `message-box` dependency
- Improve the performance of handling fields with `blackbox: true` (thanks @cwouam)
- Add a `this` context for all rule functions (see README) (thanks @Neobii)
- Add a `this` context for all whole-doc validator functions (see README) (thanks @bhunjadi)

## 1.5.9

Fix issues with autoValues not being available in other autoValues

## 1.5.8

Update dependencies to fix vulnerabilities

## 1.5.7

Update Babel config in an attempt to fully support IE11s

## 1.5.6

- Update dependencies
- Adjust the way Babel builds so that you don't need to do `.default` when importing in a non-Babel Node project.

## 1.5.5

- Fix #294 - Now auto-converting values during cleaning does not convert if the value type is any of the types in a `oneOf` type

## 1.5.4

- Add `$setOnInsert` to modifiers for defaultValues only when `isUpsert` is set to `true` in clean options or in extended autoValue context. It used to be ignored but newer MongoDB versions throw an error. Might fix #304
- Fix #307 - Test for empty object when creating schema (thanks @coagmano)
- autoValue functions sort preserves fields order on the same depth (thanks @bhunjadi)
- `getAllowedValues` now returns `null` when `allowedValues` isn't set (thanks @MohammedEssehemy)
- Update Mocha and other dependencies
- Readme updates (thanks @ozzywalsh)

## 1.5.3

Update to latest mongo-object package dependency

## 1.5.2

Include README.md and LICENSE in the published package

## 1.5.1

- Fix issues with `$pull` modifier being incorrectly cleaned in some cases where some properties have `defaultValue` (thanks @vparpoil)
- Other behind-the-scenes refactoring

## 1.5.0

- `allowedValues` may now be a `Set` instance (thanks @kevinkassimo)
- Updated `EmailWithTLD` regular expression with one that is not susceptible to catastrophic backtracking attacks (thanks @davisjam)

## 1.4.3

- Forgetting to define the parent key of any key in a schema will now throw an error
- use Array.forEach to remove empty objects fixes #244 (#246)

## 1.4.2

The SimpleSchema constructor or `.extend()` will now throw an error if you define an Array field but forget to define the corresponding array item field.

## 1.4.1

Fixed an issue where defaultValues would be incorrectly added to `$setOnInsert` when your modifier contained `$unset` for deeply nested fields.

## 1.4.0

- Fixed an issue where the defaultValue `$setOnInsert` added to a modifier containing `$addToSet` would target an incorrect object path.
- When cleaning, it no longer tries to convert the type of `null`.
- Any value returned from autoValue/defaultValue is now cloned to prevent accidental mutation.
- Added `this.key` in the function context when executing schema definition properties that are functions. This can help you determine what the array index is for keys that are within arrays.
- Added a `clone()` function on SimpleSchema instances.

## 1.3.0

Add `this.key` and `this.closestSubschemaFieldName` to `autoValue` context to help with tricky situations when subschemas are used.

## 1.2.2

Fix an issue introduced by 1.2.1, where it was possible for a SimpleSchema instance passed to `extend` to be mutated.

## 1.2.1

Fix issues with Meteor Tracker reactivity sometimes not working when subschemas are involved.

## 1.2.0

The performance of `clean`, specifically of looping through the object to apply autoValues and defaultValues, has been greatly improved for large objects.

## 1.1.2

Passing a definition with no `type` to `extend` now works as expected, as long as the existing definition already has a `type`.

## 1.1.1

Passing an array of schemas to `new SimpleSchema()` or `extend()` now throws an error rather than failing silently with strange results.

## 1.1.0

- The `autoConvert` cleaning now converts strings that are "true" or "false" to Boolean if the schema expects a Boolean.
- The `autoConvert` cleaning now converts numbers to Boolean if the schema expects a Boolean, with 0 being `false` and all other numbers being `true`.

## 1.0.0

*BREAKING CHANGE:* autoValue and defaultValue handling has been rewritten to fix all known issues. As part of this rewrite, the behavior has changed to address a point of common confusion.

Previously, when you cleaned an object to add autoValues, a `defaultValue` would be added (and an `autoValue` function would run) even if the parent object was not present. (It would be created.)

Now, an `autoValue`/`defaultValue` will run only if the object in which it appears exists. Usually this is what you want, but if you are relying on the previous behavior, you can achieve the same thing by making sure that all ancestor objects have a `defaultValue: {}`.

For example, this:

```js
{
  profile: {
    type: Object,
    optional: true,
  },
  'profile.language': {
    type: String,
    defaultValue: 'en',
  },
}
```

previously cleaned `{}` to become `{ profile: { language: 'en' } }` but now would remain `{}`. If you want cleaning to result in `{ profile: { language: 'en' } }`, add the `profile` default value like:

```js
{
  profile: {
    type: Object,
    optional: true,
    defaultValue: {},
  },
  'profile.language': {
    type: String,
    defaultValue: 'en',
  },
}
```

If `profile` were nested under another object, you'd have to add `defaultValue: {}` to that object definition, too, and so on.

- Fix regression that resulted in `_constructorOptions key is missing "type"` error reappearing in some situations
- Fix errors when validating an object that has a property named `length`

## 0.5.0

- Remove underscore dependency in favor of seperated lodash modules

## 0.4.2

- Fix to properly add defaultValues in objects that are being $pushed in an update modifier
- Fix removeNullsFromArrays to remove only nulls

## 0.4.1

Fix cleaning an object with a `length` property

## 0.4.0

- Added `getFormValidator()`, similar to `validator()` but instead of throwing an error, it returns a Promise that resolves with the errors. This can be used as a [Composable Form Specification validator](http://forms.dairystatedesigns.com/user/validation/).
- Throw a better error when keys that conflict with Object prototype keys are used (Thanks @xavierpriour)
- Fix the incorrect "Found both autoValue and defaultValue options" warning (Thanks @SachaG)

## 0.3.2

Bump dependencies to fix `messages` issues

## 0.3.1

- When calling `pick` or `omit`, the `messageBox` and all original `SimpleSchema` constructor options are now properly kept. (Thanks @plumpudding)
- Fixed #80 (Thanks @jasonphillips)
- `getQuickTypeForKey` may now return additional strings "object" or "objectArray"
- Fix erroneous "Found both autoValue and defaultValue" warning (Thanks @SachaG)
- Fix passing of clean options when extending
- Other fixes to extending logic

## 0.3.0

- Added human-friendly `message` to each validation error in the `details` array on a thrown ClientError (thanks @unknown4unnamed)
- Fixed isInteger error on IE11 (thanks @lmachens)
- Switched to duck typing for `SimpleSchema` instanceof checks to fix failures due to multiple instances of the package (thanks @dpankros)
- Fixed multiple calls to `messages` for different schemas from affecting the other schemas (thanks @Josh-ES)

## 0.2.3

- Add missing deep-extend dependency

## 0.2.2

- Fixed Meteor Tracker reactivity

## 0.2.1

- It is no longer considered a validation error when a key within $unset is not defined in the schema.

## 0.2.0

- Added `ssInstance.getQuickTypeForKey(key)`
- Added `ssInstance.getObjectSchema(key)`

## 0.1.1

- Improved error for missing `type` property
- Use _.contains instead of Array.includes to fix some compatibility issues (thanks @DerekTBrown)
- Various documentation and test fixes

## 0.1.0

- Added `ssInstance.getAllowedValuesForKey(key)`

## 0.0.4

- Removed the `babel-polyfill` dependency. It may not cause problems, but to be safe you'll want to be sure that your app depends on and imports `babel-polyfill` or some other ES2015 polyfill package.
- `this.validationContext` is now available in all custom validator functions (thanks @yanickrochon)
- You can now call `SimpleSchema.setDefaultMessages(messages)`, passing in the same object you would pass to the `MessageBox` constructor, if you want to override the default messages for all schemas. This is in addition to being able to set `schema.messageBox` to your own custom `MessageBox` instance for a single schema, which you could already do. (thanks @clayne11)
- Labels with certain characters like single quotes will now show up correctly in validation error messages. (thanks @clayne11)
- `extend` is now chainable
- Requiredness validation now works for required fields that are in subschemas
- Fixed some issues with autoValues not being correctly added when they were deeply nested under several levels of arrays and objects.
