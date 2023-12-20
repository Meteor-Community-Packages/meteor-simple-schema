/* eslint-env meteor */
Package.describe({
  name: 'aldeed:simple-schema',
  summary: 'A simple schema validation object with reactivity. Used by collection2 and autoform.',
  version: '2.0.0',
  git: 'https://github.com/aldeed/meteor-simple-schema.git'
});

Npm.depends({
  'mongo-object': '3.0.1',
  'message-box': '0.2.7',
  'clone': '2.1.2'
})

Package.onUse(function (api) {
  api.versionsFrom(['1.3', '2.3', '3.0-alpha.19'])
  api.use('ecmascript')
  api.mainModule('lib/main.js')
});

Package.onTest(function (api) {
  api.use([
    'ecmascript',
    'tracker',
    'meteortesting:browser-tests@1.5.3',
    'meteortesting:mocha@2.1.0',
    'mongo',
    'aldeed:simple-schema'
  ])
  api.mainModule('lib/main.tests.js')
})
