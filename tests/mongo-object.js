/* global MongoObject */

var flat = function(doc, opts) {
  var mDoc = new MongoObject(doc);
  return mDoc.getFlatObject(opts);
};

var passthru = function(doc) {
  var mDoc = new MongoObject(doc);
  return mDoc.getObject();
};

Tinytest.add("MongoObject - Round Trip", function(test) {
  // Helper Function
  function rt(o) {
    var po = passthru(o);
    var jo = JSON.stringify(o);
    var jpo = JSON.stringify(po);
    test.equal(jpo, jo, "After round trip, object was " + jpo + " but should have been " + jo);
  }

  // Round Trip Tests
  rt({});
  rt({a: 1});
  rt({a: "Test"});
  rt({a: new Date()});
  rt({a: []});
  rt({a: {}});
  rt({a: [1, 2]});
  rt({a: ["Test1", "Test2"]});
  rt({a: [new Date(), new Date()]});
  rt({a: {b: 1}});
  rt({a: {b: "Test"}});
  rt({a: {b: new Date()}});
  rt({a: {b: []}});
  rt({a: {b: {}}});
  rt({a: {b: [1, 2]}});
  rt({a: {b: ["Test1", "Test2"]}});
  rt({a: {b: [new Date(), new Date()]}});
  rt({a: {b: [{c: 1}, {c: 2}]}});
  rt({a: {b: [{c: "Test1"}, {c: "Test2"}]}});
  rt({a: {b: [{c: new Date()}, {c: new Date()}]}});

});

Tinytest.add("MongoObject - TypedArrays", function (test) {
  var mo = new MongoObject({foo: new Uint8Array(10)});
  test.isUndefined(mo._affectedKeys["foo.0"]);
});

Tinytest.add("MongoObject - Flat", function(test) {
  // Helper Function
  function testFlat(o, exp, opts) {
    var fo = flat(o, opts);
    var jo = JSON.stringify(o);
    var jfo = JSON.stringify(fo);
    var jexp = JSON.stringify(exp);
    test.equal(jfo, jexp, "Object " + jo + " was flattened to " + jfo + " but should have been " + jexp);
  }

  // Flatten Tests
  var testDate = new Date();
  testFlat({}, {});
  testFlat({a: 1}, {a: 1});
  testFlat({a: "Test"}, {a: "Test"});
  testFlat({a: testDate}, {a: testDate});
  testFlat({a: []}, {a: []});
  testFlat({a: {}}, {a: {}});
  testFlat({a: [1, 2]}, {"a.0": 1, "a.1": 2});
  testFlat({a: [1, 2]}, {a: [1, 2]}, {keepArrays: true});
  testFlat({a: ["Test1", "Test2"]}, {"a.0": "Test1", "a.1": "Test2"});
  testFlat({a: ["Test1", "Test2"]}, {a: ["Test1", "Test2"]}, {keepArrays: true});
  testFlat({a: [testDate, testDate]}, {"a.0": testDate, "a.1": testDate});
  testFlat({a: [testDate, testDate]}, {a: [testDate, testDate]}, {keepArrays: true});
  testFlat({a: {b: 1}}, {"a.b": 1});
  testFlat({a: {b: "Test"}}, {"a.b": "Test"});
  testFlat({a: {b: testDate}}, {"a.b": testDate});
  testFlat({a: {b: []}}, {"a.b": []});
  testFlat({a: {b: {}}}, {"a.b": {}});
  testFlat({a: {b: [1, 2]}}, {"a.b.0": 1, "a.b.1": 2});
  testFlat({a: {b: [1, 2]}}, {"a.b": [1, 2]}, {keepArrays: true});
  testFlat({a: {b: ["Test1", "Test2"]}}, {"a.b.0": "Test1", "a.b.1": "Test2"});
  testFlat({a: {b: ["Test1", "Test2"]}}, {"a.b": ["Test1", "Test2"]}, {keepArrays: true});
  testFlat({a: {b: [testDate, testDate]}}, {"a.b.0": testDate, "a.b.1": testDate});
  testFlat({a: {b: [testDate, testDate]}}, {"a.b": [testDate, testDate]}, {keepArrays: true});
  testFlat({a: {b: [{c: 1}, {c: 2}]}}, {"a.b.0.c": 1, "a.b.1.c": 2});
  testFlat({a: {b: [{c: 1}, {c: 2}]}}, {"a.b": [{c: 1}, {c: 2}]}, {keepArrays: true});
  testFlat({a: {b: [{c: "Test1"}, {c: "Test2"}]}}, {"a.b.0.c": "Test1", "a.b.1.c": "Test2"});
  testFlat({a: {b: [{c: "Test1"}, {c: "Test2"}]}}, {"a.b": [{c: "Test1"}, {c: "Test2"}]}, {keepArrays: true});
  testFlat({a: {b: [{c: testDate}, {c: testDate}]}}, {"a.b.0.c": testDate, "a.b.1.c": testDate});
  testFlat({a: {b: [{c: testDate}, {c: testDate}]}}, {"a.b": [{c: testDate}, {c: testDate}]}, {keepArrays: true});
});

