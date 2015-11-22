Tinytest.add('SimpleSchema - messages - issue 363', function (test) {
  var Post = new SimpleSchema({
    title: {
      type: String
    },
    category: {
      type: String,
    },
    comments: {
      type: [Object],
      defaultValue: []
    },
    'comments.$.nick': {
      type: String
    },
    'comments.$.content': {
      type: String
    }
  });

  Post.messages({
    'required': 'Generic custom message',
    'required category': 'Specific custom message for category field'
  });

  var msg = Post.messageForError('required', 'title');
  test.equal(msg, 'Generic custom message');

  msg = Post.messageForError('required', 'category');
  test.equal(msg, 'Specific custom message for category field');

  msg = Post.messageForError('required', 'comments');
  test.equal(msg, 'Generic custom message');

  msg = Post.messageForError('required', 'comments.0.nick');
  test.equal(msg, 'Generic custom message');

  msg = Post.messageForError('required', 'comments.0.content');
  test.equal(msg, 'Generic custom message');
});

Tinytest.add('SimpleSchema - messages - extend regEx', function (test) {
  test.equal(SimpleSchema._globalMessages.regEx, [
    {msg: "[label] failed regular expression validation"},
    {exp: SimpleSchema.RegEx.Email, msg: "[label] must be a valid e-mail address"},
    {exp: SimpleSchema.RegEx.WeakEmail, msg: "[label] must be a valid e-mail address"},
    {exp: SimpleSchema.RegEx.Domain, msg: "[label] must be a valid domain"},
    {exp: SimpleSchema.RegEx.WeakDomain, msg: "[label] must be a valid domain"},
    {exp: SimpleSchema.RegEx.IP, msg: "[label] must be a valid IPv4 or IPv6 address"},
    {exp: SimpleSchema.RegEx.IPv4, msg: "[label] must be a valid IPv4 address"},
    {exp: SimpleSchema.RegEx.IPv6, msg: "[label] must be a valid IPv6 address"},
    {exp: SimpleSchema.RegEx.Url, msg: "[label] must be a valid URL"},
    {exp: SimpleSchema.RegEx.Id, msg: "[label] must be a valid alphanumeric ID"}
  ]);

  SimpleSchema.messages({
    'regEx': [
      {exp: /foo/g, msg: "custom"}
    ],
  }, {extendRegEx: true});

  test.equal(SimpleSchema._globalMessages.regEx, [
    {msg: "[label] failed regular expression validation"},
    {exp: SimpleSchema.RegEx.Email, msg: "[label] must be a valid e-mail address"},
    {exp: SimpleSchema.RegEx.WeakEmail, msg: "[label] must be a valid e-mail address"},
    {exp: SimpleSchema.RegEx.Domain, msg: "[label] must be a valid domain"},
    {exp: SimpleSchema.RegEx.WeakDomain, msg: "[label] must be a valid domain"},
    {exp: SimpleSchema.RegEx.IP, msg: "[label] must be a valid IPv4 or IPv6 address"},
    {exp: SimpleSchema.RegEx.IPv4, msg: "[label] must be a valid IPv4 address"},
    {exp: SimpleSchema.RegEx.IPv6, msg: "[label] must be a valid IPv6 address"},
    {exp: SimpleSchema.RegEx.Url, msg: "[label] must be a valid URL"},
    {exp: SimpleSchema.RegEx.Id, msg: "[label] must be a valid alphanumeric ID"},
    {exp: /foo/g, msg: "custom"}
  ]);

  SimpleSchema.messages({
    'regEx': [
      {exp: /foo/g, msg: "custom2"}
    ],
  }, {extendRegEx: true});

  test.equal(SimpleSchema._globalMessages.regEx, [
    {msg: "[label] failed regular expression validation"},
    {exp: SimpleSchema.RegEx.Email, msg: "[label] must be a valid e-mail address"},
    {exp: SimpleSchema.RegEx.WeakEmail, msg: "[label] must be a valid e-mail address"},
    {exp: SimpleSchema.RegEx.Domain, msg: "[label] must be a valid domain"},
    {exp: SimpleSchema.RegEx.WeakDomain, msg: "[label] must be a valid domain"},
    {exp: SimpleSchema.RegEx.IP, msg: "[label] must be a valid IPv4 or IPv6 address"},
    {exp: SimpleSchema.RegEx.IPv4, msg: "[label] must be a valid IPv4 address"},
    {exp: SimpleSchema.RegEx.IPv6, msg: "[label] must be a valid IPv6 address"},
    {exp: SimpleSchema.RegEx.Url, msg: "[label] must be a valid URL"},
    {exp: SimpleSchema.RegEx.Id, msg: "[label] must be a valid alphanumeric ID"},
    {exp: /foo/g, msg: "custom2"}
  ]);

  SimpleSchema.messages({
    'regEx': [
      {msg: "custom default"}
    ],
  }, {extendRegEx: true});

  test.equal(SimpleSchema._globalMessages.regEx, [
    {msg: "custom default"},
    {exp: SimpleSchema.RegEx.Email, msg: "[label] must be a valid e-mail address"},
    {exp: SimpleSchema.RegEx.WeakEmail, msg: "[label] must be a valid e-mail address"},
    {exp: SimpleSchema.RegEx.Domain, msg: "[label] must be a valid domain"},
    {exp: SimpleSchema.RegEx.WeakDomain, msg: "[label] must be a valid domain"},
    {exp: SimpleSchema.RegEx.IP, msg: "[label] must be a valid IPv4 or IPv6 address"},
    {exp: SimpleSchema.RegEx.IPv4, msg: "[label] must be a valid IPv4 address"},
    {exp: SimpleSchema.RegEx.IPv6, msg: "[label] must be a valid IPv6 address"},
    {exp: SimpleSchema.RegEx.Url, msg: "[label] must be a valid URL"},
    {exp: SimpleSchema.RegEx.Id, msg: "[label] must be a valid alphanumeric ID"},
    {exp: /foo/g, msg: "custom2"}
  ]);

  SimpleSchema.messages({
    'regEx': [
      {msg: "custom default 2"}
    ],
  });

  test.equal(SimpleSchema._globalMessages.regEx, [
    {msg: "custom default 2"}
  ]);

  SimpleSchema.messages({
    'regEx foo': [
      {msg: "custom field default"}
    ],
  });

  test.equal(SimpleSchema._globalMessages['regEx foo'], [
    {msg: "custom field default"}
  ]);

  SimpleSchema.messages({
    'regEx foo': [
      {exp: /foo/g, msg: "custom2"}
    ],
  }, {extendRegEx: true});

  test.equal(SimpleSchema._globalMessages['regEx foo'], [
    {msg: "custom field default"},
    {exp: /foo/g, msg: "custom2"}
  ]);
});
