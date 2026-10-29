export type BirthdayWindow = "DAY" | "WEEK" | "MONTH" | "LATER";

function indiaDateParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

function validBirthdayDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

export function birthdaySchedule(month: number, day: number, now = new Date()) {
  const today = indiaDateParts(now);
  const todayDate = new Date(Date.UTC(today.year, today.month - 1, today.day));
  let year = today.year;
  let next = validBirthdayDate(year, month, day);
  while (!next || next < todayDate) {
    year += 1;
    next = validBirthdayDate(year, month, day);
  }
  const daysUntil = Math.round((next.getTime() - todayDate.getTime()) / 86_400_000);
  const window: BirthdayWindow = daysUntil <= 1 ? "DAY" : daysUntil <= 7 ? "WEEK" : daysUntil <= 31 ? "MONTH" : "LATER";
  return { daysUntil, window, year, date: next };
}

export function birthdayTimingLabel(daysUntil: number) {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `In ${daysUntil} days`;
}

export function birthdayDateLabel(month: number, day: number) {
  return new Intl.DateTimeFormat("en-IN", { month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(2000, month - 1, day)));
}
