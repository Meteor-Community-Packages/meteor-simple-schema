import { SimpleSchema } from '../SimpleSchema';

const requiredCustomSchema = new SimpleSchema({
  a: {
    type: Array,
    custom() {
      // Just adding custom to trigger extra validation
    },
  },
  'a.$': {
    type: Object,
    custom() {
      // Just adding custom to trigger extra validation
    },
  },
  b: {
    type: Array,
    custom() {
      // Just adding custom to trigger extra validation
    },
  },
  'b.$': {
    type: Object,
    custom() {
      // Just adding custom to trigger extra validation
    },
  },
});

export default requiredCustomSchema;
