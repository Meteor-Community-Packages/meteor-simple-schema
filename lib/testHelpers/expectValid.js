import { expect } from 'chai';
import validate from './validate';

export default function expectValid(...args) {
  expect(validate(...args).isValid()).to.equal(true);
}