Tinytest.add("MongoObject - removeValueForPosition", function(test) {
  // Helper Function
  function testRemove(o, exp, pos) {
    var mDoc = new MongoObject(o);
    mDoc.removeValueForPosition(pos);
    var jo = JSON.stringify(o);
    var jno = JSON.stringify(mDoc.getObject());
    var jexp = JSON.stringify(exp);
    test.equal(jno, jexp, "After round trip, object " + jo + " was " + jno + " but should have been " + jexp);
  }

  // correctly removed
  testRemove({
    foo: "bar"
  }, {}, 'foo');

  // correctly not removed
  testRemove({
    foo: "bar"
  }, {
    foo: "bar"
  }, 'fooBar');

  // all descendents are removed, too
  testRemove({
    foo: {
      bar: "foobar"
    }
  }, {}, 'foo');

  // but not siblings
  testRemove({
    foo: {
      bar: "foobar",
      foobar: 1
    }
  }, {
    foo: {
      bar: "foobar"
    }
  }, 'foo[foobar]');
});

Tinytest.add("MongoObject - getValueForPosition", function(test) {
  // Helper Function
  function testGetVal(o, pos, exp) {
    var mDoc = new MongoObject(o);
    var val = mDoc.getValueForPosition(pos);
    var jo = JSON.stringify(o);
    var jval = JSON.stringify(val);
    var jexp = JSON.stringify(exp);
    test.equal(jval, jexp, "Wrong value returned for position " + pos + " in object " + jo);
  }

  testGetVal({$pull: {foo: "bar"}}, '$pull', {foo: "bar"});

  testGetVal({$pull: {foo: "bar"}}, '$pull[foo]', 'bar');

  testGetVal({foo: ['bar']}, 'foo', ['bar']);

  testGetVal({foo: ['bar']}, 'foo[0]', 'bar');

  testGetVal({foo: [{a: 1}, {a: 2}]}, 'foo', [{a: 1}, {a: 2}]);

  testGetVal({foo: [{a: 1}, {a: 2}]}, 'foo[1]', {a: 2});

  testGetVal({foo: [{a: 1}, {a: 2}]}, 'foo[1][a]', 2);

});

Tinytest.add("MongoObject - getInfoForKey", function(test) {
  // Helper Function
  function testGetInfo(o, key, exp) {
    var mDoc = new MongoObject(o);
    var info = mDoc.getInfoForKey(key);
    var jo = JSON.stringify(o);
    var jinfo = JSON.stringify(info);
    var jexp = JSON.stringify(exp);
    test.equal(jinfo, jexp, "Wrong info returned for object " + jo);
  }

  testGetInfo({$set: {foo: "bar"}}, 'foo', {value: 'bar', operator: '$set'});

  testGetInfo({$set: {'foo.bar': 1}}, 'foo.bar', {value: 1, operator: '$set'});

  testGetInfo({$set: {'foo.bar': 1}}, '$set', undefined); //not valid

  testGetInfo({$set: {'foo.bar.0': 1}}, 'foo.bar.0', {value: 1, operator: '$set'});

  testGetInfo({$pull: {foo: "bar"}}, 'foo', {value: 'bar', operator: '$pull'});

  testGetInfo({foo: ['bar']}, 'foo', {value: ['bar'], operator: null});

  testGetInfo({foo: ['bar']}, 'foo.0', {value: 'bar', operator: null});

  testGetInfo({foo: [{a: 1}, {a: 2}]}, 'foo.1.a', {value: 2, operator: null});

  testGetInfo({foo: [{a: 1}, {a: 2}]}, 'foo.1', {value: {a: 2}, operator: null});

});

