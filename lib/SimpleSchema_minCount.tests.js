/* eslint-disable func-names, prefer-arrow-callback */

import friendsSchema from './testHelpers/friendsSchema';
import expectErrorLength from './testHelpers/expectErrorLength';

describe('SimpleSchema - minCount', function () {
    it('ensures array count is at least the minimum', async function () {
        (await expectErrorLength(friendsSchema, {
            friends: [],
            enemies: [],
        })).to.deep.equal(1);

        (await expectErrorLength(friendsSchema, {
            $set: {
                friends: [],
            },
        }, {modifier: true})).to.deep.equal(1);

        (await expectErrorLength(friendsSchema, {
            $setOnInsert: {
                friends: [],
                enemies: [],
            },
        }, {modifier: true, upsert: true})).to.deep.equal(1);
    });
});
