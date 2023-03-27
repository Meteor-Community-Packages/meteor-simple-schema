import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions'

checkNpmVersions({
  'simpl-schema': '3.x.x'
}, 'aldeed:simple-schema')

const SimpleSchema = require('simpl-schema')

module.exports = SimpleSchema
