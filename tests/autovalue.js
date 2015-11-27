Tinytest.add('SimpleSchema - autoValue - base', function (test) {
  var o;

  var autoValues = new SimpleSchema({
    name: {
      type: String
    },
    someDefault: {
      type: Number,
      autoValue: function() {
        if (!this.isSet) {
          return 5;
        }
      }
    },
    updateCount: {
      type: Number,
      autoValue: function() {
        if (!this.operator) {
          return 0;
        } else {
          return {$inc: 1};
        }
      }
    },
    content: {
      type: String,
      optional: true
    },
    firstWord: {
      type: String,
      optional: true,
      autoValue: function() {
        var content = this.field("content");
        if (content.isSet) {
          return content.value.split(' ')[0];
        } else {
          this.unset();
        }
      }
    },
    updatesHistory: {
      type: [Object],
      optional: true,
      autoValue: function() {
        var content = this.field("content");
        if (content.isSet) {
          if (!this.operator) {
            return [{
                date: new Date(),
                content: content.value
              }];
          } else {
            return {
              $push: {
                date: new Date(),
                content: content.value
              }
            };
          }
        }
      }
    },
    'updatesHistory.$.date': {
      type: Date,
      optional: true
    },
    'updatesHistory.$.content': {
      type: String,
      optional: true
    },
    avArrayOfObjects: {
      type: [Object],
      optional: true
    },
    'avArrayOfObjects.$.a': {
      type: String
    },
    'avArrayOfObjects.$.foo': {
      type: String,
      autoValue: function () {
        return "bar";
      }
    }
  });

  function avClean(obj, exp, opts) {
    autoValues.clean(obj, opts);
    test.equal(obj, exp);
  }

  avClean(
          {name: "Test", firstWord: "Illegal to manually set value"},
  {name: "Test", someDefault: 5, updateCount: 0}
  );

  avClean(
          {name: "Test", someDefault: 20},
  {name: "Test", someDefault: 20, updateCount: 0}
  );

  o = {name: "Test", content: 'Hello world!'};
  autoValues.clean(o);
  test.equal(o.firstWord, 'Hello', 'expected firstWord to be "Hello"');
  test.length(o.updatesHistory, 1);
  test.equal(o.updatesHistory[0].content, 'Hello world!', 'expected updatesHistory.content to be "Hello world!"');

  // $each in pseudo modifier
  var eachAV = new SimpleSchema({
    psuedoEach: {
      type: Array,
      optional: true,
      autoValue: function() {
        if (this.isSet && this.operator === "$set") {
          return {$push: {$each: this.value}};
        }
      }
    },
    'psuedoEach.$': {
      type: String
    }
  });
  o = {$set: {psuedoEach: ["foo", "bar"]}};
  eachAV.clean(o);
  test.equal(o, {$push: {psuedoEach: {$each: ["foo", "bar"]}}});

  // autoValues in object in array with modifier
  o = {$push: {avArrayOfObjects: {a: "b"}}};
  autoValues.clean(o);
  test.equal(o, {$push: {avArrayOfObjects: {a: "b", foo: "bar"}}, $set: {someDefault: 5}, $inc:{updateCount:1}}, 'autoValue in object in array not set correctly');

  o = {$set: {avArrayOfObjects: [{a: "b"}, {a: "c"}]}};
  autoValues.clean(o);
  test.equal(o, {$set: {avArrayOfObjects: [{a: "b", foo: "bar"}, {a: "c", foo: "bar"}], someDefault: 5}, $inc:{updateCount:1}}, 'autoValue in object in array not set correctly');

  var av = new SimpleSchema({
    foo: {
      type: String,
      optional: true
    },
    bar: {
      type: Boolean,
      optional: true,
      autoValue: function() {
        test.equal(this.isSet, false);
        test.isUndefined(this.value);
        test.equal(this.operator, null);
        var foo = this.field('foo');
        test.equal(foo.isSet, false);
        test.isUndefined(foo.value);
        test.equal(foo.operator, null);
        foo = this.siblingField('foo');
        test.equal(foo.isSet, false);
        test.isUndefined(foo.value);
        test.equal(foo.operator, null);
      }
    }
  });
  av.clean({});

  var av2 = new SimpleSchema({
    foo: {
      type: String,
      optional: true
    },
    bar: {
      type: Boolean,
      optional: true,
      autoValue: function() {
        test.equal(this.isSet, false);
        test.isUndefined(this.value);
        test.equal(this.operator, null);
        var foo = this.field('foo');
        test.equal(foo.isSet, true);
        test.equal(foo.value, "clown");
        test.equal(foo.operator, null);
        foo = this.siblingField('foo');
        test.equal(foo.isSet, true);
        test.equal(foo.value, "clown");
        test.equal(foo.operator, null);
      }
    }
  });
  av2.clean({foo: "clown"});

  var av3 = new SimpleSchema({
    foo: {
      type: String,
      optional: true
    },
    bar: {
      type: Boolean,
      optional: true,
      autoValue: function() {
        test.equal(this.isSet, true);
        test.equal(this.value, true);
        test.equal(this.operator, null);
        var foo = this.field('foo');
        test.equal(foo.isSet, true);
        test.equal(foo.value, "clown");
        test.equal(foo.operator, null);
        foo = this.siblingField('foo');
        test.equal(foo.isSet, true);
        test.equal(foo.value, "clown");
        test.equal(foo.operator, null);
      }
    }
  });
  av3.clean({foo: "clown", bar: true});

  var av4 = new SimpleSchema({
    foo: {
      type: String,
      optional: true
    },
    bar: {
      type: Boolean,
      optional: true,
      autoValue: function() {
        test.equal(this.isSet, true);
        test.equal(this.value, false);
        test.equal(this.operator, null);
        var foo = this.field('foo');
        test.equal(foo.isSet, false);
        test.isUndefined(foo.value);
        test.equal(foo.operator, null);
        foo = this.siblingField('foo');
        test.equal(foo.isSet, false);
        test.isUndefined(foo.value);
        test.equal(foo.operator, null);
        this.unset();
      }
    }
  });
  var doc = {bar: false};
  av4.clean(doc);
  test.equal(doc, {});

  var av5 = new SimpleSchema({
    foo: {
      type: String,
      optional: true
    },
    bar: {
      type: Boolean,
      optional: true,
      autoValue: function() {
        test.equal(this.isSet, true);
        test.equal(this.value, false);
        test.equal(this.operator, "$set");
        var foo = this.field('foo');
        test.equal(foo.isSet, false);
        test.isUndefined(foo.value);
        test.equal(foo.operator, null);
        foo = this.siblingField('foo');
        test.equal(foo.isSet, false);
        test.isUndefined(foo.value);
        test.equal(foo.operator, null);
      }
    }
  });
  doc = {$set: {bar: false}};
  av5.clean(doc);
  test.equal(doc, {$set: {bar: false}});

  var av6 = new SimpleSchema({
    foo: {
      type: String,
      optional: true
    },
    bar: {
      type: Boolean,
      optional: true,
      autoValue: function() {
        test.equal(this.isSet, true);
        test.equal(this.value, false);
        test.equal(this.operator, "$set");
        var foo = this.field('foo');
        test.equal(foo.isSet, true);
        test.equal(foo.value, "clown");
        test.equal(foo.operator, "$set");
        foo = this.siblingField('foo');
        test.equal(foo.isSet, true);
        test.equal(foo.value, "clown");
        test.equal(foo.operator, "$set");
        return true;
      }
    }
  });
  doc = {$set: {foo: "clown", bar: false}};
  av6.clean(doc);
  test.equal(doc, {$set: {foo: "clown", bar: true}});

  var av7 = new SimpleSchema({
    foo: {
      type: String,
      optional: true
    },
    bar: {
      type: Boolean,
      optional: true,
      autoValue: function() {
        test.equal(this.isSet, false);
        test.isUndefined(this.value);
        test.equal(this.operator, '$set');
        var foo = this.field('foo');
        test.equal(foo.isSet, false);
        test.isUndefined(foo.value);
        test.equal(foo.operator, null);
        foo = this.siblingField('foo');
        test.equal(foo.isSet, false);
        test.isUndefined(foo.value);
        test.equal(foo.operator, null);
        return {$set: true};
      }
    }
  });
  doc = {};
  av7.clean(doc, {isModifier: true});
  test.equal(doc, {$set: {bar: true}});
});

