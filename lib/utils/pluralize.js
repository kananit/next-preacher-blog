/**
 * Русское склонение существительных по числу.
 * @example pluralize(1, ["запись", "записи", "записей"]) // "запись"
 * @example pluralize(3, ["запись", "записи", "записей"]) // "записи"
 * @example pluralize(7, ["запись", "записи", "записей"]) // "записей"
 */
const pluralize = (count, [one, few, many]) => {
  if (count === 0) return many;
  if (count === 1) return one;
  if (count < 5) return few;
  return many;
};

export default pluralize;
