/**
 * Returns the ending of key, after stripping out the beginning
 * ancestorKey and any array placeholders
 *
 * getLastPartOfKey('a.b.c', 'a') returns 'b.c'
 * getLastPartOfKey('a.b.$.c', 'a.b') returns 'c'
 */
export default function getLastPartOfKey(key, ancestorKey) {
  let lastPart = '';
  const startString = `${ancestorKey}.`;
  if (key.indexOf(startString) === 0) {
    lastPart = key.replace(startString, '');
    if (lastPart.startsWith('$.')) lastPart = lastPart.slice(2);
  }
  return lastPart;
}
