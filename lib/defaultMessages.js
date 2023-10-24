import { getRegExpMessage } from './regExp'

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
      regEx ({
        label,
        regExp
      }) {
        // See if there's one where exp matches this expression
        let msg

        if (regExp) {
          msg = getRegExpMessage(regExp)
        }

        const regExpMessage = msg || 'failed regular expression validation'

        return `${label} ${regExpMessage}`
      },
      keyNotInSchema: '{{name}} is not allowed by the schema'
    }
  }
}

export default defaultMessages
