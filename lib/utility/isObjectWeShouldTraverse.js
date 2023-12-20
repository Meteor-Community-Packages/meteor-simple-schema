export default function isObjectWeShouldTraverse(val) {
  // Some of these types don't exist in old browsers so we'll catch and return false in those cases
  try {
    if (val !== Object(val)) return false;
    // There are some object types that we know we shouldn't traverse because
    // they will often result in overflows and it makes no sense to validate them.
    if (val instanceof Date) return false;
    if (val instanceof Int8Array) return false;
    if (val instanceof Uint8Array) return false;
    if (val instanceof Uint8ClampedArray) return false;
    if (val instanceof Int16Array) return false;
    if (val instanceof Uint16Array) return false;
    if (val instanceof Int32Array) return false;
    if (val instanceof Uint32Array) return false;
    if (val instanceof Float32Array) return false;
    if (val instanceof Float64Array) return false;
  } catch (e) {
    return false;
  }

  return true;
}
