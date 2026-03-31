import { formatInTimeZone } from "date-fns-tz";
import { parseFrontmatterDate } from "./parseDate";

const dateFormat = (date) => {
  return formatInTimeZone(
    parseFrontmatterDate(date),
    "America/New_York",
    "dd MMM yyyy"
  );
};

export default dateFormat;