Tinytest.add("MongoObject - _keyToPosition", function(test) {
  // Helper Function
  function convert(key, wrapAll, exp) {
    var pos = MongoObject._keyToPosition(key, wrapAll);
    var jpos = JSON.stringify(pos);
    var jexp = JSON.stringify(exp);
    test.equal(jpos, jexp, "Key converted incorrectly to position");
  }

  convert('foo', false, 'foo');
  convert('foo', true, '[foo]');
  convert('foo.bar', false, 'foo[bar]');
  convert('foo.bar', true, '[foo][bar]');
  convert('foo.bar.0', false, 'foo[bar][0]');
  convert('foo.bar.0', true, '[foo][bar][0]');
});

Tinytest.add("MongoObject - makeKeyGeneric", function(test) {
  var generic = MongoObject.makeKeyGeneric('foo.0.0.ab.c.123.4square.d.67e.f.g.1');
  test.equal(generic, 'foo.$.$.ab.c.$.4square.d.67e.f.g.$');
});

Tinytest.add('MongoObject - cleanNulls', function(test) {
  var date = new Date(), oid = new Mongo.Collection.ObjectID();

  var cleaned = MongoObject.cleanNulls({
    a: void 0,
    b: undefined,
    c: null,
    d: "",
    e: "keep me",
    f: {
      a: void 0,
      b: undefined,
      c: null,
      d: "",
      e: "keep me"
    },
    g: {
      a: null
    },
    h: {
      a: date,
      b: oid
    }
  });
  test.equal(cleaned, {e: "keep me", f: {e: "keep me"}, h: { a: date, b: oid }});
});

Tinytest.add('MongoObject - reportNulls', function(test) {
  var report = MongoObject.reportNulls({
    a: void 0,
    b: undefined,
    c: null,
    d: "",
    e: "keep me"
  });
  test.equal(report, {
    a: "",
    b: "",
    c: "",
    d: ""
  });
});

Tinytest.add('MongoObject - docToModifier', function(test) {
  var date = new Date(), testObj, mod;

  testObj = {
    a: 1,
    b: "foo",
    c: date,
    d: {
      a: 1,
      b: "foo",
      c: date,
      d: [
        {
          a: 1,
          b: "foo",
          c: date,
          d: {
            a: 1,
            b: "foo",
            c: date,
            d: null // make sure that null, empty, etc. don't end up in $unset when under an array
          }
        }
      ],
      e: [1, 2]
    },
    e: null,
    f: "",
    g: void 0 //undefined props are removed
  };

  // Test 1 w/ keepArrays, w/ keepEmptyStrings
  mod = MongoObject.docToModifier(testObj, {keepArrays: true, keepEmptyStrings: true});
  test.equal(mod, {
    $set: {
      a: 1,
      b: "foo",
      c: date,
      'd.a': 1,
      'd.b': "foo",
      'd.c': date,
      'd.d': [ //array of objects should remain array
        {
          a: 1,
          b: "foo",
          c: date,
          d: {
            a: 1,
            b: "foo",
            c: date
            // null should have been removed, too
          }
        }
      ],
      'd.e': [1, 2], //array of non-objects should remain array
      f: "" // empty string should be set rather than unset
    },
    $unset: {
      e: ""
    }
  });

  // Test 2 w/ keepArrays, w/o keepEmptyStrings
  mod = MongoObject.docToModifier(testObj, {keepArrays: true, keepEmptyStrings: false});
  test.equal(mod, {
    $set: {
      a: 1,
      b: "foo",
      c: date,
      'd.a': 1,
      'd.b': "foo",
      'd.c': date,
      'd.d': [ //array of objects should remain array
        {
          a: 1,
          b: "foo",
          c: date,
          d: {
            a: 1,
            b: "foo",
            c: date
            // null should have been removed, too
          }
        }
      ],
      'd.e': [1, 2] //array of non-objects should remain array
    },
    $unset: {
      e: "",
      f: ""
    }
  });

  // Test 3 w/o keepArrays, w/ keepEmptyStrings
  mod = MongoObject.docToModifier(testObj, {keepArrays: false, keepEmptyStrings: true});
  test.equal(mod, {
    $set: {
      a: 1,
      b: "foo",
      c: date,
      'd.a': 1,
      'd.b': "foo",
      'd.c': date,
      'd.d.0.a': 1,
      'd.d.0.b': "foo",
      'd.d.0.c': date,
      'd.d.0.d.a': 1,
      'd.d.0.d.b': "foo",
      'd.d.0.d.c': date,
      'd.e.0': 1,
      'd.e.1': 2,
      f: ""
    },
    $unset: {
      'd.d.0.d.d': "",
      e: ""
    }
  });

  // Test 4 w/o keepArrays, w/o keepEmptyStrings
  mod = MongoObject.docToModifier(testObj, {keepArrays: false, keepEmptyStrings: false});
  test.equal(mod, {
    $set: {
      a: 1,
      b: "foo",
      c: date,
      'd.a': 1,
      'd.b': "foo",
      'd.c': date,
      'd.d.0.a': 1,
      'd.d.0.b': "foo",
      'd.d.0.c': date,
      'd.d.0.d.a': 1,
      'd.d.0.d.b': "foo",
      'd.d.0.d.c': date,
      'd.e.0': 1,
      'd.e.1': 2
    },
    $unset: {
      'd.d.0.d.d': "",
      e: "",
      f: ""
    }
  });
});

