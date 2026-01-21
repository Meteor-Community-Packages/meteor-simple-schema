/* eslint-disable func-names, prefer-arrow-callback */
import {SimpleSchema} from './SimpleSchema'

import * as chai from 'chai';
import {expect} from 'chai'
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe('SimpleSchema', function () {
    describe('oneOf', function () {
        it('allows either type', async function () {
            const schema = new SimpleSchema({
                foo: SimpleSchema.oneOf(String, Number, Date)
            });

            const test1 = {foo: 1}
            await expect(schema.validate(test1)).to.be.fulfilled;
            expect(typeof test1.foo).to.equal('number');

            const test2 = {foo: 'bar'}
            await expect(schema.validate(test2)).to.be.fulfilled;
            expect(typeof test2.foo).to.equal('string');

            const test3 = {foo: new Date()}
            await expect(schema.validate(test3)).to.be.fulfilled;
            expect(test3.foo instanceof Date).to.equal(true);

            const test4 = {foo: false};
            await expect(schema.validate(test4)).to.be.rejected;
            expect(typeof test4.foo).to.equal('boolean');
        })

        it.skip('allows either type including schemas', function () {
            const schemaOne = new SimpleSchema({
                itemRef: String,
                partNo: String
            })

            const schemaTwo = new SimpleSchema({
                anotherIdentifier: String,
                partNo: String
            })

            const combinedSchema = new SimpleSchema({
                item: SimpleSchema.oneOf(String, schemaOne, schemaTwo)
            })

            let isValid = combinedSchema.namedContext().validate({
                item: 'foo'
            })
            expect(isValid).to.equal(true)

            isValid = combinedSchema.namedContext().validate({
                item: {
                    anotherIdentifier: 'hhh',
                    partNo: 'ttt'
                }
            })
            expect(isValid).to.equal(true)

            isValid = combinedSchema.namedContext().validate({
                item: {
                    itemRef: 'hhh',
                    partNo: 'ttt'
                }
            })
            expect(isValid).to.equal(true)
        })

        it('is valid as long as one min value is met', function () {
            const schema = new SimpleSchema({
                foo: SimpleSchema.oneOf({
                    type: SimpleSchema.Integer,
                    min: 5
                }, {
                    type: SimpleSchema.Integer,
                    min: 10
                })
            })

            expect(async function () {
                await schema.validate({foo: 7})
            }).not.to.throw()
        })

        it('works when one is an array', async function () {
            const schema = new SimpleSchema({
                foo: SimpleSchema.oneOf(String, Array),
                'foo.$': String
            })

            await expect(schema.validate({
                foo: 'bar'
            })).to.be.fulfilled;

            await expect(schema.validate({
                foo: 1
            })).to.be.rejected;

            await expect(schema.validate({
                foo: []
            })).to.be.fulfilled;

            await expect(schema.validate({
                foo: ['bar', 'bin']
            })).to.be.fulfilled;

            await expect(schema.validate({
                foo: ['bar', 1]
            })).to.be.rejected;
        })

        it('works when one is a schema', async function () {
            const objSchema = new SimpleSchema({
                _id: String
            })

            const schema = new SimpleSchema({
                foo: SimpleSchema.oneOf(String, objSchema)
            })

            await expect(schema.validate({
                foo: 'bar'
            })).to.be.fulfilled;

            await expect(schema.validate({
                foo: 1
            })).to.be.rejected;

            await expect(schema.validate({
                foo: []
            })).to.be.rejected;

            await expect(schema.validate({
                foo: {}
            })).to.be.rejected;

            await expect(schema.validate({
                foo: {
                    _id: 'ID'
                }
            })).to.be.fulfilled;
        })

        it('is invalid if neither min value is met', async function () {
            const schema = new SimpleSchema({
                foo: SimpleSchema.oneOf({
                    type: SimpleSchema.Integer,
                    min: 5
                }, {
                    type: SimpleSchema.Integer,
                    min: 10
                })
            })

            await expect(schema.validate({foo: 3})).to.be.rejected;
        })
    })
})
