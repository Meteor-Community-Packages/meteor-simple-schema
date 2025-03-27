import MongoObject from 'mongo-object'
import doValidation from './doValidation'

/**
 * @typedef ValidationError
 * @type object
 * @property name {string} error name
 * @property type {string} error type name
 * @property value {string} actuall error message value
 */

/**
 * State representation of a validation for
 * a given schema.
 *
 *
 */
export default class ValidationContext {
  /**
   * @param {SimpleSchema} ss SimpleSchema instance to use for validation
   * @param {String} [name] Optional context name, accessible on context.name.
   */
  constructor (ss, name) {
    this.name = name

    this._simpleSchema = ss
    this._schema = ss.schema()
    this._schemaKeys = Object.keys(this._schema)
    this._validationErrors = []
    this._deps = {}

    // Set up validation dependencies
    const { tracker } = ss._constructorOptions
    this.reactive(tracker)
  }
  // ---------------------------------------------------------------------------
  // PUBLIC
  // ---------------------------------------------------------------------------

  /**
   * Makes this validation context
   * reactive for Meteor-Tracker.
   * @param tracker {Tracker}
   */
  reactive (tracker) {
    if (tracker && Object.keys(this._deps).length === 0) {
      this._depsAny = new tracker.Dependency()
      this._schemaKeys.forEach((key) => {
        this._deps[key] = new tracker.Dependency()
      })
    }
  }

  /**
   * Merges existing with a list of new validation errors.
   * Reactive.
   * @param errors ValidationError[]
   */
  setValidationErrors (errors) {
    const previousValidationErrors = this._validationErrors.map((o) => o.name)
    const newValidationErrors = errors.map((o) => o.name)

    this._validationErrors = errors

    // Mark all previous plus all new as changed
    const changedKeys = previousValidationErrors.concat(newValidationErrors)
    this._markKeysChanged(changedKeys)
  }

  /**
   * Adds new validation errors to the list.
   * @param errors ValidationError[]
   */
  addValidationErrors (errors) {
    const newValidationErrors = errors.map((o) => o.name)

    errors.forEach((error) => this._validationErrors.push(error))

    // Mark all new as changed
    this._markKeysChanged(newValidationErrors)
  }

  /**
   * Flushes/empties the list of validation errors.
   */
  reset () {
    this.setValidationErrors([])
  }

  /**
   * Returns a validation error for a given key.
   * @param key {string} the key of the field to access errors for
   * @param genericKey {string} generic version of the key, you usually don't need
   *  to explcitly call this. If you do, you need to wrap it using `MongoObject.makeKeyGeneric`
   * @return {ValidationError|undefined}
   */
  getErrorForKey (key, genericKey = MongoObject.makeKeyGeneric(key)) {
    const errors = this._validationErrors
    const errorForKey = errors.find((error) => error.name === key)
    if (errorForKey) return errorForKey

    return errors.find((error) => error.name === genericKey)
  }

  /**
   * Returns, whether there is an error for a given key. Reactive.
   * @param key {string}
   * @param genericKey {string}
   * @return {boolean}
   */
  keyIsInvalid (key, genericKey = MongoObject.makeKeyGeneric(key)) {
    if (Object.prototype.hasOwnProperty.call(this._deps, genericKey)) this._deps[genericKey].depend()

    return this._keyIsInvalid(key, genericKey)
  }

  /**
   *
   * @param key
   * @param genericKey
   * @return {string|*}
   */
  keyErrorMessage (key, genericKey = MongoObject.makeKeyGeneric(key)) {
    if (Object.prototype.hasOwnProperty.call(this._deps, genericKey)) this._deps[genericKey].depend()

    const errorObj = this.getErrorForKey(key, genericKey)
    if (!errorObj) return ''

    return this._simpleSchema.messageForError(errorObj)
  }

  /**
   * Validates the object against the simple schema
   * and sets a reactive array of error objects.
   * @param obj {object} the document (object) to validate
   * @param extendedCustomcontext {object=}
   * @param ignoreTypes {string[]=} list of names of ValidationError types to ignore
   * @param keysToValidate {string[]=} list of field names (keys) to validate. Other keys are ignored then
   * @param isModifier {boolean=} set to true if the document contains MongoDB modifiers
   * @param mongoObject {MongoObject=} MongoObject instance to generate keyInfo
   * @param isUpsert {boolean=} set to true if the document contains upsert modifiers
   * @return {boolean} true if no ValidationError was found, otherwise false
   */
  validate (obj, {
    extendedCustomContext = {},
    ignore: ignoreTypes = [],
    keys: keysToValidate,
    modifier: isModifier = false,
    mongoObject,
    upsert: isUpsert = false
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
      validationContext: this
    })

    if (keysToValidate) {
      // We have only revalidated the listed keys, so if there
      // are any other existing errors that are NOT in the keys list,
      // we should keep these errors.
      /* eslint-disable no-restricted-syntax */
      for (const error of this._validationErrors) {
        const wasValidated = keysToValidate.some((key) => key === error.name || error.name.startsWith(`${key}.`))
        if (!wasValidated) validationErrors.push(error)
      }
      /* eslint-enable no-restricted-syntax */
    }

    this.setValidationErrors(validationErrors)

    // Return true if it was valid; otherwise, return false
    return !validationErrors.length
  }

  /**
   * returns if this context has no errors. reactive.
   * @return {boolean}
   */
  isValid () {
    this._depsAny && this._depsAny.depend()
    return this._validationErrors.length === 0
  }

  /**
   * returns the list of validation errors. reactive.
   * @return {ValidationError[]}
   */
  validationErrors () {
    this._depsAny && this._depsAny.depend()
    return this._validationErrors
  }

  clean (...args) {
    return this._simpleSchema.clean(...args)
  }

  // ---------------------------------------------------------------------------
  // PRIVATE
  // ---------------------------------------------------------------------------

  _markKeyChanged (key) {
    const genericKey = MongoObject.makeKeyGeneric(key)
    if (Object.prototype.hasOwnProperty.call(this._deps, genericKey)) this._deps[genericKey].changed()
  }

  _markKeysChanged (keys) {
    if (!keys || !Array.isArray(keys) || !keys.length) return

    keys.forEach((key) => this._markKeyChanged(key))

    this._depsAny && this._depsAny.changed()
  }

  _keyIsInvalid (key, genericKey) {
    return !!this.getErrorForKey(key, genericKey)
  }
}
