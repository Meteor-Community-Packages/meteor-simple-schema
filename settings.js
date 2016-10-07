/* global SimpleSchema*/

var simpleSchemaSettings = Meteor.settings.public ? Meteor.settings.public.simpleSchema : null;

if (simpleSchemaSettings) {
    if (simpleSchemaSettings.debug) {
        SimpleSchema.debug = true;
    }
}
