// unique id from the random package also used by minimongo
// min and max are used to set length boundaries
// set both for explicit lower and upper bounds
// set min as integer and max to null for explicit lower bound and arbitrary upper bound
// set none for arbitrary length
// set only min for fixed length
// character list: https://github.com/meteor/meteor/blob/release/0.8.0/packages/random/random.js#L88
// string length: https://github.com/meteor/meteor/blob/release/0.8.0/packages/random/random.js#L143
import { hasProperty } from './utility/hasProperty'

const isValidBound = (value, lower) => !value || (Number.isSafeInteger(value) && value > lower)
const idOfLength = (min, max) => {
  if (!isValidBound(min, 0)) throw new Error(`Expected a non-negative safe integer, got ${min}`)
  if (!isValidBound(max, min)) throw new Error(`Expected a non-negative safe integer greater than 1 and greater than min, got ${max}`)
  let bounds
  if (min && max) bounds = `${min},${max}`
  else if (min && max === null) bounds = `${min},`
  else if (min && !max) bounds = `${min}`
  else if (!min && !max) bounds = '0,'
  else throw new Error(`Unexpected state for min (${min}) and max (${max})`)
  return new RegExp(`^[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{${bounds}}$`)
}

const mongoIdRegExp = idOfLength(17)

const regEx = {
  Email: undefined,
  // Like Email but requires the TLD (.com, etc)
  EmailWithTLD: undefined,
  Domain: undefined,
  WeakDomain: undefined,
  IP: undefined,
  IPv4: undefined,
  IPv6: undefined,
  Url: undefined,
  // default id is defined with exact 17 chars of length
  Id: mongoIdRegExp,
  idOfLength,
  ZipCode: undefined,
  Phone: undefined
}

const regExpMessages = {
  Email: 'must be a valid email address',
  EmailWithTLD: 'must be a valid email address',
  Domain: 'must be a valid domain',
  WeakDomain: 'must be a valid domain',
  IP: 'must be a valid IPv4 or IPv6 address',
  IPv4: 'must be a valid IPv4 address',
  IPv6: 'must be a valid IPv6 address',
  Url: 'must be a valid URL',
  Id: 'must be a valid alphanumeric ID',
  idOfLength: 'must be a valid alphanumeric ID',
  ZipCode: 'must be a valid ZIP code',
  Phone: 'must be a valid phone number'
}

export const defineRegExp = (key, pattern) => {
  if (!hasProperty(regEx, key)) {
    throw new Error(`Unsupported RegEx key ${key}`)
  }
  regEx[key] = pattern
}

export const getRegExpMessage = pattern => {
  if (!pattern) {
    throw new Error(`A regExp pattern is required to get a validation message, got ${pattern}`)
  }

  const found = Object.entries(regEx).find(([_, value]) => {
    return value && value.toString() === pattern.toString()
  })

  const name = found && found[0]
  return regExpMessages[name]
}

export default regEx
