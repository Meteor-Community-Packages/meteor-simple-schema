/* eslint-disable func-names, prefer-arrow-callback */

import testSchema from './testHelpers/testSchema';
import expectErrorLength from './testHelpers/expectErrorLength';

describe('SimpleSchema - min', function () {
  describe('normal', function () {
    it('string', function () {
      expectErrorLength(testSchema, {
        minMaxString: 'longenough',
      }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        minMaxString: 'short',
      }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        minMaxString: '',
      }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        minMaxStringArray: ['longenough', 'longenough'],
      }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        minMaxStringArray: ['longenough', 'short'],
      }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        minMaxStringArray: ['short', 'short'],
      }).to.deep.equal(2);
    });

    it('number', function () {
      expectErrorLength(testSchema, {
        minMaxNumberExclusive: 20,
      }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        minMaxNumberExclusive: 10,
      }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        minMaxNumberInclusive: 20,
      }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        minMaxNumberInclusive: 10,
      }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        minMaxNumber: 10,
      }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        minMaxNumber: 9,
      }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        minMaxNumberCalculated: 10,
      }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        minMaxNumberCalculated: 9,
      }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        minZero: -1,
      }).to.deep.equal(1);
    });

    it('date', function () {
      expectErrorLength(testSchema, {
        minMaxDate: (new Date(Date.UTC(2013, 0, 1))),
      }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        minMaxDate: (new Date(Date.UTC(2012, 11, 31))),
      }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        minMaxDateCalculated: (new Date(Date.UTC(2013, 0, 1))),
      }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        minMaxDateCalculated: (new Date(Date.UTC(2012, 11, 31))),
      }).to.deep.equal(1);
    });
  });

  describe('modifier with $setOnInsert', function () {
    it('string', function () {
      expectErrorLength(testSchema, {
        $setOnInsert: {
          minMaxString: 'longenough',
        },
      }, { modifier: true, upsert: true }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        $setOnInsert: {
          minMaxString: 'short',
        },
      }, { modifier: true, upsert: true }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        $setOnInsert: {
          minMaxStringArray: ['longenough', 'longenough'],
        },
      }, { modifier: true, upsert: true }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        $setOnInsert: {
          minMaxStringArray: ['longenough', 'short'],
        },
      }, { modifier: true, upsert: true }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        $setOnInsert: {
          minMaxStringArray: ['short', 'short'],
        },
      }, { modifier: true, upsert: true }).to.deep.equal(2);
    });

    it('number', function () {
      expectErrorLength(testSchema, {
        $setOnInsert: {
          minMaxNumber: 10,
        },
      }, { modifier: true, upsert: true }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        $setOnInsert: {
          minMaxNumber: 9,
        },
      }, { modifier: true, upsert: true }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        $setOnInsert: {
          minMaxNumberCalculated: 10,
        },
      }, { modifier: true, upsert: true }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        $setOnInsert: {
          minMaxNumberCalculated: 9,
        },
      }, { modifier: true, upsert: true }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        $setOnInsert: {
          minZero: -1,
        },
      }, { modifier: true, upsert: true }).to.deep.equal(1);
    });

    it('date', function () {
      expectErrorLength(testSchema, {
        $setOnInsert: {
          minMaxDate: (new Date(Date.UTC(2013, 0, 1))),
        },
      }, { modifier: true, upsert: true }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        $setOnInsert: {
          minMaxDate: (new Date(Date.UTC(2012, 11, 31))),
        },
      }, { modifier: true, upsert: true }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        $setOnInsert: {
          minMaxDateCalculated: (new Date(Date.UTC(2013, 0, 1))),
        },
      }, { modifier: true, upsert: true }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        $setOnInsert: {
          minMaxDateCalculated: (new Date(Date.UTC(2012, 11, 31))),
        },
      }, { modifier: true, upsert: true }).to.deep.equal(1);
    });
  });

  describe('modifier with $set or $inc', function () {
    it('string', function () {
      expectErrorLength(testSchema, {
        $set: {
          minMaxString: 'longenough',
        },
      }, { modifier: true }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        $set: {
          minMaxString: 'short',
        },
      }, { modifier: true }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        $set: {
          minMaxStringArray: ['longenough', 'longenough'],
        },
      }, { modifier: true }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        $set: {
          minMaxStringArray: ['longenough', 'short'],
        },
      }, { modifier: true }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        $set: {
          minMaxStringArray: ['short', 'short'],
        },
      }, { modifier: true }).to.deep.equal(2);
    });

    it('number', function () {
      expectErrorLength(testSchema, {
        $set: {
          minMaxNumber: 10,
        },
      }, { modifier: true }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        $set: {
          minMaxNumber: 9,
        },
      }, { modifier: true }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        $set: {
          minMaxNumberCalculated: 10,
        },
      }, { modifier: true }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        $set: {
          minMaxNumberCalculated: 9,
        },
      }, { modifier: true }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        $set: {
          minZero: -1,
        },
      }, { modifier: true }).to.deep.equal(1);

      // Should not be invalid because we don't know what we're starting from
      expectErrorLength(testSchema, {
        $inc: {
          minZero: -5,
        },
      }, { modifier: true }).to.deep.equal(0);
    });

    it('date', function () {
      expectErrorLength(testSchema, {
        $set: {
          minMaxDate: (new Date(Date.UTC(2013, 0, 1))),
        },
      }, { modifier: true }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        $set: {
          minMaxDate: (new Date(Date.UTC(2012, 11, 31))),
        },
      }, { modifier: true }).to.deep.equal(1);

      expectErrorLength(testSchema, {
        $set: {
          minMaxDateCalculated: (new Date(Date.UTC(2013, 0, 1))),
        },
      }, { modifier: true }).to.deep.equal(0);

      expectErrorLength(testSchema, {
        $set: {
          minMaxDateCalculated: (new Date(Date.UTC(2012, 11, 31))),
        },
      }, { modifier: true }).to.deep.equal(1);
    });
  });
});
