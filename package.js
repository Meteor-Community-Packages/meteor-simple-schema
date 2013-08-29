Package.describe({
  summary: "A simple schema validation object with reactivity. Used by collection2 and autoform."
});

Package.on_use(function(api) {
  api.use(['deps', 'underscore', 'check'], ['client', 'server']);
  api.add_files(['simple-schema-context.js', 'simple-schema.js'], ['client', 'server']);
  if (typeof api.export !== "undefined") {
    //backwards compatibility with pre-0.6.5 meteor
    api.export(['SimpleSchema', 'SchemaRegEx'], ['client', 'server']);
  }
});

Package.on_test(function(api) {
  api.use('simple-schema', ['client', 'server']);
  api.use('test-helpers', ['client', 'server']);
  api.use('tinytest', ['client', 'server']);
  api.add_files("simple-schema-tests.js", ['client', 'server']);
});