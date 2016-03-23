Package.describe({
  name: "aldeed:simple-schema",
  summary: "A simple schema validation object with reactivity. Used by collection2 and autoform.",
  version: "1.5.1",
  git: "https://github.com/aldeed/meteor-simple-schema.git"
});

Npm.depends({
  'mongo-object': '0.0.1'
});

Package.onUse(function(api) {
  api.use([
    'tracker@1.0.0',
    'underscore@1.0.0',
    'check@1.0.0',
    'random@1.0.0',
    'ecmascript@0.1.0',
    'mdg:validation-error@0.5.1',
    'aldeed:message-box@0.0.1',
  ]);

  api.mainModule('lib/main.js');
});

Package.onTest(function(api) {
  api.use([
    'aldeed:simple-schema',
    'tinytest',
    'test-helpers',
    'underscore',
    'check',
    'ecmascript',
    'mongo',
  ]);

  api.addFiles([
    "tests/simple-schema.js",
    "tests/clean.js",
    "tests/humanize.js",
    "tests/pick.js",
    "tests/omit.js",
    "tests/autovalue.js",
    "tests/validation.js",
    "tests/validation-error.js",
    "tests/reg-exp.js",
    "tests/type-errors.js",
    "tests/shorthand.js",
  ]);
});
