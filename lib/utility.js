function appendAffectedKey(affectedKey, key) {
  if (key === '$each') return affectedKey;
  return (affectedKey ? affectedKey + '.' + key : key);
}

function dateToDateString(date) {
  let m = (date.getUTCMonth() + 1);
  if (m < 10) m = '0' + m;
  let d = date.getUTCDate();
  if (d < 10) d = '0' + d;
  return date.getUTCFullYear() + '-' + m + '-' + d;
}

function looksLikeModifier(obj) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && key.substring(0, 1) === '$') return true;
  }
  return false;
}

// The latest Safari returns false for Uint8Array, etc. instanceof Function
// unlike other browsers.
function safariBugFix(type) {
  return (typeof Uint8Array !== 'undefined' && type === Uint8Array) ||
    (typeof Uint16Array !== 'undefined' && type === Uint16Array) ||
    (typeof Uint32Array !== 'undefined' && type === Uint32Array) ||
    (typeof Uint8ClampedArray !== 'undefined' && type === Uint8ClampedArray);
}

function shouldCheck(key) {
  if (key === '$pushAll') throw new Error('$pushAll is not supported; use $push + $each');
  return ['$pull', '$pullAll', '$pop', '$slice'].indexOf(key) === -1;
}

export {
  appendAffectedKey,
  dateToDateString,
  looksLikeModifier,
  safariBugFix,
  shouldCheck,
};
