/** Formatting for dates (always shown in India time) and rupee amounts. */

export const TIME_ZONE = "Asia/Kolkata";

type DateParts = { day: number; month: string; year: number; ymd: string };

function partsOf(date: Date): DateParts {
  const fmt = new Intl.DateTimeFormat("en-IN", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return { day: Number(parts.day), month: String(parts.month).replace(/\.$/, ""), year: Number(parts.year), ymd };
}

/** "7–9 Nov 2026", "30 Nov – 2 Dec 2026", "28 Dec 2026 – 2 Jan 2027", or "7 Nov 2026". */
export function formatDateRange(start: Date, end: Date): string {
  const s = partsOf(start);
  const e = partsOf(end);
  if (s.ymd === e.ymd) return `${s.day} ${s.month} ${s.year}`;
  if (s.year === e.year && s.month === e.month) return `${s.day}–${e.day} ${s.month} ${s.year}`;
  if (s.year === e.year) return `${s.day} ${s.month} – ${e.day} ${e.month} ${s.year}`;
  return `${s.day} ${s.month} ${s.year} – ${e.day} ${e.month} ${e.year}`;
}

/** Split form for the departure board: big day numbers, then month and year. */
export function dateBlock(start: Date, end: Date): { days: string; label: string } {
  const s = partsOf(start);
  const e = partsOf(end);
  if (s.ymd === e.ymd) return { days: String(s.day), label: `${s.month} ${s.year}` };
  const days = `${s.day}–${e.day}`;
  if (s.month === e.month && s.year === e.year) return { days, label: `${s.month} ${s.year}` };
  if (s.year === e.year) return { days, label: `${s.month}–${e.month} ${s.year}` };
  return { days, label: `${s.month} ${s.year} – ${e.month} ${e.year}` };
}

export function formatDate(date: Date): string {
  const p = partsOf(date);
  return `${p.day} ${p.month} ${p.year}`;
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/** Number of calendar days a trip spans in India time, counting both ends. */
export function tripDays(start: Date, end: Date): number {
  const s = Date.parse(`${partsOf(start).ymd}T00:00:00Z`);
  const e = Date.parse(`${partsOf(end).ymd}T00:00:00Z`);
  return Math.max(1, Math.round((e - s) / 86_400_000) + 1);
}

export function durationLabel(start: Date, end: Date): string {
  const days = tripDays(start, end);
  return days === 1 ? "Day trip" : `${days} days`;
}

/** "YYYY-MM-DD" in India time, for <input type="date">. */
export function toDateInputValue(date: Date): string {
  return partsOf(date).ymd;
}

/** Midnight India time on the given "YYYY-MM-DD". */
export function fromDateInputValue(value: string): Date {
  return new Date(`${value}T00:00:00+05:30`);
}

const inrWhole = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inrExact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹12,500 — paise are shown only when there are any. */
export function formatINR(value: number | string | { toString(): string }): string {
  const n = typeof value === "number" ? value : Number(value.toString());
  if (!Number.isFinite(n)) return "—";
  return Number.isInteger(Math.round(n * 100) / 100) ? inrWhole.format(n) : inrExact.format(n);
}

/** Rupees as a decimal string → integer paise, without floating-point drift. */
export function toPaise(value: number | string | { toString(): string }): number {
  const text = (typeof value === "number" ? value.toFixed(2) : value.toString()).trim();
  const negative = text.startsWith("-");
  const [whole, fraction = ""] = text.replace(/^-/, "").split(".");
  const paise = Number(whole || "0") * 100 + Number((fraction + "00").slice(0, 2));
  return negative ? -paise : paise;
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function firstName(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  return trimmed ? trimmed.split(/\s+/)[0] : "A member";
}
