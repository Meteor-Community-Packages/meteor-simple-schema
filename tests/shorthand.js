Tinytest.add('SimpleSchema - shorthand', function (test) {
  let ss1 = new SimpleSchema({
    name: String,
    count: Number,
    exp: /foo/
  });

  let ss1SchemaObj = ss1.schema();

  test.equal(ss1SchemaObj.name, {
    type: String,
    optional: false,
    label: 'Name',
  });
  test.equal(ss1SchemaObj.count, {
    type: Number,
    optional: false,
    label: 'Count',
  });
  test.equal(ss1SchemaObj.exp, {
    type: String,
    regEx: /foo/,
    optional: false,
    label: 'Exp',
  });

  let ss2 = new SimpleSchema({
    name: [String],
    count: [Number]
  });

  let ss2SchemaObj = ss2.schema();

  test.equal(ss2SchemaObj.name, {
    type: Array,
    optional: false,
    label: 'Name',
  });
  test.equal(ss2SchemaObj['name.$'], {
    type: String,
    optional: true,
    label: 'Name',
  });
  test.equal(ss2SchemaObj.count, {
    type: Array,
    optional: false,
    label: 'Count',
  });
  test.equal(ss2SchemaObj['count.$'], {
    type: Number,
    optional: true,
    label: 'Count',
  });
});
