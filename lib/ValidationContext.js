import MongoObject from 'mongo-object';
import doValidation from './doValidation';

export default class ValidationContext {
  /**
   * @param {SimpleSchema} ss SimpleSchema instance to use for validation
   * @param {String} [name] Optional context name, accessible on context.name.
   */
  constructor(ss, name) {
    this.name = name;
    this._simpleSchema = ss;
    this._schema = ss.schema();
    this._schemaKeys = Object.keys(this._schema);
    this._validationErrors = [];

    // Set up validation dependencies
    this._deps = {};
    const { tracker } = ss._constructorOptions;
    if (tracker) {
      this._depsAny = new tracker.Dependency();
      this._schemaKeys.forEach((key) => {
        this._deps[key] = new tracker.Dependency();
      });
    }
  }

  _markKeyChanged(key) {
    const genericKey = MongoObject.makeKeyGeneric(key);
    if (Object.prototype.hasOwnProperty.call(this._deps, genericKey)) this._deps[genericKey].changed();
  }

  _markKeysChanged(keys) {
    if (!keys || !Array.isArray(keys) || !keys.length) return;

    keys.forEach((key) => this._markKeyChanged(key));

    this._depsAny && this._depsAny.changed();
  }

  setValidationErrors(errors) {
    const previousValidationErrors = this._validationErrors.map((o) => o.name);
    const newValidationErrors = errors.map((o) => o.name);

    this._validationErrors = errors;

    // Mark all previous plus all new as changed
    const changedKeys = previousValidationErrors.concat(newValidationErrors);
    this._markKeysChanged(changedKeys);
  }

  addValidationErrors(errors) {
    const newValidationErrors = errors.map((o) => o.name);

    errors.forEach((error) => this._validationErrors.push(error));

    // Mark all new as changed
    this._markKeysChanged(newValidationErrors);
  }

  // Reset the validationErrors array
  reset() {
    this.setValidationErrors([]);
  }

  getErrorForKey(key, genericKey = MongoObject.makeKeyGeneric(key)) {
    const errors = this._validationErrors;
    const errorForKey = errors.find((error) => error.name === key);
    if (errorForKey) return errorForKey;

    return errors.find((error) => error.name === genericKey);
  }

  _keyIsInvalid(key, genericKey) {
    return !!this.getErrorForKey(key, genericKey);
  }

  // Like the internal one, but with deps
  keyIsInvalid(key, genericKey = MongoObject.makeKeyGeneric(key)) {
    if (Object.prototype.hasOwnProperty.call(this._deps, genericKey)) this._deps[genericKey].depend();

    return this._keyIsInvalid(key, genericKey);
  }

  keyErrorMessage(key, genericKey = MongoObject.makeKeyGeneric(key)) {
    if (Object.prototype.hasOwnProperty.call(this._deps, genericKey)) this._deps[genericKey].depend();

    const errorObj = this.getErrorForKey(key, genericKey);
    if (!errorObj) return '';

    return this._simpleSchema.messageForError(errorObj);
  }

  /**
   * Validates the object against the simple schema and sets a reactive array of error objects
   */
  validate(obj, {
    extendedCustomContext = {},
    ignore: ignoreTypes = [],
    keys: keysToValidate,
    modifier: isModifier = false,
    mongoObject,
    upsert: isUpsert = false,
  } = {}) {
    const validationErrors = doValidation({
      extendedCustomContext,
      ignoreTypes,
      isModifier,
      isUpsert,
      keysToValidate,
      mongoObject,
      obj,
      schema: this._simpleSchema,
      validationContext: this,
    });

    if (keysToValidate) {
      // We have only revalidated the listed keys, so if there
      // are any other existing errors that are NOT in the keys list,
      // we should keep these errors.
      /* eslint-disable no-restricted-syntax */
      for (const error of this._validationErrors) {
        const wasValidated = keysToValidate.some((key) => key === error.name || error.name.startsWith(`${key}.`));
        if (!wasValidated) validationErrors.push(error);
      }
      /* eslint-enable no-restricted-syntax */
    }

    this.setValidationErrors(validationErrors);

    // Return true if it was valid; otherwise, return false
    return !validationErrors.length;
  }

  isValid() {
    this._depsAny && this._depsAny.depend();
    return this._validationErrors.length === 0;
  }

  validationErrors() {
    this._depsAny && this._depsAny.depend();
    return this._validationErrors;
  }

  clean(...args) {
    return this._simpleSchema.clean(...args);
  }
}
