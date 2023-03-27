/* eslint-env meteor */
Package.describe({
  name: 'aldeed:simple-schema',
  summary: 'A simple schema validation object with reactivity. Used by collection2 and autoform.',
  version: '3.0.0',
  git: 'https://github.com/aldeed/meteor-simple-schema.git'
})

Package.onUse(function (api) {
  api.use('ecmascript')
})

Package.onTest(function (api) {
  // Running the tests requires a dummy project in order to
  // resolve npm dependencies and the test env dependencies.
  api.use(['meteortesting:browser-tests', 'meteortesting:mocha'])
  api.use(
    [
      'ecmascript',
      'tracker',
      'blaze',
      'templating',
      'aldeed:simple-schema'
    ])

  api.mainModule('tests/simple-schema.tests.js')
})
