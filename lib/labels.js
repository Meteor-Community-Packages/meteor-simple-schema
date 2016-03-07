import MongoObject from 'mongo-object';

/**
 * Change schema labels on the fly, causing mySchema.label computation
 * to rerun. Useful when the user changes the language.
 *
 * @param {Object} labels A dictionary of all the new label values, by schema key.
 */
SimpleSchema.prototype.labels = function (labels) {
  _.each(labels, (label, key) => {
    if (typeof label !== 'string' && typeof label !== 'function') return;
    if (!this._schema.hasOwnProperty(key)) return;

    this._schema[key].label = label;
    this._depsLabels[key] && this._depsLabels[key].changed();
  });
};

/**
 * Gets a field's label or all field labels reactively.
 *
 * @param {String} [key] The schema key, specific or generic.
 *   Omit this argument to get a dictionary of all labels.
 * @returns {String} The label
 */
SimpleSchema.prototype.label = function (key) {
  // Get all labels
  if (key === null || key === undefined) {
    let result = {};
    _.each(this._schemaKeys, (schemaKey) => {
      result[schemaKey] = this.label(schemaKey);
    });
    return result;
  }

  // Get label for one field
  let def = this.getDefinition(key, ['label']);
  if (!def) return null;

  let genericKey = MongoObject.makeKeyGeneric(key);
  this._depsLabels[genericKey] && this._depsLabels[genericKey].depend();
  return def.label;
};
