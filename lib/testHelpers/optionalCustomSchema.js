import { SimpleSchema } from '../SimpleSchema';

const optionalCustomSchema = new SimpleSchema({
  foo: {
    type: String,
    optional: true,
    custom: () => 'custom',
  },
});

export default optionalCustomSchema;
