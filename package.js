Package.describe({
  name: "aldeed:simple-schema",
  summary: "A simple schema validation object with reactivity. Used by collection2 and autoform.",
  version: "1.3.3",
  git: "https://github.com/aldeed/meteor-simple-schema.git"
});

Npm.depends({
  "string": "1.6.0"
});

Package.on_use(function(api) {

  if (api.versionsFrom) {
    api.use('deps@1.0.0');
    api.use('underscore@1.0.0');
    api.use('check@1.0.0');
    api.use('random@1.0.0');
  } else {
    api.use(['deps', 'underscore', 'check', 'random']);
  }

  api.add_files('string.js', 'client');
  api.add_files([
    'mongo-object.js',
    'simple-schema-utility.js',
    'simple-schema.js',
    'simple-schema-validation.js',
    'simple-schema-validation-new.js',
    'simple-schema-context.js'
  ]);
  api.export(['SimpleSchema', 'MongoObject'], ['client', 'server']);
});

Package.on_test(function(api) {

  if (api.versionsFrom) {
    api.use("aldeed:simple-schema");
    api.use('tinytest@1.0.0');
    api.use('test-helpers@1.0.0');
  } else {
    api.use(["simple-schema", "tinytest", "test-helpers"]);
  }

  api.add_files(["simple-schema-tests.js", "mongo-object-tests.js"], ['client', 'server']);
});
