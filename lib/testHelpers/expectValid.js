import expect from 'expect'
import validate from './validate'

export default function expectValid (...args) {
  expect(validate(...args).isValid()).toBe(true)
}
