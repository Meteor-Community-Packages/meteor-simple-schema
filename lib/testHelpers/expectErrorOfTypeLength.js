import {expect} from 'chai';
import validate from './validate';

export default async function expectErrorOfTypeLength(type, ...args) {
    const validation = await validate(...args);
    const errors = validation.validationErrors();

    let errorCount = 0;
    errors.forEach((error) => {
        if (error.type === type) errorCount++;
    });
    return expect(errorCount);
}
