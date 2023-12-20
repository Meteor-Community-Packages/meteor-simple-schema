/**
 * Given a Date instance, returns a date string of the format YYYY-MM-DD
 */
export default function dateToDateString(date) {
  let m = (date.getUTCMonth() + 1);
  if (m < 10) m = `0${m}`;
  let d = date.getUTCDate();
  if (d < 10) d = `0${d}`;
  return `${date.getUTCFullYear()}-${m}-${d}`;
}
