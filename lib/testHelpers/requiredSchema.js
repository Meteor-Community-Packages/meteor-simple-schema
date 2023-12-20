import { SimpleSchema } from '../SimpleSchema';

const requiredSchema = new SimpleSchema({
  requiredString: {
    type: String,
  },
  requiredBoolean: {
    type: Boolean,
  },
  requiredNumber: {
    type: SimpleSchema.Integer,
  },
  requiredDate: {
    type: Date,
  },
  requiredEmail: {
    type: String,
    regEx: SimpleSchema.RegEx.Email,
  },
  requiredUrl: {
    type: String,
    custom() {
      if (!this.isSet) return;
      try {
        new URL(this.value); // eslint-disable-line
      } catch (err) {
        return 'badUrl';
      }
    },
  },
  requiredObject: {
    type: Object,
  },
  'requiredObject.requiredNumber': {
    type: SimpleSchema.Integer,
  },
  optionalObject: {
    type: Object,
    optional: true,
  },
  'optionalObject.requiredString': {
    type: String,
  },
  anOptionalOne: {
    type: String,
    optional: true,
    min: 20,
  },
});

requiredSchema.messageBox.messages({
  'regEx requiredEmail': '[label] is not a valid email address',
  'regEx requiredUrl': '[label] is not a valid URL',
});

export default requiredSchema;
