/* eslint-env meteor */
Package.describe({
  name: 'aldeed:simple-schema',
  summary: 'A simple schema validation object with reactivity. Used by collection2 and autoform.',
  version: '3.0.0',
  git: 'https://github.com/Meteor-Community-Packages/meteor-simple-schema.git'
})

Npm.depends({
  clone: '2.1.2',
  'message-box': '0.2.7',
  'mongo-object': '0.1.4',
  'email-regex-safe': '4.0.0'
})

Package.onUse(function (api) {
  api.versionsFrom(['2.3', '2.8.1'])
  api.use('ecmascript')
  api.use('tracker')
  api.use('check')
  api.use('random')
  api.use('mdg:validation-error@0.3.0', { unordered: true })
  api.mainModule('simple-schema.js')
})

Package.onTest(function (api) {
  api.use('ecmascript')

  // Add code coverage
  api.use([
    'lmieulet:meteor-legacy-coverage',
    'lmieulet:meteor-coverage@4.1.0',
    'meteortesting:mocha@2.1.0'
  ])
  api.mainModule('simple-schema.tests.js')
})
