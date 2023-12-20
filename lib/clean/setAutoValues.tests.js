import { expect } from 'chai';
import { SimpleSchema } from '../SimpleSchema';
import { sortAutoValueFunctions } from './setAutoValues';

describe('setAutoValues', () => {
  it('sorts correctly', () => {
    const schema = new SimpleSchema({
      field1: {
        type: String,
        autoValue() {},
      },
      field2: {
        type: String,
        autoValue() {},
      },
      field3: {
        type: Number,
        autoValue() {},
      },
      nested: Object,
      'nested.field1': {
        type: String,
        autoValue() {},
      },
      'nested.field2': {
        type: String,
        autoValue() {},
      },
      'nested.field3': {
        type: String,
        autoValue() {},
      },
      'nested.field4': {
        type: String,
        defaultValue: 'test',
      },
      field4: {
        type: Number,
        autoValue() {},
      },
      field5: {
        type: Number,
        autoValue() {},
      },
      field6: {
        type: String,
        autoValue() {},
      },
      field7: {
        type: String,
        autoValue() {},
      },
    });

    const autoValueFunctions = schema.autoValueFunctions();
    const sorted = sortAutoValueFunctions(autoValueFunctions);

    const FIELD_COUNT = 7;
    const NESTED_FIELD_COUNT = 4;
    // expecting: field1, field2, ..., field7, nested.field1, ... nested.field4
    const fieldOrder = sorted.map(({ fieldName }) => fieldName);
    for (let i = 0; i < FIELD_COUNT; ++i) {
      expect(fieldOrder[i]).to.equal(`field${i + 1}`);
    }
    for (let i = FIELD_COUNT; i < FIELD_COUNT + NESTED_FIELD_COUNT; ++i) {
      expect(fieldOrder[i]).to.equal(`nested.field${i - FIELD_COUNT + 1}`);
    }
  });
});