Tinytest.add("SimpleSchema - autoValue - defaultValue", function(test) {
  var defaultValues = new SimpleSchema({
    name: {
      type: String,
      defaultValue: "Test",
      optional: true
    },
    'a.b': {
      type: String,
      defaultValue: "Test",
      optional: true
    },
    'b.$.a': {
      type: String,
      defaultValue: "Test",
      optional: true
    },
    strVals: {
      type: [String],
      defaultValue: [],
      optional: true
    }
  });

  function avClean(obj, exp) {
    defaultValues.clean(obj);
    test.equal(obj, exp);
  }

  avClean(
          {},
          {name: "Test", a: {b: "Test"}, strVals: []}
  );

  avClean(
          {strVals: ["foo", "bar"]},
          {name: "Test", a: {b: "Test"}, strVals: ["foo", "bar"]}
  );

  avClean(
          {name: "Test1", a: {b: "Test1"}},
  {name: "Test1", a: {b: "Test1"}, strVals: []}
  );

  avClean(
          {name: "Test1", a: {b: "Test1"}, b: []},
  {name: "Test1", a: {b: "Test1"}, b: [], strVals: []}
  );

  avClean(
    {name: "Test1", a: {b: "Test1"}, b: [{}]},
    {name: "Test1", a: {b: "Test1"}, b: [{a: "Test"}], strVals: []}
  );

  avClean(
    {name: "Test1", a: {b: "Test1"}, b: [{a: "Test1"}, {}]},
    {name: "Test1", a: {b: "Test1"}, b: [{a: "Test1"}, {a: "Test"}], strVals: []}
  );

  // Updates should not be affected, but should get $setOnInsert
  avClean(
          {$addToSet: {strVals: 'new value'}},
          {
            $addToSet: {strVals: 'new value'},
            $setOnInsert: {
              name: 'Test',
              'a.b': 'Test'
            }
          }
  );

});

