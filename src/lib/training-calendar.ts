const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function parseISODate(value: string) {
  if (!isoDatePattern.test(value)) throw new Error("Invalid ISO date");
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toISODate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function addDaysISO(value: string, days: number) {
  const date = parseISODate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return toISODate(date);
}

export function startOfWeekISO(value: string) {
  const date = parseISODate(value);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return toISODate(date);
}

export function getWeekDates(value: string) {
  const monday = startOfWeekISO(value);
  return Array.from({ length: 7 }, (_, index) => addDaysISO(monday, index));
}
