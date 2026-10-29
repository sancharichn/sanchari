import { z } from "zod";

export const PAYMENT_IMPORT_HEADERS = ["Registration ID", "Email", "Traveller", "Amount INR", "Entry type", "Method", "Reference", "Received date", "Note"] as const;
export type PaymentImportRawRow = Record<string, string>;

const aliases: Record<string, string> = {
  registrationid: "registrationId", registration: "registrationId", email: "email", memberemail: "email",
  traveller: "traveller", traveler: "traveller", participant: "traveller", amount: "amount", amountinr: "amount",
  entrytype: "kind", type: "kind", kind: "kind", method: "method", paymentmethod: "method", reference: "reference",
  transactionreference: "reference", receiveddate: "receivedDate", date: "receivedDate", note: "note", notes: "note",
};

export const importedPaymentSchema = z.object({
  registrationId: z.string().trim().optional().default(""),
  email: z.string().trim().toLowerCase().optional().default(""),
  traveller: z.string().trim().min(2, "Traveller name is required."),
  amount: z.string().trim().regex(/^\d{1,7}(\.\d{1,2})?$/, "Use a positive INR amount with up to 2 decimals."),
  kind: z.string().trim().toUpperCase().transform((value) => value || "RECEIPT").pipe(z.enum(["RECEIPT", "REFUND"])),
  method: z.string().trim().toUpperCase().pipe(z.enum(["UPI", "BANK", "CASH", "OTHER"])),
  reference: z.string().trim().max(120).optional().default(""),
  receivedDate: z.string().trim().refine(validYmd, "Use a valid YYYY-MM-DD received date."),
  note: z.string().trim().max(500).optional().default(""),
}).refine((row) => row.registrationId || row.email, { path: ["registrationId"], message: "Add Registration ID or Email." });

function headerKey(value: string) { return value.toLowerCase().replace(/[^a-z0-9]/g, ""); }

function validYmd(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function normalizePaymentRows(headers: string[], values: string[][]): PaymentImportRawRow[] {
  const keys = headers.map((header) => aliases[headerKey(header)] ?? "");
  return values.filter((row) => row.some((cell) => cell.trim())).map((row) => Object.fromEntries(keys.flatMap((key, index) => key ? [[key, row[index]?.trim() ?? ""]] : [])));
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted && char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (!quoted && char === ",") { row.push(cell); cell = ""; }
    else if (!quoted && (char === "\n" || char === "\r")) { if (char === "\r" && text[index + 1] === "\n") index += 1; row.push(cell); if (row.some((value) => value.length)) rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  row.push(cell); if (row.some((value) => value.length)) rows.push(row);
  return rows;
}
