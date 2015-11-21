function getPickOrOmit(type) {
  return function () {
    var self = this;
    var args = _.toArray(arguments);

    // If they are picking/omitting an object or array field, we need to also include everything under it
    var newSchema = {};
    _.each(self._schema, function(value, key) {
      // Pick/omit it if it IS in the array of keys they want OR if it
      // STARTS WITH something that is in the array plus a period
      var includeIt = _.any(args, function (wantedField) {
        return key === wantedField || key.indexOf(wantedField + '.') === 0;
      });

      if ((includeIt && type === 'pick') || (!includeIt && type === 'omit')) {
        newSchema[key] = value;
      }
    });

    return new SimpleSchema(newSchema);
  };
}

/**
 * @method SimpleSchema.prototype.pick
 * @param {[fields]} The list of fields to pick to instantiate the subschema
 * @returns {SimpleSchema} The subschema
 */
SimpleSchema.prototype.pick = getPickOrOmit('pick');

/**
 * @method SimpleSchema.prototype.omit
 * @param {[fields]} The list of fields to omit to instantiate the subschema
 * @returns {SimpleSchema} The subschema
 */
SimpleSchema.prototype.omit = getPickOrOmit('omit');
