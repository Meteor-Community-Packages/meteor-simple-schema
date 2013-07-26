Package.describe({
  summary: "A simple schema validation object with reactivity. Used by collection2."
});

Package.on_use(function(api) {
  api.use(['deps', 'underscore'], ['client', 'server']);
  api.add_files(['simple-schema.js'], ['client', 'server']);
});

Package.on_test(function(api) {
    api.use(["meteor-simple-schema", "tinytest", "test-helpers"]);
    api.add_files("simple-schema-tests.js", ['client', 'server']);
});