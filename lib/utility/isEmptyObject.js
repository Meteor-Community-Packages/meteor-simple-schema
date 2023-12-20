/**
 * @summary Determines whether the object has any "own" properties
 * @param {Object} obj Object to test
 * @return {Boolean} True if it has no "own" properties
 */
export default function isEmptyObject(obj) {
  /* eslint-disable no-restricted-syntax */
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  /* eslint-enable no-restricted-syntax */

  return true;
}
