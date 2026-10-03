/** CSV that opens cleanly in Excel and Google Sheets, without formula injection. */

function cell(value: string | number | boolean | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  // A leading =, +, - or @ would be run as a formula by spreadsheet apps.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Array<Array<string | number | boolean | null | undefined>>): string {
  // The byte-order mark makes Excel read UTF-8 (₹ and non-English names) correctly.
  return `﻿${rows.map((row) => row.map(cell).join(",")).join("\r\n")}\r\n`;
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .slice(0, 60) || "trip"
  );
}