Tinytest.add('SimpleSchema - autoValue - objects in arrays', function (test) {
  var SubSchema = new SimpleSchema({
    value: {
      type: String,
      autoValue: function () {
        test.isTrue(this.isSet);
        test.equal(this.operator, '$set');
        test.equal(this.value, 'should be overridden by autovalue');
        return 'autovalue';
      }
    }
  });

  var TestSchema = new SimpleSchema({
    children: {
      type: [SubSchema]
    }
  });

  var mod = {
    $set: {"children.$.value": "should be overridden by autovalue"}
  };
  TestSchema.clean(mod);

  test.equal(mod.$set['children.$.value'], 'autovalue');
});

Tinytest.add('SimpleSchema - autoValue - operator correct for $pull', function (test) {
  var called = false;

  var schema = new SimpleSchema({
    foo: {
      type: [String],
      autoValue: function () {
        called = true;
        test.equal(this.operator, '$pull');
      }
    }
  });

  var mod = { $pull: {foo: 'bar'}};
  schema.clean(mod);

  test.isTrue(called);
});

Tinytest.add('SimpleSchema - autoValue - issue 340', function (test) {
  var called = 0;

  var schema = new SimpleSchema({
    field1: {
      type: Number
    },
    field2: {
      type: String,
      autoValue: function () {
        called++;
        test.equal(this.field('field1').value, 1);
        test.equal(this.siblingField('field1').value, 1);
        return 'foo';
      }
    }
  });

  schema.clean({field1: 1});
  schema.clean({$set: {field1: 1}});

  test.equal(called, 2);
});

Tinytest.add('SimpleSchema - autoValue - issue 426', function (test) {
  var schema = new SimpleSchema({
    name: {
      type: String,
    },
    images: {
      type: [Object],
      label: 'Images',
      minCount: 0,
      defaultValue: [],
    }
  });

  var doc = {name: 'Test'};
  schema.clean(doc);
  test.equal(doc, {name: 'Test', images: []});
});
