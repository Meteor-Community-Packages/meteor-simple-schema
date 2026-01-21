/* eslint-env meteor */
Package.describe({
    name: 'aldeed:simple-schema',
    summary: 'A simple schema validation object with reactivity. Used by collection2 and autoform.',
    version: '2.0.0',
    git: 'https://github.com/aldeed/meteor-simple-schema.git'
})

Npm.depends({
    'mongo-object': '3.0.1',
    'message-box': '0.2.7',
    'chai': '6.2.2',
    'chai-as-promised': '8.0.2',
    clone: '2.1.2'
})

Package.onUse(function (api) {
    api.versionsFrom(['3.0'])
    api.use('ecmascript')
    api.mainModule('lib/main.js')
})

Package.onTest(function (api) {
    api.versionsFrom(['3.0'])
    api.use([
        // 'lmieulet:meteor-legacy-coverage@0.1.0',
        // 'lmieulet:meteor-coverage@4.0.0',
        'meteortesting:mocha@3.3.0',
        'ecmascript',
        'tracker',
        // 'mongo',
        'aldeed:simple-schema@2.0.0'
    ])

    api.addFiles([
        //    'lib/clean/autoValue.tests.js', //TODO
        //  'lib/clean/convertToProperType.tests.js',//PASS
        //  'lib/clean/defaultValue.tests.js',//PASS
        //  'lib/clean/setAutoValues.tests.js',//PASS
        //  'lib/utility/getLastPartOfKey.tests.js',//PASS
        //  'lib/clean.tests.js', //PASS
        //  'lib/expandShorthand.tests.js', //PASS
        //  'lib/humanize.tests.js', //PASS
        //  'lib/SimpleSchema.tests.js', //PASS, CHECK TODO
        //  'lib/SimpleSchema_allowedValues.tests.js', //PASS
        //  'lib/SimpleSchema_autoValueFunctions.tests.js'//PASS
        //  'lib/SimpleSchema_blackbox.tests.js', //PASS
        //  'lib/SimpleSchema_custom.tests.js', //PASS TODO: make sure custom async validation works - add new test
        //  'lib/SimpleSchema_definition.tests.js', //PASS
        //  'lib/SimpleSchema_extend.tests.js', //PASS
        //  'lib/SimpleSchema_getObjectSchema.tests.js', //PASS
        //  'lib/SimpleSchema_getQuickTypeForKey.tests.js', //PASS
        //  'lib/SimpleSchema_labels.tests.js', //PASS
        //  'lib/SimpleSchema_max.tests.js', //PASS
        //  'lib/SimpleSchema_messages.tests.js', //PASS
        //  'lib/SimpleSchema_min.tests.js', //PASS
        //  'lib/SimpleSchema_minCount.tests.js', //PASS
        //  'lib/SimpleSchema_namedContext.tests.js', //PASS
        //  'lib/SimpleSchema_omit.tests.js', //PASS
        //  'lib/SimpleSchema_oneOf.tests.js', //PASS
        //  'lib/SimpleSchema_pick.tests.js', //PASS
        //  'lib/SimpleSchema_regEx.tests.js', //PASS
          'lib/SimpleSchema_required.tests.js',
        //  lib/SimpleSchema_rules.tests.js',
        //  'lib/SimpleSchema_type.tests.js',
        //  'lib/reactivity.tests.js'
    ])
})
