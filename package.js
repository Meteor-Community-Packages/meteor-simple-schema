Package.describe({
  summary: "A simple schema validation object. Used by collection2."
});

Package.on_use(function(api) {
  api.use('underscore', ['client', 'server']);
  api.add_files(['simple-schema.js'], ['client', 'server']);
});