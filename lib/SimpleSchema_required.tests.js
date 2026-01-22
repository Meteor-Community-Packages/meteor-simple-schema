/* eslint-disable func-names, prefer-arrow-callback */

import { SimpleSchema } from './SimpleSchema'
import requiredSchema from './testHelpers/requiredSchema'
import testSchema from './testHelpers/testSchema'
import friendsSchema from './testHelpers/friendsSchema'
import expectValid from './testHelpers/expectValid'
import expectErrorLength from './testHelpers/expectErrorLength'
import expectRequiredErrorLength from './testHelpers/expectRequiredErrorLength'

describe('SimpleSchema - required', function () {
  describe('normal', function () {
    it('valid', async function () {
      await expectValid(requiredSchema, {
        requiredString: 'test',
        requiredBoolean: true,
        requiredNumber: 1,
        requiredDate: new Date(),
        requiredEmail: 'test123@sub.example.edu',
        requiredUrl: 'http://google.com',
        requiredObject: {
          requiredNumber: 1
        },
        optionalObject: {
          requiredString: 'test'
        }
      });

      await expectValid(requiredSchema, {
        requiredString: 'test',
        requiredBoolean: true,
        requiredNumber: 1,
        requiredDate: new Date(),
        requiredEmail: 'test123@sub.example.edu',
        requiredUrl: 'http://google.com',
        requiredObject: {
          requiredNumber: 1
        }
      })
    });

    it('invalid', async function () {
      (await expectRequiredErrorLength(requiredSchema, {})).to.equal(8);

      (await expectRequiredErrorLength(requiredSchema, {
        requiredString: null,
        requiredBoolean: null,
        requiredNumber: null,
        requiredDate: null,
        requiredEmail: null,
        requiredUrl: null,
        requiredObject: null,
        optionalObject: {
          requiredString: null
        }
      })).to.equal(9);

      (await expectRequiredErrorLength(requiredSchema, {
        requiredString: null,
        requiredBoolean: null,
        requiredNumber: null,
        requiredDate: null,
        requiredEmail: null,
        requiredUrl: null,
        requiredObject: null,
        optionalObject: {}
      })).to.equal(9);

      // we should not get an error about optionalObject.requiredString because the whole object is null
      (await expectRequiredErrorLength(requiredSchema, {
        requiredString: null,
        requiredBoolean: null,
        requiredNumber: null,
        requiredDate: null,
        requiredEmail: null,
        requiredUrl: null,
        requiredObject: null,
        optionalObject: null
      })).to.equal(8);

      // we should not get an error about optionalObject.requiredString because the whole object is missing
      (await expectRequiredErrorLength(requiredSchema, {
        requiredString: null,
        requiredBoolean: null,
        requiredNumber: null,
        requiredDate: null,
        requiredEmail: null,
        requiredUrl: null,
        requiredObject: null
      })).to.equal(8);

      (await expectRequiredErrorLength(requiredSchema, {
        requiredString: undefined,
        requiredBoolean: undefined,
        requiredNumber: undefined,
        requiredDate: undefined,
        requiredEmail: undefined,
        requiredUrl: undefined,
        requiredObject: undefined,
        optionalObject: {
          requiredString: undefined
        }
      })).to.equal(9);

      (await expectRequiredErrorLength(requiredSchema, {
        requiredString: '',
        requiredBoolean: null,
        requiredNumber: null,
        requiredDate: null,
        requiredEmail: null,
        requiredUrl: null,
        requiredObject: null,
        optionalObject: {
          requiredString: ''
        }
      })).to.equal(7);

      (await expectRequiredErrorLength(requiredSchema, {
        requiredString: '   ',
        requiredBoolean: null,
        requiredNumber: null,
        requiredDate: null,
        requiredEmail: null,
        requiredUrl: null,
        requiredObject: null,
        optionalObject: {
          requiredString: '   '
        }
      })).to.equal(7);

      // Array of objects
      (await expectRequiredErrorLength(friendsSchema, {
        friends: [{
          name: 'Bob'
        }],
        enemies: [{}]
      })).to.equal(2);
    })
  })

  describe('requiredByDefault', function () {
    it('requiredByDefault=false', async function () {
      const schema = new SimpleSchema({foo: String}, {requiredByDefault: false});
      (await expectRequiredErrorLength(schema, {})).to.equal(0);
    })

    it('requiredByDefault=false + required=true', async function () {
      const schema = new SimpleSchema({
        foo: {type: String, required: true}
      }, {requiredByDefault: false});
      (await expectRequiredErrorLength(schema, {})).to.equal(1);
    })

    it('requiredByDefault=false + required()=true', async function () {
      const schema = new SimpleSchema({
        foo: {type: String, required: () => true}
      }, {requiredByDefault: false});
      (await expectRequiredErrorLength(schema, {})).to.equal(1);
    })
  })

  describe('modifier with $set', function () {
    it('valid upsert', async function () {
      await expectValid(requiredSchema, {
        $set: {
          requiredString: 'test',
          requiredBoolean: true,
          requiredNumber: 1,
          requiredDate: (new Date()),
          requiredEmail: 'test123@sub.example.edu',
          requiredUrl: 'http://google.com',
          requiredObject: {
            requiredNumber: 1
          },
          optionalObject: {
            requiredString: 'test'
          }
        }
      }, {modifier: true, upsert: true});

      await expectValid(requiredSchema, {
        $set: {
          requiredString: 'test',
          requiredBoolean: true,
          requiredNumber: 1,
          requiredDate: (new Date()),
          requiredEmail: 'test123@sub.example.edu',
          requiredUrl: 'http://google.com',
          requiredObject: {
            requiredNumber: 1
          },
          'optionalObject.requiredString': 'test'
        }
      }, {modifier: true, upsert: true});

      const schema = new SimpleSchema({
        name: {type: String},
        embed: {type: Object},
        'embed._id': {type: String}
      });

      await expectValid(schema, {
        $set: {
          name: 'name'
        }
      }, {modifier: true});
    })

    it('invalid upsert', async function () {
      (await expectRequiredErrorLength(requiredSchema, {
        $set: {}
      }, {modifier: true, upsert: true})).to.equal(8);

      // should be no different with some missing
      (await expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': null
        }
      }, {modifier: true, upsert: true})).to.equal(9);

      (await expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: null,
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': null
        }
      }, {modifier: true, upsert: true})).to.equal(9);

      (await expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: undefined,
          requiredBoolean: undefined,
          requiredNumber: undefined,
          requiredDate: undefined,
          requiredEmail: undefined,
          requiredUrl: undefined,
          requiredObject: undefined,
          'optionalObject.requiredString': undefined
        }
      }, {modifier: true, upsert: true})).to.equal(9);

      (await expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: '',
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': ''
        }
      }, {modifier: true, upsert: true})).to.equal(7);

      (await expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: '   ',
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': '   '
        }
      }, {modifier: true, upsert: true})).to.equal(7);
    })

    it('valid update', async function () {
      // Would not cause DB changes, so should not be an error
      await expectValid(requiredSchema, {
        $set: {}
      }, {modifier: true});

      await expectValid(requiredSchema, {
        $set: {
          requiredString: 'test',
          requiredBoolean: true,
          requiredNumber: 1,
          requiredDate: (new Date()),
          requiredEmail: 'test123@sub.example.edu',
          requiredUrl: 'http://google.com',
          'requiredObject.requiredNumber': 1,
          'optionalObject.requiredString': 'test'
        }
      }, {modifier: true});

      await expectValid(requiredSchema, {
        $set: {
          requiredString: 'test',
          requiredBoolean: true,
          requiredNumber: 1,
          requiredDate: (new Date()),
          requiredEmail: 'test123@sub.example.edu',
          requiredUrl: 'http://google.com',
          requiredObject: {
            requiredNumber: 1
          },
          'optionalObject.requiredString': 'test'
        }
      }, {modifier: true});

      // Array of objects
      await expectValid(friendsSchema, {
        $set: {
          enemies: [{
            name: 'Zach'
          }]
        }
      }, {modifier: true});

      await expectValid(friendsSchema, {
        $set: {
          'friends.1.name': 'Bob'
        }
      }, {modifier: true});

      await expectValid(friendsSchema, {
        $set: {
          friends: [{
            name: 'Bob',
            type: 'good'
          }]
        }
      }, {modifier: true});

      await expectValid(friendsSchema, {
        $set: {
          enemies: [{
            name: 'Zach',
            traits: []
          }]
        }
      }, {modifier: true});
    })

    it('invalid update', async function () {
      // MongoDB will set the props to `undefined`
      (await expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: undefined,
          requiredBoolean: undefined,
          requiredNumber: undefined,
          requiredDate: undefined,
          requiredEmail: undefined,
          requiredUrl: undefined,
          requiredObject: undefined,
          'optionalObject.requiredString': undefined
        }
      }, {modifier: true})).to.equal(9);

      (await expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: null,
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': null
        }
      }, {modifier: true})).to.equal(9);

      (await expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: '',
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': ''
        }
      }, {modifier: true})).to.equal(7);

      (await expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: '   ',
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': '   '
        }
      }, {modifier: true})).to.equal(7);

      // Array of objects
      (await expectRequiredErrorLength(friendsSchema, {
        $set: {
          enemies: [{}]
        }
      }, {modifier: true})).to.equal(1);

      // name is required
      (await expectRequiredErrorLength(friendsSchema, {
        $set: {
          'friends.1.name': null
        }
      }, {modifier: true})).to.equal(1);

      // type is required
      (await expectRequiredErrorLength(friendsSchema, {
        $set: {
          friends: [{
            name: 'Bob'
          }]
        }
      }, {modifier: true})).to.equal(1);

      (await expectRequiredErrorLength(friendsSchema, {
        $set: {
          enemies: [{
            name: 'Zach',
            traits: [{}]
          }]
        }
      }, {modifier: true})).to.equal(2);

      (await expectRequiredErrorLength(friendsSchema, {
        $set: {
          enemies: [{
            name: 'Zach',
            traits: [{}, {}]
          }]
        }
      }, {modifier: true})).to.equal(4);

      (await expectRequiredErrorLength(friendsSchema, {
        $set: {
          enemies: [{
            name: 'Zach',
            traits: [{
              name: 'evil'
            }]
          }]
        }
      }, {modifier: true})).to.equal(1);
    })
  })

  describe('modifier with $setOnInsert', function () {
    it('valid upsert', async function () {
      await expectValid(requiredSchema, {
        $setOnInsert: {
          requiredString: 'test',
          requiredBoolean: true,
          requiredNumber: 1,
          requiredDate: (new Date()),
          requiredEmail: 'test123@sub.example.edu',
          requiredUrl: 'http://google.com',
          requiredObject: {
            requiredNumber: 1
          },
          optionalObject: {
            requiredString: 'test'
          }
        }
      }, {modifier: true, upsert: true});

      await expectValid(requiredSchema, {
        $setOnInsert: {
          requiredString: 'test',
          requiredBoolean: true,
          requiredNumber: 1,
          requiredDate: (new Date()),
          requiredEmail: 'test123@sub.example.edu',
          requiredUrl: 'http://google.com',
          requiredObject: {
            requiredNumber: 1
          },
          'optionalObject.requiredString': 'test'
        }
      }, {modifier: true, upsert: true});
    })

    it('invalid upsert', async function () {
      (await expectRequiredErrorLength(requiredSchema, {
        $setOnInsert: {}
      }, {modifier: true, upsert: true})).to.equal(8);

      (await expectRequiredErrorLength(requiredSchema, {
        $setOnInsert: {
          requiredString: null,
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': null
        }
      }, {modifier: true, upsert: true})).to.equal(9);

      (await expectRequiredErrorLength(requiredSchema, {
        $setOnInsert: {
          requiredString: undefined,
          requiredBoolean: undefined,
          requiredNumber: undefined,
          requiredDate: undefined,
          requiredEmail: undefined,
          requiredUrl: undefined,
          requiredObject: undefined,
          'optionalObject.requiredString': undefined
        }
      }, {modifier: true, upsert: true})).to.equal(9);

      (await expectRequiredErrorLength(requiredSchema, {
        $setOnInsert: {
          requiredString: '',
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': ''
        }
      }, {modifier: true, upsert: true})).to.equal(7);

      (await expectRequiredErrorLength(requiredSchema, {
        $setOnInsert: {
          requiredString: '   ',
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': '   '
        }
      }, {modifier: true, upsert: true})).to.equal(7);

      // Array of objects
      (await expectRequiredErrorLength(friendsSchema, {
        $setOnInsert: {
          friends: [{
            name: 'Bob'
          }],
          enemies: []
        }
      }, {modifier: true, upsert: true})).to.equal(1);
    })
  })

  describe('modifier with $set and $setOnInsert', function () {
    it('valid upsert', async function () {
      // Some in $set and some in $setOnInsert.
      // Make sure they're merged for validation purposes.
      await expectValid(requiredSchema, {
        $set: {
          requiredString: 'test',
          requiredBoolean: true,
          requiredNumber: 1,
          requiredDate: (new Date())
        },
        $setOnInsert: {
          requiredEmail: 'test123@sub.example.edu',
          requiredUrl: 'http://google.com',
          requiredObject: {
            requiredNumber: 1
          },
          'optionalObject.requiredString': 'test'
        }
      }, {modifier: true, upsert: true})

      await expectValid(requiredSchema, {
        $set: {
          requiredString: 'test',
          requiredBoolean: true,
          requiredNumber: 1,
          requiredDate: (new Date())
        },
        $setOnInsert: {
          requiredEmail: 'test123@sub.example.edu',
          requiredUrl: 'http://google.com',
          requiredObject: {
            requiredNumber: 1
          },
          'optionalObject.requiredString': 'test'
        }
      }, {modifier: true, upsert: true})
    })

    it('invalid upsert', async function () {
      (await expectRequiredErrorLength(requiredSchema, {
        $setOnInsert: {},
        $set: {}
      }, {modifier: true, upsert: true})).to.equal(8);

      (await expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: null,
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null
        },
        $setOnInsert: {
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': null
        }
      }, {modifier: true, upsert: true})).to.equal(9);

      (await expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: undefined,
          requiredBoolean: undefined,
          requiredNumber: undefined,
          requiredDate: undefined
        },
        $setOnInsert: {
          requiredEmail: undefined,
          requiredUrl: undefined,
          requiredObject: undefined,
          'optionalObject.requiredString': undefined
        }
      }, {modifier: true, upsert: true})).to.equal(8);

      (await expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: '',
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null
        },
        $setOnInsert: {
          requiredEmail: '',
          requiredUrl: '',
          requiredObject: null,
          'optionalObject.requiredString': ''
        }
      }, {modifier: true, upsert: true})).to.equal(5);

      (await expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: '   ',
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null
        },
        $setOnInsert: {
          requiredEmail: '   ',
          requiredUrl: '   ',
          requiredObject: null,
          'optionalObject.requiredString': '   '
        }
      }, {modifier: true, upsert: true})).to.equal(5);
    })
  })

  describe('modifier with $unset', function () {
    it('valid', async function () {
      // Would not cause DB changes, so should not be an error
      await expectValid(requiredSchema, {
        $unset: {}
      }, {modifier: true});

      // Make sure an optional can be unset when others are required
      // Retest with various values to be sure the value is ignored
      await expectValid(requiredSchema, {
        $unset: {
          anOptionalOne: 1
        }
      }, {modifier: true});

      await expectValid(requiredSchema, {
        $unset: {
          anOptionalOne: null
        }
      }, {modifier: true});

      await expectValid(requiredSchema, {
        $unset: {
          anOptionalOne: ''
        }
      }, {modifier: true});

      await expectValid(requiredSchema, {
        $unset: {
          optionalObject: ''
        }
      }, {modifier: true});

      // Array of objects
      await expectValid(friendsSchema, {
        $unset: {
          'friends.1.a.b': ''
        }
      }, {modifier: true});

      await expectValid(friendsSchema, {
        $unset: {
          'friends.1.a.b': 1,
          'friends.2.a.b': 1,
          'friends.3.a.b': 1
        }
      }, {modifier: true});
    })

    it('invalid', async function () {
      (await expectRequiredErrorLength(requiredSchema, {
        $unset: {
          requiredString: 1,
          requiredBoolean: 1,
          requiredNumber: 1,
          requiredDate: 1,
          requiredEmail: 1,
          requiredUrl: 1
        }
      }, {modifier: true})).to.equal(6);

      (await expectRequiredErrorLength(requiredSchema, {
        $unset: {
          'optionalObject.requiredString': 1
        }
      }, {modifier: true})).to.equal(1);

      (await expectRequiredErrorLength(requiredSchema, {
        $unset: {
          'requiredObject.requiredNumber': 1
        }
      }, {modifier: true})).to.equal(1);

      // Array of objects
      (await expectRequiredErrorLength(friendsSchema, {
        $unset: {
          'friends.1.name': 1
        }
      }, {modifier: true})).to.equal(1);

      (await expectRequiredErrorLength(friendsSchema, {
        $unset: {
          'friends.1.name': 1,
          'friends.2.name': 1,
          'friends.3.name': 1
        }
      }, {modifier: true})).to.equal(3);
    })
  })

  describe('modifier with $rename', function () {
    it('rename from optional key to another key in schema', async function () {
      await expectValid(testSchema, {
        $rename: {
          string: 'minMaxString'
        }
      }, {modifier: true})
    })

    it('rename from optional key to a key not in schema', async function () {
      (await expectErrorLength(testSchema, {
        $rename: {
          string: 'newString'
        }
      }, {modifier: true})).to.equal(1);
    })

    it('rename from required key', async function () {
      (await expectRequiredErrorLength(requiredSchema, {
        $rename: {
          requiredString: 'requiredUrl'
        }
      }, {modifier: true})).to.equal(1);
    })
  })

  describe('modifier with $push', function () {
    it('valid', async function () {
      (await expectRequiredErrorLength(friendsSchema, {
        $push: {
          friends: {
            name: 'Bob',
            type: 'best'
          }
        }
      }, {modifier: true})).to.equal(0);
    })

    it('invalid', async function () {
      (await expectRequiredErrorLength(friendsSchema, {
        $push: {
          friends: {
            name: 'Bob'
          }
        }
      }, {modifier: true})).to.equal(1);
    })
  })

  describe('modifier with $addToSet', function () {
    it('valid', async function () {
      (await expectRequiredErrorLength(friendsSchema, {
        $addToSet: {
          friends: {
            name: 'Bob',
            type: 'best'
          }
        }
      }, {modifier: true})).to.equal(0);
    })

    it('invalid', async function () {
      (await expectRequiredErrorLength(friendsSchema, {
        $addToSet: {
          friends: {
            name: 'Bob'
          }
        }
      }, {modifier: true})).to.equal(1);
    })
  })
})
