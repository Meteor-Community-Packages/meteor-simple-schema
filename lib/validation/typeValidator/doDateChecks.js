import { SimpleSchema } from '../../SimpleSchema';
import { dateToDateString } from '../../utility';

export default function doDateChecks(def, keyValue) {
  // Is it an invalid date?
  if (isNaN(keyValue.getTime())) return { type: SimpleSchema.ErrorTypes.BAD_DATE };

  // Is it earlier than the minimum date?
  if (def.min && typeof def.min.getTime === 'function' && def.min.getTime() > keyValue.getTime()) {
    return { type: SimpleSchema.ErrorTypes.MIN_DATE, min: dateToDateString(def.min) };
  }

  // Is it later than the maximum date?
  if (def.max && typeof def.max.getTime === 'function' && def.max.getTime() < keyValue.getTime()) {
    return { type: SimpleSchema.ErrorTypes.MAX_DATE, max: dateToDateString(def.max) };
  }
}
