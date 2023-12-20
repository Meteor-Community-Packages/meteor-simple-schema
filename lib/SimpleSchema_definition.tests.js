/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai';
import { SimpleSchema, schemaDefinitionOptions } from './SimpleSchema';

describe('SimpleSchema - Extend Schema Definition', function () {
  it('throws an error when the schema definition includes an unrecognized key', function () {
    expect(() => {
      const schema = new SimpleSchema({ // eslint-disable-line no-unused-vars
        name: {
          type: String,
          unique: true,
        },
      });
    }).to.throw();
  });

  it('does not throw an error when the schema definition includes a registered key', function () {
    SimpleSchema.extendOptions({ unique: true });

    expect(() => {
      const schema = new SimpleSchema({ // eslint-disable-line no-unused-vars
        name: {
          type: String,
          unique: true,
        },
      });
    }).not.to.throw();

    // Reset
    schemaDefinitionOptions.splice(schemaDefinitionOptions.indexOf('unique'), 1);
  });
});
