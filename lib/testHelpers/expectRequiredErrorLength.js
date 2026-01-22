import { expect } from 'chai'
import validate from './validate'
import { SimpleSchema } from '../SimpleSchema'

export default async function expectRequiredErrorLength (...args) {
  const errors = (await validate(...args)).validationErrors();
  console.log('errors', errors);

  let requiredErrorCount = 0;
  errors.forEach((error) => {
    if (error.type === SimpleSchema.ErrorTypes.REQUIRED) requiredErrorCount++;
  })
  console.log('requiredErrorCount', requiredErrorCount);
  return expect(requiredErrorCount);
}