Tinytest.add('MongoObject - expandObj', function(test) {
  function testExpandObj(val, expect) {
    var mod = MongoObject.expandObj(val);
    test.equal(JSON.stringify(mod), JSON.stringify(expect));
  }

  testExpandObj({}, {});
  testExpandObj({foo: "bar"}, {foo: "bar"});
  testExpandObj({foo: "bar", baz: 1}, {foo: "bar", baz: 1});
  testExpandObj({
    'foo.bar': "baz",
    baz: 1
  }, {
    foo: {bar: "baz"},
    baz: 1
  });
  testExpandObj({
    'foo.bar.0': "foo",
    'foo.bar.1': "baz",
    baz: 1
  }, {
    foo: {bar: ["foo", "baz"]},
    baz: 1
  });
  testExpandObj({
    'foo.bar.1': "baz",
    baz: 1
  }, {
    foo: {bar: [null, "baz"]},
    baz: 1
  });
  testExpandObj({
    'foo.bar.1.bam': "baz",
    baz: 1
  }, {
    foo: {bar: [null, {bam: "baz"}]},
    baz: 1
  });
  testExpandObj({
    'foo.bar.0': null,
    'foo.bar.1.bam': "baz",
    baz: 1
  }, {
    foo: {bar: [null, {bam: "baz"}]},
    baz: 1
  });
  testExpandObj({
    'foo.bar.0': "baz",
    'foo.bar.1.bam': "baz",
    baz: 1
  }, {
    foo: {bar: ["baz", {bam: "baz"}]},
    baz: 1
  });
  testExpandObj({
    'foo.bar.0': "baz",
    'foo.bar.1.bam': "baz",
    'foo.bar.1.boo': "foo",
    baz: 1
  }, {
    foo: {bar: ["baz", {bam: "baz", boo: "foo"}]},
    baz: 1
  });
  testExpandObj({
    'foo.0': null,
    'foo.1.bar': "baz",
    baz: 1
  }, {
    foo: [null, {bar: "baz"}],
    baz: 1
  });
  testExpandObj({
    'foo.0': null,
    'foo.1.bar': null,
    baz: 1
  }, {
    foo: [null, {bar: null}],
    baz: 1
  });
});

//Test API:
//test.isFalse(v, msg)
//test.isTrue(v, msg)
//test.equal(actual, expected, message, not)
//test.length(obj, len)
//test.include(s, v)
//test.isNaN(v, msg)
//test.isUndefined(v, msg)
//test.isNotNull
//test.isNull
//test.throws(func)
//test.instanceOf(obj, klass)
//test.notEqual(actual, expected, message)
//test.runId()
//test.exception(exception)
//test.expect_fail()
//test.ok(doc)
//test.fail(doc)
//test.equal(a, b, msg)
