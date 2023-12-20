import clone from 'clone';
import MongoObject from 'mongo-object';
import { isEmptyObject, looksLikeModifier } from './utility';
import { SimpleSchema } from './SimpleSchema';
import convertToProperType from './clean/convertToProperType';
import setAutoValues from './clean/setAutoValues';
import typeValidator from './validation/typeValidator';

const operatorsToIgnoreValue = ['$unset', '$currentDate'];

/**
 * @param {SimpleSchema} ss - A SimpleSchema instance
 * @param {Object} doc - Document or modifier to clean. Referenced object will be modified in place.
 * @param {Object} [options]
 * @param {Boolean} [options.mutate=false] - Mutate doc. Set this to true to improve performance if you don't mind mutating the object you're cleaning.
 * @param {Boolean} [options.filter=true] - Do filtering?
 * @param {Boolean} [options.autoConvert=true] - Do automatic type converting?
 * @param {Boolean} [options.removeEmptyStrings=true] - Remove keys in normal object or $set where the value is an empty string?
 * @param {Boolean} [options.removeNullsFromArrays=false] - Remove all null items from all arrays
 * @param {Boolean} [options.trimStrings=true] - Trim string values?
 * @param {Boolean} [options.getAutoValues=true] - Inject automatic and default values?
 * @param {Boolean} [options.isModifier=false] - Is doc a modifier object?
 * @param {Boolean} [options.isUpsert=false] - Will the modifier object be used to do an upsert? This is used
 *   to determine whether $setOnInsert should be added to it for defaultValues.
 * @param {Boolean} [options.mongoObject] - If you already have the mongoObject instance, pass it to improve performance
 * @param {Object} [options.extendAutoValueContext] - This object will be added to the `this` context of autoValue functions.
 * @returns {Object} The modified doc.
 *
 * Cleans a document or modifier object. By default, will filter, automatically
 * type convert where possible, and inject automatic/default values. Use the options
 * to skip one or more of these.
 */
function clean(ss, doc, options = {}) {
  // By default, doc will be filtered and autoconverted
  options = {
    isModifier: looksLikeModifier(doc),
    isUpsert: false,
    ...ss._cleanOptions,
    ...options,
  };

  // Clone so we do not mutate
  const cleanDoc = options.mutate ? doc : clone(doc);

  const mongoObject = options.mongoObject || new MongoObject(cleanDoc, ss.blackboxKeys());

  // Clean loop
  if (
    options.filter
    || options.autoConvert
    || options.removeEmptyStrings
    || options.trimStrings
  ) {
    const removedPositions = []; // For removing now-empty objects after

    mongoObject.forEachNode(
      function eachNode() {
        // The value of a $unset is irrelevant, so no point in cleaning it.
        // Also we do not care if fields not in the schema are unset.
        // Other operators also have values that we wouldn't want to clean.
        if (operatorsToIgnoreValue.includes(this.operator)) return;

        const gKey = this.genericKey;
        if (!gKey) return;

        let val = this.value;
        if (val === undefined) return;

        let p;

        // Filter out props if necessary
        if (
          (options.filter && !ss.allowsKey(gKey))
          || (options.removeNullsFromArrays && this.isArrayItem && val === null)
        ) {
          // XXX Special handling for $each; maybe this could be made nicer
          if (this.position.slice(-7) === '[$each]') {
            mongoObject.removeValueForPosition(this.position.slice(0, -7));
            removedPositions.push(this.position.slice(0, -7));
          } else {
            this.remove();
            removedPositions.push(this.position);
          }
          if (SimpleSchema.debug) {
            console.info(
              `SimpleSchema.clean: filtered out value that would have affected key "${gKey}", which is not allowed by the schema`,
            );
          }
          return; // no reason to do more
        }

        const outerDef = ss.schema(gKey);
        const defs = outerDef && outerDef.type.definitions;
        const def = defs && defs[0];

        // Autoconvert values if requested and if possible
        if (options.autoConvert && def) {
          const isValidType = defs.some((definition) => {
            const errors = typeValidator.call({
              valueShouldBeChecked: true,
              definition,
              value: val,
            });
            return errors === undefined;
          });

          if (!isValidType) {
            const newVal = convertToProperType(val, def.type);
            if (newVal !== undefined && newVal !== val) {
              SimpleSchema.debug
                && console.info(
                  `SimpleSchema.clean: autoconverted value ${val} from ${typeof val} to ${typeof newVal} for ${gKey}`,
                );
              val = newVal;
              this.updateValue(newVal);
            }
          }
        }

        // Trim strings if
        // 1. The trimStrings option is `true` AND
        // 2. The field is not in the schema OR is in the schema with `trim` !== `false` AND
        // 3. The value is a string.
        if (
          options.trimStrings
          && (!def || def.trim !== false)
          && typeof val === 'string'
        ) {
          val = val.trim();
          this.updateValue(val);
        }

        // Remove empty strings if
        // 1. The removeEmptyStrings option is `true` AND
        // 2. The value is in a normal object or in the $set part of a modifier
        // 3. The value is an empty string.
        if (
          options.removeEmptyStrings
          && (!this.operator || this.operator === '$set')
          && typeof val === 'string'
          && !val.length
        ) {
          // For a document, we remove any fields that are being set to an empty string
          this.remove();
          // For a modifier, we $unset any fields that are being set to an empty string.
          // But only if we're not already within an entire object that is being set.
          if (
            this.operator === '$set'
            && this.position.match(/\[/g).length < 2
          ) {
            p = this.position.replace('$set', '$unset');
            mongoObject.setValueForPosition(p, '');
          }
        }
      },
      { endPointsOnly: false },
    );

    // Remove any objects that are now empty after filtering
    removedPositions.forEach((removedPosition) => {
      const lastBrace = removedPosition.lastIndexOf('[');
      if (lastBrace !== -1) {
        const removedPositionParent = removedPosition.slice(0, lastBrace);
        const value = mongoObject.getValueForPosition(removedPositionParent);
        if (isEmptyObject(value)) mongoObject.removeValueForPosition(removedPositionParent);
      }
    });

    mongoObject.removeArrayItems();
  }

  // Set automatic values
  options.getAutoValues
    && setAutoValues(
      ss.autoValueFunctions(),
      mongoObject,
      options.isModifier,
      options.isUpsert,
      options.extendAutoValueContext,
    );

  // Ensure we don't have any operators set to an empty object
  // since MongoDB 2.6+ will throw errors.
  if (options.isModifier) {
    Object.keys(cleanDoc || {}).forEach((op) => {
      const operatorValue = cleanDoc[op];
      if (
        typeof operatorValue === 'object'
        && operatorValue !== null
        && isEmptyObject(operatorValue)
      ) {
        delete cleanDoc[op];
      }
    });
  }

  return cleanDoc;
}

export default clean;
