import { expect } from 'chai'
import validate from './validate'

export default async function expectErrorLength(...args) {
  const validationErrors = (await validate(...args)).validationErrors();
  return expect(validationErrors.length)
}
