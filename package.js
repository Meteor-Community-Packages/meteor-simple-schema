Package.describe({
  name: "aldeed:simple-schema",
  summary: "A simple schema validation object with reactivity. Used by collection2 and autoform.",
  version: "1.3.3",
  git: "https://github.com/aldeed/meteor-simple-schema.git"
});

Package.onUse(function(api) {
  if (api.versionsFrom) {
    api.use('tracker@1.0.0');
    api.use('underscore@1.0.0');
    api.use('check@1.0.0');
    api.use('random@1.0.0');
  } else {
    api.use(['tracker', 'underscore', 'check', 'random']);
  }

  api.addFiles([
    'lib/string-polyfills.js',
    'lib/string-humanize.js',
    'lib/mongo-object.js',
    'lib/utility.js',
    'lib/base.js',
    'lib/reg-exp.js',
    'lib/spawn.js',
    'lib/labels.js',
    'lib/messages.js',
    'lib/clean.js',
    'lib/validation.js',
    'lib/context.js',
    'lib/context-create.js',
  ]);

  api.export(['SimpleSchema', 'MongoObject'], ['client', 'server']);
  api.export('humanize', {testonly:true});
});

Package.onTest(function(api) {

  if (api.versionsFrom) {
    api.use("aldeed:simple-schema");
    api.use('tinytest@1.0.0');
    api.use('test-helpers@1.0.0');
    api.use('underscore@1.0.0');
    api.use('check@1.0.0');
  } else {
    api.use(["simple-schema", "tinytest", "test-helpers", "underscore", "check"]);
  }

  api.addFiles([
    "tests/simple-schema.js",
    "tests/mongo-object.js",
    "tests/humanize.js",
    "tests/pick.js",
    "tests/omit.js"
  ], ['client', 'server']);
});
