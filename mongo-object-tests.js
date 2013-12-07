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