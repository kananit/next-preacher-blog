import { formatInTimeZone } from "date-fns-tz";
import { ru } from "date-fns/locale";
import { parseFrontmatterDate } from "./parseDate";

const dateFormat = (date) => {
  return formatInTimeZone(
    parseFrontmatterDate(date),
    "Europe/Moscow",
    "d MMM yyyy",
    { locale: ru }
  );
};

export default dateFormat;
