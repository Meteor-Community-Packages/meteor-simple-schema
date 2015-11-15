Tinytest.add("Humanize - Should humanize a string", function (test) {
  test.equal(humanize('super_snake_case'), 'Super snake case');
  test.equal(humanize('capitalizedCamelCase'), 'Capitalized camel case');
  test.equal(humanize('hyphen-case'), 'Hyphen case');
  test.equal(humanize('no-extensions-here.md'), 'No extensions here');
  test.equal(humanize('lower cased phrase'), 'Lower cased phrase');
  test.equal(humanize('  so many  spaces  '), 'So many spaces');
  test.equal(humanize(123), '123');
  test.equal(humanize(''), '');
  test.equal(humanize(null), '');
  test.equal(humanize(undefined), '');
  test.equal(humanize('externalSource'), 'External source');
  test.equal(humanize('externalSourceId'), 'External source id');
  test.equal(humanize('externalSource_id'), 'External source id');
});
