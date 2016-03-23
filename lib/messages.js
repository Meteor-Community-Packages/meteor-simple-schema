const regExpMessages = [
  {exp: SimpleSchema.RegEx.Email, msg: 'must be a valid email address'},
  {exp: SimpleSchema.RegEx.WeakEmail, msg: 'must be a valid email address'},
  {exp: SimpleSchema.RegEx.Domain, msg: 'must be a valid domain'},
  {exp: SimpleSchema.RegEx.WeakDomain, msg: 'must be a valid domain'},
  {exp: SimpleSchema.RegEx.IP, msg: 'must be a valid IPv4 or IPv6 address'},
  {exp: SimpleSchema.RegEx.IPv4, msg: 'must be a valid IPv4 address'},
  {exp: SimpleSchema.RegEx.IPv6, msg: 'must be a valid IPv6 address'},
  {exp: SimpleSchema.RegEx.Url, msg: 'must be a valid URL'},
  {exp: SimpleSchema.RegEx.Id, msg: 'must be a valid alphanumeric ID'}
];

MessageBox.defaults({
  initialLanguage: 'en',
  messages: {
    en: {
      required: '{{label}} is required',
      minString: '{{label}} must be at least {{min}} characters',
      maxString: '{{label}} cannot exceed {{max}} characters',
      minNumber: '{{label}} must be at least {{min}}',
      maxNumber: '{{label}} cannot exceed {{max}}',
      minNumberExclusive: '{{label}} must be greater than {{min}}',
      maxNumberExclusive: '{{label}} must be less than {{max}}',
      minDate: '{{label}} must be on or after {{min}}',
      maxDate: '{{label}} cannot be after {{max}}',
      badDate: '{{label}} is not a valid date',
      minCount: 'You must specify at least {{minCount}} values',
      maxCount: 'You cannot specify more than {{maxCount}} values',
      noDecimal: '{{label}} must be an integer',
      notAllowed: '{{value}} is not an allowed value',
      expectedType: '{{label}} must be of type {{dataType}}',
      regEx: function ({
        label,
        type,
        regExp,
      }) {
        // See if there's one where exp matches this expression
        let msgObj;
        if (regExp) {
          msgObj = _.find(regExpMessages, (o) => o.exp && o.exp.toString() === regExp);
        }

        const regExpMessage = msgObj ? msgObj.msg : 'failed regular expression validation';

        return `${label} ${regExpMessage}`;
      },
      keyNotInSchema: '{{name}} is not allowed by the schema',
    },
  }
});

// Returns a string message for the given error type and key. Uses the
// def and value arguments to fill in placeholders in the error messages.
SimpleSchema.prototype.messageForError = function (errorInfo) {
  let { name } = errorInfo;

  return this.messageBox.message(errorInfo, {
    context: {
      key: name, // backward compatibility

      // The call to this.label() establishes a reactive dependency, too
      label: this.label(name),
    },
  });
};
