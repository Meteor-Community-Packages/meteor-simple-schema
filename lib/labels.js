/**
 * Change schema labels on the fly, causing mySchema.label computation
 * to rerun. Useful when the user changes the language.
 *
 * @param {Object} labels A dictionary of all the new label values, by schema key.
 */
SimpleSchema.prototype.labels = function (labels) {
  var self = this;
  _.each(labels, function(label, fieldName) {
    if (typeof label !== 'string' && typeof label !== 'function') return;
    if (!self._schema.hasOwnProperty(fieldName)) return;

    self._schema[fieldName].label = label;
    self._depsLabels[fieldName] && self._depsLabels[fieldName].changed();
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
  var self = this;

  // Get all labels
  if (key === null || key === void 0) {
    var result = {};
    _.each(self.schema(), function(def, fieldName) {
      result[fieldName] = self.label(fieldName);
    });
    return result;
  }

  // Get label for one field
  var def = self.getDefinition(key, ['label']);
  if (def) {
    var genericKey = SimpleSchema._makeGeneric(key);
    self._depsLabels[genericKey] && self._depsLabels[genericKey].depend();
    return def.label;
  }

  return null;
};
