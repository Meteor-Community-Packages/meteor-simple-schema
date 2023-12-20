// this domain regex matches all domains that have at least one .
// sadly IPv4 Adresses will be caught too but technically those are valid domains
// this expression is extracted from the original RFC 5322 mail expression
// a modification enforces that the tld consists only of characters
const rxDomain = '(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z](?:[a-z-]*[a-z])?';
// this domain regex matches everythign that could be a domain in intranet
// that means "localhost" is a valid domain
const rxNameDomain = '(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\\.|$))+';
// strict IPv4 expression which allows 0-255 per oktett
const rxIPv4 = '(?:(?:[0-1]?\\d{1,2}|2[0-4]\\d|25[0-5])(?:\\.|$)){4}';
// strict IPv6 expression which allows (and validates) all shortcuts
const rxIPv6 = '(?:(?:[\\dA-Fa-f]{1,4}(?::|$)){8}' // full adress
  + '|(?=(?:[^:\\s]|:[^:\\s])*::(?:[^:\\s]|:[^:\\s])*$)' // or min/max one '::'
  + '[\\dA-Fa-f]{0,4}(?:::?(?:[\\dA-Fa-f]{1,4}|$)){1,6})'; // and short adress
// this allows domains (also localhost etc) and ip adresses
const rxWeakDomain = `(?:${[rxNameDomain, rxIPv4, rxIPv6].join('|')})`;
// unique id from the random package also used by minimongo
// min and max are used to set length boundaries
// set both for explicit lower and upper bounds
// set min as integer and max to null for explicit lower bound and arbitrary upper bound
// set none for arbitrary length
// set only min for fixed length
// character list: https://github.com/meteor/meteor/blob/release/0.8.0/packages/random/random.js#L88
// string length: https://github.com/meteor/meteor/blob/release/0.8.0/packages/random/random.js#L143
const isValidBound = (value, lower) => !value || (Number.isSafeInteger(value) && value > lower);
const idOfLength = (min, max) => {
  if (!isValidBound(min, 0)) throw new Error(`Expected a non-negative safe integer, got ${min}`);
  if (!isValidBound(max, min)) throw new Error(`Expected a non-negative safe integer greater than 1 and greater than min, got ${max}`);
  let bounds;
  if (min && max) bounds = `${min},${max}`;
  else if (min && max === null) bounds = `${min},`;
  else if (min && !max) bounds = `${min}`;
  else if (!min && !max) bounds = '0,';
  else throw new Error(`Unexpected state for min (${min}) and max (${max})`);
  return new RegExp(`^[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{${bounds}}$`);
};

const regEx = {
  // We use the RegExp suggested by W3C in http://www.w3.org/TR/html5/forms.html#valid-e-mail-address
  // This is probably the same logic used by most browsers when type=email, which is our goal. It is
  // a very permissive expression. Some apps may wish to be more strict and can write their own RegExp.
  Email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

  // Like Email but requires the TLD (.com, etc)
  EmailWithTLD: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,

  Domain: new RegExp(`^${rxDomain}$`),
  WeakDomain: new RegExp(`^${rxWeakDomain}$`),

  IP: new RegExp(`^(?:${rxIPv4}|${rxIPv6})$`),
  IPv4: new RegExp(`^${rxIPv4}$`),
  IPv6: new RegExp(`^${rxIPv6}$`),
  // URL RegEx from https://gist.github.com/dperini/729294
  // DEPRECATED! Known 2nd degree polynomial ReDoS vulnerability.
  // Use a custom validator such as this to validate URLs:
  //   custom() {
  //     if (!this.isSet) return;
  //     try {
  //       new URL(this.value);
  //     } catch (err) {
  //       return 'badUrl';
  //     }
  //   }
  // eslint-disable-next-line redos/no-vulnerable
  Url: /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i,
  // default id is defined with exact 17 chars of length
  Id: idOfLength(17),
  idOfLength,
  // allows for a 5 digit zip code followed by a whitespace or dash and then 4 more digits
  // matches 11111 and 11111-1111 and 11111 1111
  ZipCode: /^\d{5}(?:[-\s]\d{4})?$/,
  // taken from Google's libphonenumber library
  // https://github.com/googlei18n/libphonenumber/blob/master/javascript/i18n/phonenumbers/phonenumberutil.js
  // reference the VALID_PHONE_NUMBER_PATTERN key
  // allows for common phone number symbols including + () and -
  // DEPRECATED! Known 2nd degree polynomial ReDoS vulnerability.
  // Instead, use a custom validation function, with a high quality
  // phone number validation package that meets your needs.
  // eslint-disable-next-line redos/no-vulnerable
  Phone: /^[0-9０-９٠-٩۰-۹]{2}$|^[+＋]*(?:[-x‐-―−ー－-／  ­​⁠　()（）［］.\[\]/~⁓∼～*]*[0-9０-９٠-٩۰-۹]){3,}[-x‐-―−ー－-／  ­​⁠　()（）［］.\[\]/~⁓∼～*A-Za-z0-9０-９٠-٩۰-۹]*(?:;ext=([0-9０-９٠-٩۰-۹]{1,20})|[  \t,]*(?:e?xt(?:ensi(?:ó?|ó))?n?|ｅ?ｘｔｎ?|доб|anexo)[:\.．]?[  \t,-]*([0-9０-９٠-٩۰-۹]{1,20})#?|[  \t,]*(?:[xｘ#＃~～]|int|ｉｎｔ)[:\.．]?[  \t,-]*([0-9０-９٠-٩۰-۹]{1,9})#?|[- ]+([0-9０-９٠-٩۰-۹]{1,6})#|[  \t]*(?:,{2}|;)[:\.．]?[  \t,-]*([0-9０-９٠-٩۰-۹]{1,15})#?|[  \t]*(?:,)+[:\.．]?[  \t,-]*([0-9０-９٠-٩۰-۹]{1,9})#?)?$/i, // eslint-disable-line no-irregular-whitespace
};

export default regEx;
