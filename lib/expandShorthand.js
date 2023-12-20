import MongoObject from 'mongo-object';

/**
 * Clones a schema object, expanding shorthand as it does it.
 */
function expandShorthand(schema) {
  const schemaClone = {};

  Object.keys(schema).forEach((key) => {
    const definition = schema[key];
    // CASE 1: Not shorthand. Just clone
    if (MongoObject.isBasicObject(definition)) {
      schemaClone[key] = { ...definition };
      return;
    }

    // CASE 2: The definition is an array of some type
    if (Array.isArray(definition)) {
      if (Array.isArray(definition[0])) {
        throw new Error(`Array shorthand may only be used to one level of depth (${key})`);
      }
      const type = definition[0];
      schemaClone[key] = { type: Array };

      // Also add the item key definition
      const itemKey = `${key}.$`;
      if (schema[itemKey]) {
        throw new Error(`Array shorthand used for ${key} field but ${key}.$ key is already in the schema`);
      }

      if (type instanceof RegExp) {
        schemaClone[itemKey] = { type: String, regEx: type };
      } else {
        schemaClone[itemKey] = { type };
      }
      return;
    }

    // CASE 3: The definition is a regular expression
    if (definition instanceof RegExp) {
      schemaClone[key] = {
        type: String,
        regEx: definition,
      };
      return;
    }

    // CASE 4: The definition is something, a type
    schemaClone[key] = { type: definition };
  });

  return schemaClone;
}

export default expandShorthand;
