export function birthdayName(name: string | null, fallback: string) {
  return (name ?? fallback).trim().split(/\s+/)[0] || fallback;
}

export function birthdayDateLabel(month: number | null, day: number | null) {
  if (!month || !day) return null;
  return new Intl.DateTimeFormat("en-IN", { month: "long", day: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(2020, month - 1, day));
}
