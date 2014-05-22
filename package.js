Package.describe({
  name: "simple-schema",
  summary: "A simple schema validation object with reactivity. Used by collection2 and autoform."
});

Npm.depends({
  "string": "1.6.0"
});

Package.on_use(function(api) {
  api.use(['deps', 'underscore', 'check', 'random'], ['client', 'server']);
  api.add_files('string.js', 'client');
  api.add_files([
    'mongo-object.js',
    'simple-schema-utility.js',
    'simple-schema.js',
    'simple-schema-validation.js',
    'simple-schema-validation-new.js',
    'simple-schema-context.js'
  ]);

  if (typeof api.export !== "undefined") {
    //backwards compatibility with pre-0.6.5 meteor
    api.export(['SimpleSchema', 'MongoObject'], ['client', 'server']);
  }
});

Package.on_test(function(api) {
  api.use('simple-schema', ['client', 'server']);
  api.use('test-helpers', ['client', 'server']);
  api.use('tinytest', ['client', 'server']);
  api.add_files(["simple-schema-tests.js", "mongo-object-tests.js"], ['client', 'server']);
});