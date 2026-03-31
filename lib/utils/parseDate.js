import { endOfDay, isValid, parseISO } from "date-fns";

const createUtcDate = (year, month, day) =>
  new Date(Date.UTC(year, month - 1, day, 12));

export const parseFrontmatterDate = (value) => {
  if (!value) {
    return new Date();
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    let dateParts = trimmedValue.match(/^(\d{2})-(\d{2})-(\d{4})$/);

    if (dateParts) {
      const [, day, month, year] = dateParts;
      return createUtcDate(Number(year), Number(month), Number(day));
    }

    dateParts = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (dateParts) {
      const [, year, month, day] = dateParts;
      return createUtcDate(Number(year), Number(month), Number(day));
    }

    const isoDate = parseISO(trimmedValue);

    if (isValid(isoDate)) {
      return isoDate;
    }
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
};

export const isPublishedOnOrBeforeToday = (value) => {
  return endOfDay(parseFrontmatterDate(value)) <= endOfDay(new Date());
};
