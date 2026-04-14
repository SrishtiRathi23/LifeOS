import dayjs from "dayjs";

export function isoDay(date = dayjs()) {
  return date.startOf("day").toISOString();
}

export function prettyDate(date: string | Date) {
  return dayjs(date).format("dddd, D MMMM YYYY");
}

export function prettyShortDate(date: string | Date) {
  return dayjs(date).format("DD MMM");
}
