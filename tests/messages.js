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
