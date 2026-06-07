/* eslint-disable func-names, prefer-arrow-callback */

import testSchema from './testHelpers/testSchema';
import friendsSchema from './testHelpers/friendsSchema';
import expectErrorLength from './testHelpers/expectErrorLength';
import expectErrorOfTypeLength from './testHelpers/expectErrorOfTypeLength';
import {SimpleSchema} from './SimpleSchema';

describe('SimpleSchema - max', function () {
    describe('normal', function () {
        it('string', async function () {
            (await expectErrorLength(testSchema, {
                minMaxString: 'nottoolongnottoolong',
            })).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                minMaxString: 'toolongtoolongtoolong',
            })).to.deep.equal(1);

            (await expectErrorLength(testSchema, {
                minMaxStringArray: ['nottoolongnottoolong', 'nottoolongnottoolong'],
            })).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                minMaxStringArray: ['toolongtoolongtoolong', 'toolongtoolongtoolong'],
            })).to.deep.equal(2);

            (await expectErrorLength(testSchema, {
                minMaxStringArray: ['nottoolongnottoolong', 'nottoolongnottoolong', 'nottoolongnottoolong'],
            })).to.deep.equal(1);
        });

        it('number', async function () {
            (await expectErrorLength(testSchema, {
                minMaxNumber: 20,
            })).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                minMaxNumber: 21,
            })).to.deep.equal(1);

            (await expectErrorLength(testSchema, {
                minMaxNumberCalculated: 20,
            })).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                minMaxNumberCalculated: 21,
            })).to.deep.equal(1);
        });

        it('date', async function () {
            (await expectErrorLength(testSchema, {
                minMaxDate: (new Date(Date.UTC(2013, 11, 31))),
            })).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                minMaxDate: (new Date(Date.UTC(2014, 0, 1))),
            })).to.deep.equal(1);

            (await expectErrorLength(testSchema, {
                minMaxDateCalculated: (new Date(Date.UTC(2013, 11, 31))),
            })).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                minMaxDateCalculated: (new Date(Date.UTC(2014, 0, 1))),
            })).to.deep.equal(1);
        });
    });

    describe('modifier with $setOnInsert', function () {
        it('string', async function () {
            (await expectErrorLength(testSchema, {
                $setOnInsert: {
                    minMaxString: 'nottoolongnottoolong',
                },
            }, {modifier: true, upsert: true})).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                $setOnInsert: {
                    minMaxString: 'toolongtoolongtoolong',
                },
            }, {modifier: true, upsert: true})).to.deep.equal(1);

            (await expectErrorLength(testSchema, {
                $setOnInsert: {
                    minMaxStringArray: ['nottoolongnottoolong', 'nottoolongnottoolong'],
                },
            }, {modifier: true, upsert: true})).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                $setOnInsert: {
                    minMaxStringArray: ['toolongtoolongtoolong', 'toolongtoolongtoolong'],
                },
            }, {modifier: true, upsert: true})).to.deep.equal(2);

            (await expectErrorLength(testSchema, {
                $setOnInsert: {
                    minMaxStringArray: ['nottoolongnottoolong', 'nottoolongnottoolong', 'nottoolongnottoolong'],
                },
            }, {modifier: true, upsert: true})).to.deep.equal(1);
        });

        it('number', async function () {
            (await expectErrorLength(testSchema, {
                $setOnInsert: {
                    minMaxNumber: 20,
                },
            }, {modifier: true, upsert: true})).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                $setOnInsert: {
                    minMaxNumber: 21,
                },
            }, {modifier: true, upsert: true})).to.deep.equal(1);

            (await expectErrorLength(testSchema, {
                $setOnInsert: {
                    minMaxNumberCalculated: 20,
                },
            }, {modifier: true, upsert: true})).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                $setOnInsert: {
                    minMaxNumberCalculated: 21,
                },
            }, {modifier: true, upsert: true})).to.deep.equal(1);
        });

        it('date', async function () {
            (await expectErrorLength(testSchema, {
                $setOnInsert: {
                    minMaxDate: (new Date(Date.UTC(2013, 11, 31))),
                },
            }, {modifier: true, upsert: true})).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                $setOnInsert: {
                    minMaxDate: (new Date(Date.UTC(2014, 0, 1))),
                },
            }, {modifier: true, upsert: true})).to.deep.equal(1);

            (await expectErrorLength(testSchema, {
                $setOnInsert: {
                    minMaxDateCalculated: (new Date(Date.UTC(2013, 11, 31))),
                },
            }, {modifier: true, upsert: true})).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                $setOnInsert: {
                    minMaxDateCalculated: (new Date(Date.UTC(2014, 0, 1))),
                },
            }, {modifier: true, upsert: true})).to.deep.equal(1);
        });
    });

    describe('modifier with $set or $inc', function () {
        it('string', async function () {
            (await expectErrorLength(testSchema, {
                $set: {
                    minMaxString: 'nottoolongnottoolong',
                },
            }, {modifier: true})).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                $set: {
                    minMaxString: 'toolongtoolongtoolong',
                },
            }, {modifier: true})).to.deep.equal(1);

            (await expectErrorLength(testSchema, {
                $set: {
                    minMaxStringArray: ['nottoolongnottoolong', 'nottoolongnottoolong'],
                },
            }, {modifier: true})).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                $set: {
                    minMaxStringArray: ['toolongtoolongtoolong', 'toolongtoolongtoolong'],
                },
            }, {modifier: true})).to.deep.equal(2);

            (await expectErrorLength(testSchema, {
                $set: {
                    minMaxStringArray: ['nottoolongnottoolong', 'nottoolongnottoolong', 'nottoolongnottoolong'],
                },
            }, {modifier: true})).to.deep.equal(1);
        });

        it('number', async function () {
            (await expectErrorLength(testSchema, {
                $set: {
                    minMaxNumber: 20,
                },
            }, {modifier: true})).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                $set: {
                    minMaxNumber: 21,
                },
            }, {modifier: true})).to.deep.equal(1);

            (await expectErrorLength(testSchema, {
                $set: {
                    minMaxNumberCalculated: 20,
                },
            }, {modifier: true})).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                $set: {
                    minMaxNumberCalculated: 21,
                },
            }, {modifier: true})).to.deep.equal(1);

            (await expectErrorLength(testSchema, {
                $set: {
                    maxZero: 1,
                },
            }, {modifier: true})).to.deep.equal(1);

            // Should not be invalid because we don't know what we're starting from
            (await expectErrorLength(testSchema, {
                $inc: {
                    maxZero: 5,
                },
            }, {modifier: true})).to.deep.equal(0);
        });

        it('date', async function () {
            (await expectErrorLength(testSchema, {
                $set: {
                    minMaxDate: (new Date(Date.UTC(2013, 11, 31))),
                },
            }, {modifier: true})).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                $set: {
                    minMaxDate: (new Date(Date.UTC(2014, 0, 1))),
                },
            }, {modifier: true})).to.deep.equal(1);

            (await expectErrorLength(testSchema, {
                $set: {
                    minMaxDateCalculated: (new Date(Date.UTC(2013, 11, 31))),
                },
            }, {modifier: true})).to.deep.equal(0);

            (await expectErrorLength(testSchema, {
                $set: {
                    minMaxDateCalculated: (new Date(Date.UTC(2014, 0, 1))),
                },
            }, {modifier: true})).to.deep.equal(1);
        });
    });

    describe('modifier with $push', function () {
        it('valid', async function () {
            (await expectErrorOfTypeLength(SimpleSchema.ErrorTypes.MAX_STRING, friendsSchema, {
                $push: {
                    friends: {
                        name: 'Bob',
                        type: 'best',
                    },
                },
            }, {modifier: true})).to.deep.equal(0);
        });

        it('invalid', async function () {
            (await expectErrorOfTypeLength(SimpleSchema.ErrorTypes.MAX_STRING, friendsSchema, {
                $push: {
                    friends: {
                        name: 'Bobby',
                        type: 'best',
                    },
                },
            }, {modifier: true})).to.deep.equal(1);
        });
    });

    describe('modifier with $push and $each', function () {
        it('valid', async function () {
            (await expectErrorOfTypeLength(SimpleSchema.ErrorTypes.MAX_STRING, friendsSchema, {
                $push: {
                    friends: {
                        $each: [{
                            name: 'Bob',
                            type: 'best',
                        }, {
                            name: 'Bob',
                            type: 'best',
                        }],
                    },
                },
            }, {modifier: true})).to.deep.equal(0);
        });

        it('invalid', async function () {
            (await expectErrorOfTypeLength(SimpleSchema.ErrorTypes.MAX_STRING, friendsSchema, {
                $push: {
                    friends: {
                        $each: [{
                            name: 'Bob',
                            type: 'best',
                        }, {
                            name: 'Bobby',
                            type: 'best',
                        }],
                    },
                },
            }, {modifier: true})).to.deep.equal(1);
        });
    });

    describe('modifier with $addToSet', function () {
        it('valid', async function () {
            (await expectErrorOfTypeLength(SimpleSchema.ErrorTypes.MAX_STRING, friendsSchema, {
                $addToSet: {
                    friends: {
                        name: 'Bob',
                        type: 'best',
                    },
                },
            }, {modifier: true})).to.deep.equal(0);
        });

        it('invalid', async function () {
            (await expectErrorOfTypeLength(SimpleSchema.ErrorTypes.MAX_STRING, friendsSchema, {
                $addToSet: {
                    friends: {
                        name: 'Bobby',
                        type: 'best',
                    },
                },
            }, {modifier: true})).to.deep.equal(1);
        });
    });

    describe('modifier with $addToSet and $each', function () {
        it('valid', async function () {
            (await expectErrorOfTypeLength(SimpleSchema.ErrorTypes.MAX_STRING, friendsSchema, {
                $addToSet: {
                    friends: {
                        $each: [{
                            name: 'Bob',
                            type: 'best',
                        }, {
                            name: 'Bob',
                            type: 'best',
                        }],
                    },
                },
            }, {modifier: true})).to.deep.equal(0);
        });

        it('invalid', async function () {
            (await expectErrorOfTypeLength(SimpleSchema.ErrorTypes.MAX_STRING, friendsSchema, {
                $addToSet: {
                    friends: {
                        $each: [{
                            name: 'Bob',
                            type: 'best',
                        }, {
                            name: 'Bobby',
                            type: 'best',
                        }],
                    },
                },
            }, {modifier: true})).to.deep.equal(1);
        });
    });
});
