CollectionSchema
=========================

A smart package for Meteor that extends Meteor.Collection to provide support for specifying a schema and then validating against that schema when inserting and updating. Also adds support for virtual fields.

## Basic Usage

When defining your models, use `new Meteor.Collection2()` instead of `new Meteor.Collection()`. It works the same, but you can specify a `schema` property in the options.

## Example
```js
Books = new Meteor.Collection2("books", {
    schema: {
        title: {
            type: String,
            label: "Title"
        },
        author: {
            type: String,
            label: "Author"
        },
        copies: {
            type: Number,
            label: "Number of copies"
        },
        summary: {
            type: String,
            label: "Brief summary",
            optional: true,
            rows: 8,
            max: 1000
        }
    }
});
```

## Easy Forms

The formhelper package makes use of CollectionSchema to help you quickly develop forms that do simple inserts and updates.