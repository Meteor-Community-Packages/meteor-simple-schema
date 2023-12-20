/* eslint-disable func-names, prefer-arrow-callback */

import { SimpleSchema } from './SimpleSchema';
import requiredSchema from './testHelpers/requiredSchema';
import testSchema from './testHelpers/testSchema';
import friendsSchema from './testHelpers/friendsSchema';
import expectValid from './testHelpers/expectValid';
import expectErrorLength from './testHelpers/expectErrorLength';
import expectRequiredErrorLength from './testHelpers/expectRequiredErrorLength';

describe('SimpleSchema - required', function () {
  describe('normal', function () {
    it('valid', function () {
      expectValid(requiredSchema, {
        requiredString: 'test',
        requiredBoolean: true,
        requiredNumber: 1,
        requiredDate: new Date(),
        requiredEmail: 'test123@sub.example.edu',
        requiredUrl: 'http://google.com',
        requiredObject: {
          requiredNumber: 1,
        },
        optionalObject: {
          requiredString: 'test',
        },
      });

      expectValid(requiredSchema, {
        requiredString: 'test',
        requiredBoolean: true,
        requiredNumber: 1,
        requiredDate: new Date(),
        requiredEmail: 'test123@sub.example.edu',
        requiredUrl: 'http://google.com',
        requiredObject: {
          requiredNumber: 1,
        },
      });
    });

    it('invalid', function () {
      expectRequiredErrorLength(requiredSchema, {}).to.equal(8);

      expectRequiredErrorLength(requiredSchema, {
        requiredString: null,
        requiredBoolean: null,
        requiredNumber: null,
        requiredDate: null,
        requiredEmail: null,
        requiredUrl: null,
        requiredObject: null,
        optionalObject: {
          requiredString: null,
        },
      }).to.equal(9);

      expectRequiredErrorLength(requiredSchema, {
        requiredString: null,
        requiredBoolean: null,
        requiredNumber: null,
        requiredDate: null,
        requiredEmail: null,
        requiredUrl: null,
        requiredObject: null,
        optionalObject: {},
      }).to.equal(9);

      // we should not get an error about optionalObject.requiredString because the whole object is null
      expectRequiredErrorLength(requiredSchema, {
        requiredString: null,
        requiredBoolean: null,
        requiredNumber: null,
        requiredDate: null,
        requiredEmail: null,
        requiredUrl: null,
        requiredObject: null,
        optionalObject: null,
      }).to.equal(8);

      // we should not get an error about optionalObject.requiredString because the whole object is missing
      expectRequiredErrorLength(requiredSchema, {
        requiredString: null,
        requiredBoolean: null,
        requiredNumber: null,
        requiredDate: null,
        requiredEmail: null,
        requiredUrl: null,
        requiredObject: null,
      }).to.equal(8);

      expectRequiredErrorLength(requiredSchema, {
        requiredString: undefined,
        requiredBoolean: undefined,
        requiredNumber: undefined,
        requiredDate: undefined,
        requiredEmail: undefined,
        requiredUrl: undefined,
        requiredObject: undefined,
        optionalObject: {
          requiredString: undefined,
        },
      }).to.equal(9);

      expectRequiredErrorLength(requiredSchema, {
        requiredString: '',
        requiredBoolean: null,
        requiredNumber: null,
        requiredDate: null,
        requiredEmail: null,
        requiredUrl: null,
        requiredObject: null,
        optionalObject: {
          requiredString: '',
        },
      }).to.equal(7);

      expectRequiredErrorLength(requiredSchema, {
        requiredString: '   ',
        requiredBoolean: null,
        requiredNumber: null,
        requiredDate: null,
        requiredEmail: null,
        requiredUrl: null,
        requiredObject: null,
        optionalObject: {
          requiredString: '   ',
        },
      }).to.equal(7);

      // Array of objects
      expectRequiredErrorLength(friendsSchema, {
        friends: [{
          name: 'Bob',
        }],
        enemies: [{}],
      }).to.equal(2);
    });
  });

  describe('requiredByDefault', function () {
    it('requiredByDefault=false', function () {
      const schema = new SimpleSchema({ foo: String }, { requiredByDefault: false });
      expectRequiredErrorLength(schema, {}).to.equal(0);
    });

    it('requiredByDefault=false + required=true', function () {
      const schema = new SimpleSchema({
        foo: { type: String, required: true },
      }, { requiredByDefault: false });
      expectRequiredErrorLength(schema, {}).to.equal(1);
    });

    it('requiredByDefault=false + required()=true', function () {
      const schema = new SimpleSchema({
        foo: { type: String, required: () => true },
      }, { requiredByDefault: false });
      expectRequiredErrorLength(schema, {}).to.equal(1);
    });
  });

  describe('modifier with $set', function () {
    it('valid upsert', function () {
      expectValid(requiredSchema, {
        $set: {
          requiredString: 'test',
          requiredBoolean: true,
          requiredNumber: 1,
          requiredDate: (new Date()),
          requiredEmail: 'test123@sub.example.edu',
          requiredUrl: 'http://google.com',
          requiredObject: {
            requiredNumber: 1,
          },
          optionalObject: {
            requiredString: 'test',
          },
        },
      }, { modifier: true, upsert: true });

      expectValid(requiredSchema, {
        $set: {
          requiredString: 'test',
          requiredBoolean: true,
          requiredNumber: 1,
          requiredDate: (new Date()),
          requiredEmail: 'test123@sub.example.edu',
          requiredUrl: 'http://google.com',
          requiredObject: {
            requiredNumber: 1,
          },
          'optionalObject.requiredString': 'test',
        },
      }, { modifier: true, upsert: true });

      const schema = new SimpleSchema({
        name: { type: String },
        embed: { type: Object },
        'embed._id': { type: String },
      });

      expectValid(schema, {
        $set: {
          name: 'name',
        },
      }, { modifier: true });
    });

    it('invalid upsert', function () {
      expectRequiredErrorLength(requiredSchema, {
        $set: {},
      }, { modifier: true, upsert: true }).to.equal(8);

      // should be no different with some missing
      expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': null,
        },
      }, { modifier: true, upsert: true }).to.equal(9);

      expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: null,
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': null,
        },
      }, { modifier: true, upsert: true }).to.equal(9);

      expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: undefined,
          requiredBoolean: undefined,
          requiredNumber: undefined,
          requiredDate: undefined,
          requiredEmail: undefined,
          requiredUrl: undefined,
          requiredObject: undefined,
          'optionalObject.requiredString': undefined,
        },
      }, { modifier: true, upsert: true }).to.equal(9);

      expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: '',
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': '',
        },
      }, { modifier: true, upsert: true }).to.equal(7);

      expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: '   ',
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': '   ',
        },
      }, { modifier: true, upsert: true }).to.equal(7);
    });

    it('valid update', function () {
      // Would not cause DB changes, so should not be an error
      expectValid(requiredSchema, {
        $set: {},
      }, { modifier: true });

      expectValid(requiredSchema, {
        $set: {
          requiredString: 'test',
          requiredBoolean: true,
          requiredNumber: 1,
          requiredDate: (new Date()),
          requiredEmail: 'test123@sub.example.edu',
          requiredUrl: 'http://google.com',
          'requiredObject.requiredNumber': 1,
          'optionalObject.requiredString': 'test',
        },
      }, { modifier: true });

      expectValid(requiredSchema, {
        $set: {
          requiredString: 'test',
          requiredBoolean: true,
          requiredNumber: 1,
          requiredDate: (new Date()),
          requiredEmail: 'test123@sub.example.edu',
          requiredUrl: 'http://google.com',
          requiredObject: {
            requiredNumber: 1,
          },
          'optionalObject.requiredString': 'test',
        },
      }, { modifier: true });

      // Array of objects
      expectValid(friendsSchema, {
        $set: {
          enemies: [{
            name: 'Zach',
          }],
        },
      }, { modifier: true });

      expectValid(friendsSchema, {
        $set: {
          'friends.1.name': 'Bob',
        },
      }, { modifier: true });

      expectValid(friendsSchema, {
        $set: {
          friends: [{
            name: 'Bob',
            type: 'good',
          }],
        },
      }, { modifier: true });

      expectValid(friendsSchema, {
        $set: {
          enemies: [{
            name: 'Zach',
            traits: [],
          }],
        },
      }, { modifier: true });
    });

    it('invalid update', function () {
      // MongoDB will set the props to `undefined`
      expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: undefined,
          requiredBoolean: undefined,
          requiredNumber: undefined,
          requiredDate: undefined,
          requiredEmail: undefined,
          requiredUrl: undefined,
          requiredObject: undefined,
          'optionalObject.requiredString': undefined,
        },
      }, { modifier: true }).to.equal(9);

      expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: null,
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': null,
        },
      }, { modifier: true }).to.equal(9);

      expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: '',
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': '',
        },
      }, { modifier: true }).to.equal(7);

      expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: '   ',
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': '   ',
        },
      }, { modifier: true }).to.equal(7);

      // Array of objects
      expectRequiredErrorLength(friendsSchema, {
        $set: {
          enemies: [{}],
        },
      }, { modifier: true }).to.equal(1);

      // name is required
      expectRequiredErrorLength(friendsSchema, {
        $set: {
          'friends.1.name': null,
        },
      }, { modifier: true }).to.equal(1);

      // type is required
      expectRequiredErrorLength(friendsSchema, {
        $set: {
          friends: [{
            name: 'Bob',
          }],
        },
      }, { modifier: true }).to.equal(1);

      expectRequiredErrorLength(friendsSchema, {
        $set: {
          enemies: [{
            name: 'Zach',
            traits: [{}],
          }],
        },
      }, { modifier: true }).to.equal(2);

      expectRequiredErrorLength(friendsSchema, {
        $set: {
          enemies: [{
            name: 'Zach',
            traits: [{}, {}],
          }],
        },
      }, { modifier: true }).to.equal(4);

      expectRequiredErrorLength(friendsSchema, {
        $set: {
          enemies: [{
            name: 'Zach',
            traits: [{
              name: 'evil',
            }],
          }],
        },
      }, { modifier: true }).to.equal(1);
    });
  });

  describe('modifier with $setOnInsert', function () {
    it('valid upsert', function () {
      expectValid(requiredSchema, {
        $setOnInsert: {
          requiredString: 'test',
          requiredBoolean: true,
          requiredNumber: 1,
          requiredDate: (new Date()),
          requiredEmail: 'test123@sub.example.edu',
          requiredUrl: 'http://google.com',
          requiredObject: {
            requiredNumber: 1,
          },
          optionalObject: {
            requiredString: 'test',
          },
        },
      }, { modifier: true, upsert: true });

      expectValid(requiredSchema, {
        $setOnInsert: {
          requiredString: 'test',
          requiredBoolean: true,
          requiredNumber: 1,
          requiredDate: (new Date()),
          requiredEmail: 'test123@sub.example.edu',
          requiredUrl: 'http://google.com',
          requiredObject: {
            requiredNumber: 1,
          },
          'optionalObject.requiredString': 'test',
        },
      }, { modifier: true, upsert: true });
    });

    it('invalid upsert', function () {
      expectRequiredErrorLength(requiredSchema, {
        $setOnInsert: {},
      }, { modifier: true, upsert: true }).to.equal(8);

      expectRequiredErrorLength(requiredSchema, {
        $setOnInsert: {
          requiredString: null,
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': null,
        },
      }, { modifier: true, upsert: true }).to.equal(9);

      expectRequiredErrorLength(requiredSchema, {
        $setOnInsert: {
          requiredString: undefined,
          requiredBoolean: undefined,
          requiredNumber: undefined,
          requiredDate: undefined,
          requiredEmail: undefined,
          requiredUrl: undefined,
          requiredObject: undefined,
          'optionalObject.requiredString': undefined,
        },
      }, { modifier: true, upsert: true }).to.equal(9);

      expectRequiredErrorLength(requiredSchema, {
        $setOnInsert: {
          requiredString: '',
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': '',
        },
      }, { modifier: true, upsert: true }).to.equal(7);

      expectRequiredErrorLength(requiredSchema, {
        $setOnInsert: {
          requiredString: '   ',
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': '   ',
        },
      }, { modifier: true, upsert: true }).to.equal(7);

      // Array of objects
      expectRequiredErrorLength(friendsSchema, {
        $setOnInsert: {
          friends: [{
            name: 'Bob',
          }],
          enemies: [],
        },
      }, { modifier: true, upsert: true }).to.equal(1);
    });
  });

  describe('modifier with $set and $setOnInsert', function () {
    it('valid upsert', function () {
      // Some in $set and some in $setOnInsert.
      // Make sure they're merged for validation purposes.
      expectValid(requiredSchema, {
        $set: {
          requiredString: 'test',
          requiredBoolean: true,
          requiredNumber: 1,
          requiredDate: (new Date()),
        },
        $setOnInsert: {
          requiredEmail: 'test123@sub.example.edu',
          requiredUrl: 'http://google.com',
          requiredObject: {
            requiredNumber: 1,
          },
          'optionalObject.requiredString': 'test',
        },
      }, { modifier: true, upsert: true });

      expectValid(requiredSchema, {
        $set: {
          requiredString: 'test',
          requiredBoolean: true,
          requiredNumber: 1,
          requiredDate: (new Date()),
        },
        $setOnInsert: {
          requiredEmail: 'test123@sub.example.edu',
          requiredUrl: 'http://google.com',
          requiredObject: {
            requiredNumber: 1,
          },
          'optionalObject.requiredString': 'test',
        },
      }, { modifier: true, upsert: true });
    });

    it('invalid upsert', function () {
      expectRequiredErrorLength(requiredSchema, {
        $setOnInsert: {},
        $set: {},
      }, { modifier: true, upsert: true }).to.equal(8);

      expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: null,
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
        },
        $setOnInsert: {
          requiredEmail: null,
          requiredUrl: null,
          requiredObject: null,
          'optionalObject.requiredString': null,
        },
      }, { modifier: true, upsert: true }).to.equal(9);

      expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: undefined,
          requiredBoolean: undefined,
          requiredNumber: undefined,
          requiredDate: undefined,
        },
        $setOnInsert: {
          requiredEmail: undefined,
          requiredUrl: undefined,
          requiredObject: undefined,
          'optionalObject.requiredString': undefined,
        },
      }, { modifier: true, upsert: true }).to.equal(8);

      expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: '',
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
        },
        $setOnInsert: {
          requiredEmail: '',
          requiredUrl: '',
          requiredObject: null,
          'optionalObject.requiredString': '',
        },
      }, { modifier: true, upsert: true }).to.equal(5);

      expectRequiredErrorLength(requiredSchema, {
        $set: {
          requiredString: '   ',
          requiredBoolean: null,
          requiredNumber: null,
          requiredDate: null,
        },
        $setOnInsert: {
          requiredEmail: '   ',
          requiredUrl: '   ',
          requiredObject: null,
          'optionalObject.requiredString': '   ',
        },
      }, { modifier: true, upsert: true }).to.equal(5);
    });
  });

  describe('modifier with $unset', function () {
    it('valid', function () {
      // Would not cause DB changes, so should not be an error
      expectValid(requiredSchema, {
        $unset: {},
      }, { modifier: true });

      // Make sure an optional can be unset when others are required
      // Retest with various values to be sure the value is ignored
      expectValid(requiredSchema, {
        $unset: {
          anOptionalOne: 1,
        },
      }, { modifier: true });

      expectValid(requiredSchema, {
        $unset: {
          anOptionalOne: null,
        },
      }, { modifier: true });

      expectValid(requiredSchema, {
        $unset: {
          anOptionalOne: '',
        },
      }, { modifier: true });

      expectValid(requiredSchema, {
        $unset: {
          optionalObject: '',
        },
      }, { modifier: true });

      // Array of objects
      expectValid(friendsSchema, {
        $unset: {
          'friends.1.a.b': '',
        },
      }, { modifier: true });

      expectValid(friendsSchema, {
        $unset: {
          'friends.1.a.b': 1,
          'friends.2.a.b': 1,
          'friends.3.a.b': 1,
        },
      }, { modifier: true });
    });

    it('invalid', function () {
      expectRequiredErrorLength(requiredSchema, {
        $unset: {
          requiredString: 1,
          requiredBoolean: 1,
          requiredNumber: 1,
          requiredDate: 1,
          requiredEmail: 1,
          requiredUrl: 1,
        },
      }, { modifier: true }).to.equal(6);

      expectRequiredErrorLength(requiredSchema, {
        $unset: {
          'optionalObject.requiredString': 1,
        },
      }, { modifier: true }).to.equal(1);

      expectRequiredErrorLength(requiredSchema, {
        $unset: {
          'requiredObject.requiredNumber': 1,
        },
      }, { modifier: true }).to.equal(1);

      // Array of objects
      expectRequiredErrorLength(friendsSchema, {
        $unset: {
          'friends.1.name': 1,
        },
      }, { modifier: true }).to.equal(1);

      expectRequiredErrorLength(friendsSchema, {
        $unset: {
          'friends.1.name': 1,
          'friends.2.name': 1,
          'friends.3.name': 1,
        },
      }, { modifier: true }).to.equal(3);
    });
  });

  describe('modifier with $rename', function () {
    it('rename from optional key to another key in schema', function () {
      expectValid(testSchema, {
        $rename: {
          string: 'minMaxString',
        },
      }, { modifier: true });
    });

    it('rename from optional key to a key not in schema', function () {
      expectErrorLength(testSchema, {
        $rename: {
          string: 'newString',
        },
      }, { modifier: true }).to.equal(1);
    });

    it('rename from required key', function () {
      expectRequiredErrorLength(requiredSchema, {
        $rename: {
          requiredString: 'requiredUrl',
        },
      }, { modifier: true }).to.equal(1);
    });
  });

  describe('modifier with $push', function () {
    it('valid', function () {
      expectRequiredErrorLength(friendsSchema, {
        $push: {
          friends: {
            name: 'Bob',
            type: 'best',
          },
        },
      }, { modifier: true }).to.equal(0);
    });

    it('invalid', function () {
      expectRequiredErrorLength(friendsSchema, {
        $push: {
          friends: {
            name: 'Bob',
          },
        },
      }, { modifier: true }).to.equal(1);
    });
  });

  describe('modifier with $addToSet', function () {
    it('valid', function () {
      expectRequiredErrorLength(friendsSchema, {
        $addToSet: {
          friends: {
            name: 'Bob',
            type: 'best',
          },
        },
      }, { modifier: true }).to.equal(0);
    });

    it('invalid', function () {
      expectRequiredErrorLength(friendsSchema, {
        $addToSet: {
          friends: {
            name: 'Bob',
          },
        },
      }, { modifier: true }).to.equal(1);
    });
  });
});
