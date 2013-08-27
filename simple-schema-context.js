SimpleSchemaValidationContext = function(ss) {
    var self = this;
    self._simpleSchema = ss;
    self._invalidKeys = [];
    self._schemaKeys = _.keys(ss.schema());
    //set up validation dependencies
    self._deps = {};
    self._depsAny = new Deps.Dependency;
    _.each(self._schemaKeys, function(name) {
        self._deps[name] = new Deps.Dependency;
    });
};

//validates the object against the simple schema and sets a reactive array of error objects
SimpleSchemaValidationContext.prototype.validate = function(obj, opt) {
    var self = this;
    var invalidKeys = self._simpleSchema.validate(obj, opt);

    //now update self._invalidKeys and dependencies

    //note any currently invalid keys so that we can mark them as changed
    //due to new validation (they may be valid now, or invalid in a different way)
    var removedKeys = _.pluck(self._invalidKeys, "name");

    //update
    self._invalidKeys = invalidKeys;

    //add newly invalid keys to changedKeys
    var addedKeys = _.pluck(self._invalidKeys, "name");

    //mark all changed keys as changed
    var changedKeys = _.union(addedKeys, removedKeys);
    _.each(changedKeys, function(name) {
        self._deps[name].changed();
    });
    if (changedKeys.length) {
        self._depsAny.changed();
    }
};

//validates doc against self._schema for one key and sets a reactive array of error objects
SimpleSchemaValidationContext.prototype.validateOne = function(obj, keyName, opt) {
    var self = this;
    var invalidKeys = self._simpleSchema.validateOne(obj, keyName, opt);

    //now update self._invalidKeys and dependencies

    //remove objects from self._invalidKeys where name = keyName
    var newInvalidKeys = [];
    for (var i = 0, ln = self._invalidKeys.length, k; i < ln; i++) {
        k = self._invalidKeys[i];
        if (k.name !== keyName) {
            newInvalidKeys.push(k);
        }
    }
    self._invalidKeys = newInvalidKeys;

    //merge invalidKeys into self._invalidKeys
    for (var i = 0, ln = invalidKeys.length, k; i < ln; i++) {
        k = invalidKeys[i];
        self._invalidKeys.push(k);
    }

    //mark key as changed due to new validation (they may be valid now, or invalid in a different way)
    self._deps[keyName].changed();
    self._depsAny.changed();
};

//reset the invalidKeys array
SimpleSchemaValidationContext.prototype.resetValidation = function() {
    var self = this;
    var removedKeys = _.pluck(self._invalidKeys, "name");
    self._invalidKeys = [];
    _.each(removedKeys, function(name) {
        self._deps[name].changed();
    });
};

SimpleSchemaValidationContext.prototype.valid = function() {
    var self = this;
    self._depsAny.depend();
    return !self._invalidKeys.length;
};

SimpleSchemaValidationContext.prototype.invalidKeys = function() {
    var self = this;
    self._depsAny.depend();
    return self._invalidKeys;
};

SimpleSchemaValidationContext.prototype.keyIsInvalid = function(name) {
    var self = this;
    self._deps[name].depend();
    return !!_.findWhere(self._invalidKeys, {name: name});
};

SimpleSchemaValidationContext.prototype.keyErrorMessage = function(name) {
    var self = this;
    self._deps[name].depend();
    var errorObj = _.findWhere(self._invalidKeys, {name: name});
    return errorObj ? errorObj.message : "";
};