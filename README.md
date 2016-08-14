[![Build Status](https://travis-ci.org/aldeed/meteor-simple-schema.png?branch=master)](https://travis-ci.org/aldeed/meteor-simple-schema)

SimpleSchema
=========================

*aldeed:simple-schema*

A Meteor package that wraps the [simpl-schema](https://github.com/aldeed/node-simple-schema) NPM package and makes a few adjustments for better Meteor support.

## Installation

In your Meteor app directory, enter:

```
$ meteor add aldeed:simple-schema
```

## Reactivity

```js
if (Meteor.isClient) {
  Meteor.startup(() => {
    let context = BookSchema.namedContext("myContext");
    Tracker.autorun(() => {
      if (!context.isValid()) {
        console.log(context.validationErrors());
      }
    });
  });
}
```

## License

MIT
