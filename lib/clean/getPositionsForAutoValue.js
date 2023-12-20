import MongoObject from 'mongo-object';
import { getLastPartOfKey, getParentOfKey } from '../utility';

/**
 * A position is a place in the object where this field exists.
 * If no arrays are involved, then every field/key has at most 1 position.
 * If arrays are involved, then a field could have potentially unlimited positions.
 *
 * For example, the key 'a.b.$.c` would have these positions:
 *   `a[b][0][c]`
 *   `a[b][1][c]`
 *   `a[b][2][c]`
 *
 * For this object:
 * {
 *   a: {
 *     b: [
 *       { c: 1 },
 *       { c: 1 },
 *       { c: 1 },
 *     ],
 *   },
 * }
 *
 * To make matters more complicated, we want to include not only the existing positions
 * but also the positions that might exist due to their parent object existing or their
 * parent object being auto-created by a MongoDB modifier that implies it.
 */
export default function getPositionsForAutoValue({ fieldName, isModifier, mongoObject }) {
  // Positions for this field
  const positions = mongoObject.getPositionsInfoForGenericKey(fieldName);

  // If the field is an object and will be created by MongoDB,
  // we don't need (and can't have) a value for it
  if (isModifier && mongoObject.getPositionsThatCreateGenericKey(fieldName).length > 0) {
    return positions;
  }

  // For simple top-level fields, just add an undefined would-be position
  // if there isn't a real position.
  if (fieldName.indexOf('.') === -1 && positions.length === 0) {
    positions.push({
      key: fieldName,
      value: undefined,
      operator: isModifier ? '$set' : null,
      position: isModifier ? `$set[${fieldName}]` : fieldName,
    });
    return positions;
  }

  const parentPath = getParentOfKey(fieldName);
  const lastPart = getLastPartOfKey(fieldName, parentPath);
  const lastPartWithBraces = lastPart.replace(/\./g, '][');
  const parentPositions = mongoObject.getPositionsInfoForGenericKey(parentPath);

  if (parentPositions.length) {
    parentPositions.forEach((info) => {
      const childPosition = `${info.position}[${lastPartWithBraces}]`;
      if (!positions.find((i) => i.position === childPosition)) {
        positions.push({
          key: `${info.key}.${lastPart}`,
          value: undefined,
          operator: info.operator,
          position: childPosition,
        });
      }
    });
  } else if (parentPath.slice(-2) !== '.$') {
    // positions that will create parentPath
    mongoObject.getPositionsThatCreateGenericKey(parentPath).forEach((info) => {
      const { operator, position } = info;
      let wouldBePosition;
      if (operator) {
        const next = position.slice(position.indexOf('[') + 1, position.indexOf(']'));
        const nextPieces = next.split('.');

        const newPieces = [];
        let newKey;
        while (nextPieces.length && newKey !== parentPath) {
          newPieces.push(nextPieces.shift());
          newKey = newPieces.join('.');
        }
        newKey = `${newKey}.${fieldName.slice(newKey.length + 1)}`;
        wouldBePosition = `$set[${newKey}]`;
      } else {
        const lastPart2 = getLastPartOfKey(fieldName, parentPath);
        const lastPartWithBraces2 = lastPart2.replace(/\./g, '][');
        wouldBePosition = `${position.slice(0, position.lastIndexOf('['))}[${lastPartWithBraces2}]`;
      }
      if (!positions.find((i) => i.position === wouldBePosition)) {
        positions.push({
          key: MongoObject._positionToKey(wouldBePosition),
          value: undefined,
          operator: operator ? '$set' : null,
          position: wouldBePosition,
        });
      }
    });
  }

  return positions;
}
