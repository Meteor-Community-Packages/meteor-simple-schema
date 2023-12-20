import regExpObj from './regExp';

const regExpMessages = [
  { exp: regExpObj.Email, msg: 'must be a valid email address' },
  { exp: regExpObj.EmailWithTLD, msg: 'must be a valid email address' },
  { exp: regExpObj.Domain, msg: 'must be a valid domain' },
  { exp: regExpObj.WeakDomain, msg: 'must be a valid domain' },
  { exp: regExpObj.IP, msg: 'must be a valid IPv4 or IPv6 address' },
  { exp: regExpObj.IPv4, msg: 'must be a valid IPv4 address' },
  { exp: regExpObj.IPv6, msg: 'must be a valid IPv6 address' },
  { exp: regExpObj.Url, msg: 'must be a valid URL' },
  { exp: regExpObj.Id, msg: 'must be a valid alphanumeric ID' },
  { exp: regExpObj.ZipCode, msg: 'must be a valid ZIP code' },
  { exp: regExpObj.Phone, msg: 'must be a valid phone number' },
];

const defaultMessages = {
  initialLanguage: 'en',
  messages: {
    en: {
      required: '{{{label}}} is required',
      minString: '{{{label}}} must be at least {{min}} characters',
      maxString: '{{{label}}} cannot exceed {{max}} characters',
      minNumber: '{{{label}}} must be at least {{min}}',
      maxNumber: '{{{label}}} cannot exceed {{max}}',
      minNumberExclusive: '{{{label}}} must be greater than {{min}}',
      maxNumberExclusive: '{{{label}}} must be less than {{max}}',
      minDate: '{{{label}}} must be on or after {{min}}',
      maxDate: '{{{label}}} cannot be after {{max}}',
      badDate: '{{{label}}} is not a valid date',
      minCount: 'You must specify at least {{minCount}} values',
      maxCount: 'You cannot specify more than {{maxCount}} values',
      noDecimal: '{{{label}}} must be an integer',
      notAllowed: '{{{value}}} is not an allowed value',
      expectedType: '{{{label}}} must be of type {{dataType}}',
      regEx({
        label,
        regExp,
      }) {
        // See if there's one where exp matches this expression
        let msgObj;
        if (regExp) {
          msgObj = regExpMessages.find((o) => o.exp && o.exp.toString() === regExp);
        }

        const regExpMessage = msgObj ? msgObj.msg : 'failed regular expression validation';

        return `${label} ${regExpMessage}`;
      },
      keyNotInSchema: '{{name}} is not allowed by the schema',
    },
  },
};

export default defaultMessages;
