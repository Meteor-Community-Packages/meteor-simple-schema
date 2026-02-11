import {expect} from 'chai';
import validate from './validate';

export default async function expectValid(...args) {
    const validate1 = await validate(...args);
    expect(validate1.isValid()).to.equal(true);
}
