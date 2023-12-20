import { expect } from 'chai';
import validate from './validate';

export default function expectErrorLength(...args) {
  return expect(validate(...args).validationErrors().length);
}
