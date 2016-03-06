Package.describe({
  name: "aldeed:simple-schema",
  summary: "A simple schema validation object with reactivity. Used by collection2 and autoform.",
  version: "1.5.1",
  git: "https://github.com/aldeed/meteor-simple-schema.git"
});

Package.onUse(function(api) {
  api.use([
    'tracker@1.0.0',
    'underscore@1.0.0',
    'check@1.0.0',
    'random@1.0.0',
    'ecmascript@0.1.0',
    'mdg:validation-error@0.5.1',
  ]);

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
    'lib/validation-error.js',
  ]);

  api.export([
    'SimpleSchema',
    'MongoObject'
  ]);

  api.export('humanize', {
    testOnly: true
  });
});

Package.onTest(function(api) {

  api.use([
    'aldeed:simple-schema',
    'tinytest',
    'test-helpers',
    'underscore',
    'check',
    'ecmascript@0.1.0',
    'mongo',
  ]);

  api.addFiles([
    "tests/simple-schema.js",
    "tests/clean.js",
    "tests/mongo-object.js",
    "tests/humanize.js",
    "tests/pick.js",
    "tests/omit.js",
    "tests/messages.js",
    "tests/autovalue.js",
    "tests/validation.js",
    "tests/validation-error.js",
    "tests/reg-exp.js",
    "tests/type-errors.js",
    "tests/shorthand.js",
  ]);
});
