var flat = function(doc) {
  var mDoc = new MongoObject(doc);
  return mDoc.getFlatObject();
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
  rt({a: new Date});
  rt({a: []});
  rt({a: {}});
  rt({a: [1, 2]});
  rt({a: ["Test1", "Test2"]});
  rt({a: [new Date, new Date]});
  rt({a: {b: 1}});
  rt({a: {b: "Test"}});
  rt({a: {b: new Date}});
  rt({a: {b: []}});
  rt({a: {b: {}}});
  rt({a: {b: [1, 2]}});
  rt({a: {b: ["Test1", "Test2"]}});
  rt({a: {b: [new Date, new Date]}});
  rt({a: {b: [{c: 1}, {c: 2}]}});
  rt({a: {b: [{c: "Test1"}, {c: "Test2"}]}});
  rt({a: {b: [{c: new Date}, {c: new Date}]}});

});

Tinytest.add("MongoObject - Flat", function(test) {
  // Helper Function
  function testFlat(o, exp) {
    var fo = flat(o);
    var jo = JSON.stringify(o);
    var jfo = JSON.stringify(fo);
    var jexp = JSON.stringify(exp);
    test.equal(jfo, jexp, "Object " + jo + " was flattened to " + jfo + " but should have been " + jexp);
  }

  // Round Trip Tests
  var testDate = new Date;
  testFlat({}, {});
  testFlat({a: 1}, {a: 1});
  testFlat({a: "Test"}, {a: "Test"});
  testFlat({a: testDate}, {a: testDate});
  testFlat({a: []}, {a: []});
  testFlat({a: {}}, {a: {}});
  testFlat({a: [1, 2]}, {"a.0": 1, "a.1": 2});
  testFlat({a: ["Test1", "Test2"]}, {"a.0": "Test1", "a.1": "Test2"});
  testFlat({a: [testDate, testDate]}, {"a.0": testDate, "a.1": testDate});
  testFlat({a: {b: 1}}, {"a.b": 1});
  testFlat({a: {b: "Test"}}, {"a.b": "Test"});
  testFlat({a: {b: testDate}}, {"a.b": testDate});
  testFlat({a: {b: []}}, {"a.b": []});
  testFlat({a: {b: {}}}, {"a.b": {}});
  testFlat({a: {b: [1, 2]}}, {"a.b.0": 1, "a.b.1": 2});
  testFlat({a: {b: ["Test1", "Test2"]}}, {"a.b.0": "Test1", "a.b.1": "Test2"});
  testFlat({a: {b: [testDate, testDate]}}, {"a.b.0": testDate, "a.b.1": testDate});
  testFlat({a: {b: [{c: 1}, {c: 2}]}}, {"a.b.0.c": 1, "a.b.1.c": 2});
  testFlat({a: {b: [{c: "Test1"}, {c: "Test2"}]}}, {"a.b.0.c": "Test1", "a.b.1.c": "Test2"});
  testFlat({a: {b: [{c: testDate}, {c: testDate}]}}, {"a.b.0.c": testDate, "a.b.1.c": testDate});
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