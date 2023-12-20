import { SimpleSchema } from '../../SimpleSchema';
import doDateChecks from './doDateChecks';
import doNumberChecks from './doNumberChecks';
import doStringChecks from './doStringChecks';
import doArrayChecks from './doArrayChecks';

export default function typeValidator() {
  if (!this.valueShouldBeChecked) return;

  const def = this.definition;
  const expectedType = def.type;
  const keyValue = this.value;
  const op = this.operator;

  if (expectedType === String) return doStringChecks(def, keyValue);
  if (expectedType === Number) return doNumberChecks(def, keyValue, op, false);
  if (expectedType === SimpleSchema.Integer) return doNumberChecks(def, keyValue, op, true);

  if (expectedType === Boolean) {
    // Is it a boolean?
    if (typeof keyValue === 'boolean') return;
    return { type: SimpleSchema.ErrorTypes.EXPECTED_TYPE, dataType: 'Boolean' };
  }

  if (expectedType === Object || SimpleSchema.isSimpleSchema(expectedType)) {
    // Is it an object?
    if (
      keyValue === Object(keyValue)
      && typeof keyValue[Symbol.iterator] !== 'function'
      && !(keyValue instanceof Date)
    ) return;
    return { type: SimpleSchema.ErrorTypes.EXPECTED_TYPE, dataType: 'Object' };
  }

  if (expectedType === Array) return doArrayChecks(def, keyValue);

  if (expectedType instanceof Function) {
    // Generic constructor checks
    if (!(keyValue instanceof expectedType)) {
      // https://docs.mongodb.com/manual/reference/operator/update/currentDate/
      const dateTypeIsOkay = expectedType === Date
        && op === '$currentDate'
        && (keyValue === true || JSON.stringify(keyValue) === '{"$type":"date"}');

      if (expectedType !== Date || !dateTypeIsOkay) {
        return {
          type: SimpleSchema.ErrorTypes.EXPECTED_TYPE,
          dataType: expectedType.name,
        };
      }
    }

    // Date checks
    if (expectedType === Date) {
      // https://docs.mongodb.com/manual/reference/operator/update/currentDate/
      if (op === '$currentDate') {
        return doDateChecks(def, new Date());
      }
      return doDateChecks(def, keyValue);
    }
  }
}
