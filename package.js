Package.describe({
  name: "aldeed:simple-schema",
  summary: "A simple schema validation package with reactivity. Used by collection2 and autoform.",
  version: "2.0.0-rc.1",
  git: "https://github.com/aldeed/meteor-simple-schema.git"
});

Npm.depends({
  'simpl-schema': '0.0.1'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3');

  api.use([
    'ecmascript',
    'tracker',
    'mdg:validation-error@0.5.1',
  ]);

  api.mainModule('main.js');
});

// Package.onTest(function(api) {
//   api.use([
//     'aldeed:simple-schema',
//     'ecmascript',
//   ]);

//   api.addFiles([

//   ]);
// });
