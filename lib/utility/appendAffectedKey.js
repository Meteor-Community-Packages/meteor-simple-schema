export default function appendAffectedKey(affectedKey, key) {
  if (key === '$each') return affectedKey;
  return affectedKey ? `${affectedKey}.${key}` : key;
}
