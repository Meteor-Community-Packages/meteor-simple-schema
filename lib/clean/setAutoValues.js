import getPositionsForAutoValue from './getPositionsForAutoValue';
import AutoValueRunner from './AutoValueRunner';

/**
 * @method sortAutoValueFunctions
 * @private
 * @param {Array} autoValueFunctions - Array of objects to be sorted
 * @returns {Array} Sorted array
 *
 * Stable sort of the autoValueFunctions (preserves order at the same field depth).
 */
export function sortAutoValueFunctions(autoValueFunctions) {
  const defaultFieldOrder = autoValueFunctions.reduce((acc, { fieldName }, index) => {
    acc[fieldName] = index;
    return acc;
  }, {});

  // Sort by how many dots each field name has, asc, such that we can auto-create
  // objects and arrays before we run the autoValues for properties within them.
  // Fields of the same level (same number of dots) preserve should order from the original array.
  return autoValueFunctions.sort((a, b) => {
    const depthDiff = a.fieldName.split('.').length - b.fieldName.split('.').length;
    return depthDiff === 0 ? defaultFieldOrder[a.fieldName] - defaultFieldOrder[b.fieldName] : depthDiff;
  });
}

/**
 * @method setAutoValues
 * @private
 * @param {Array} autoValueFunctions - An array of objects with func, fieldName, and closestSubschemaFieldName props
 * @param {MongoObject} mongoObject
 * @param {Boolean} [isModifier=false] - Is it a modifier doc?
 * @param {Object} [extendedAutoValueContext] - Object that will be added to the context when calling each autoValue function
 * @returns {undefined}
 *
 * Updates doc with automatic values from autoValue functions or default
 * values from defaultValue. Modifies the referenced object in place.
 */
function setAutoValues(autoValueFunctions, mongoObject, isModifier, isUpsert, extendedAutoValueContext) {
  const sortedAutoValueFunctions = sortAutoValueFunctions(autoValueFunctions);

  sortedAutoValueFunctions.forEach(({ func, fieldName, closestSubschemaFieldName }) => {
    const avRunner = new AutoValueRunner({
      closestSubschemaFieldName,
      extendedAutoValueContext,
      func,
      isModifier,
      isUpsert,
      mongoObject,
    });

    const positions = getPositionsForAutoValue({ fieldName, isModifier, mongoObject });

    // Run the autoValue function once for each place in the object that
    // has a value or that potentially should.
    positions.forEach(avRunner.runForPosition.bind(avRunner));
  });
}

export default setAutoValues;
