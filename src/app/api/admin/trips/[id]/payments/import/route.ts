import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { formatDate } from "@/lib/format";
import { expectedPayment, ledgerStatus, travellerCharges } from "@/lib/operations";
import { importedPaymentSchema, normalizePaymentRows, parseCsv } from "@/lib/payment-import";
import { auditedTransaction, prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/session";
import { toPaise } from "@/lib/format";
import { splitRoster } from "@/lib/trips";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const MAX_BYTES = 2_000_000;
const MAX_ROWS = 500;

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  if (typeof value === "object") {
    if ("text" in value) return String(value.text);
    if ("result" in value && value.result !== undefined) return String(value.result);
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
  }
  return String(value);
}

async function rowsFromFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (file.name.toLowerCase().endsWith(".csv")) {
    const rows = parseCsv(buffer.toString("utf8").replace(/^\uFEFF/, ""));
    if (!rows.length) return [];
    return normalizePaymentRows(rows[0], rows.slice(1));
  }
  if (!/\.xlsx$/i.test(file.name)) throw new Error("Upload a .xlsx or .csv file.");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];
  const rows: string[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => rows.push(Array.from({ length: row.cellCount }, (_, index) => cellText(row.getCell(index + 1).value))));
  if (!rows.length) return [];
  return normalizePaymentRows(rows[0], rows.slice(1));
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdmin("finance");
  if (!admin) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const file = form.get("file");
  const mode = form.get("mode") === "commit" ? "commit" : "preview";
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a spreadsheet." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Keep the spreadsheet under 2 MB." }, { status: 413 });
  let rawRows;
  try { rawRows = await rowsFromFile(file); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "The spreadsheet could not be read." }, { status: 400 }); }
  if (!rawRows.length) return NextResponse.json({ error: "The spreadsheet has no payment rows." }, { status: 400 });
  if (rawRows.length > MAX_ROWS) return NextResponse.json({ error: `Import up to ${MAX_ROWS} rows at a time.` }, { status: 400 });

  const trip = await prisma.trip.findUnique({ where: { id: params.id }, include: { registrations: { include: { user: { select: { name: true, email: true } }, paymentEvents: true } } } });
  if (!trip || trip.kind === "MEETUP") return new Response("Not found", { status: 404 });
  const byId = new Map(trip.registrations.map((registration) => [registration.id, registration]));
  const byEmail = new Map(trip.registrations.map((registration) => [registration.user.email.toLowerCase(), registration]));
  const confirmedIds = new Set(splitRoster(trip.registrations, trip.maxCapacity).confirmed.map((registration) => registration.id));
  const runningNet = new Map(trip.registrations.map((registration) => [registration.id, registration.paymentEvents.reduce((sum, event) => sum + toPaise(event.amount), 0)]));
  const runningTravellerNet = new Map<string, number>(trip.registrations.flatMap((registration) => travellerCharges(trip, registration.user.name ?? registration.user.email, registration.companions, registration.pricingSnapshot).map((traveller) => [`${registration.id}:${traveller.key}`, registration.paymentEvents.filter((event) => event.travellerKey === traveller.key).reduce((sum, event) => sum + toPaise(event.amount), 0)] as const)));
  const prepared = rawRows.map((raw, index) => {
    const parsed = importedPaymentSchema.safeParse(raw);
    if (!parsed.success) return { row: index + 2, ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid row.", raw };
    const value = parsed.data;
    const registration = value.registrationId ? byId.get(value.registrationId) : byEmail.get(value.email);
    if (!registration) return { row: index + 2, ok: false as const, error: "Registration not found in this trip.", raw };
    if (!confirmedIds.has(registration.id)) return { row: index + 2, ok: false as const, error: "Funds can only be imported for confirmed bookings.", raw };
    const travellers = travellerCharges(trip, registration.user.name ?? registration.user.email, registration.companions, registration.pricingSnapshot);
    const traveller = travellers.find((person) => person.name.trim().toLowerCase() === value.traveller.toLowerCase());
    if (!traveller) return { row: index + 2, ok: false as const, error: "Traveller name does not match this registration.", raw };
    const signedPaise = toPaise(value.amount) * (value.kind === "REFUND" ? -1 : 1);
    const nextNet = (runningNet.get(registration.id) ?? 0) + signedPaise;
    if (nextNet < 0) return { row: index + 2, ok: false as const, error: "Refund exceeds funds recorded for this booking.", raw };
    const travellerLedgerKey = `${registration.id}:${traveller.key}`;
    const nextTravellerNet = (runningTravellerNet.get(travellerLedgerKey) ?? 0) + signedPaise;
    if (nextTravellerNet < 0) return { row: index + 2, ok: false as const, error: "Refund exceeds funds allocated to this traveller.", raw };
    runningNet.set(registration.id, nextNet);
    runningTravellerNet.set(travellerLedgerKey, nextTravellerNet);
    return { row: index + 2, ok: true as const, registration, traveller, value, signedPaise, nextNet };
  });
  const invalid = prepared.filter((row) => !row.ok);
  const preview = prepared.map((row) => row.ok ? { row: row.row, member: row.registration.user.name ?? row.registration.user.email, traveller: row.traveller.name, amount: row.signedPaise / 100, method: row.value.method, date: row.value.receivedDate, status: "Ready" } : { row: row.row, member: row.raw.email || row.raw.registrationId || "—", traveller: row.raw.traveller || "—", amount: row.raw.amount || "—", method: row.raw.method || "—", date: row.raw.receivedDate || "—", status: row.error });
  if (mode === "preview" || invalid.length) return NextResponse.json({ ok: invalid.length === 0, rows: preview, valid: prepared.length - invalid.length, invalid: invalid.length }, { status: invalid.length ? 422 : 200 });

  const checksum = createHash("sha256").update(Buffer.from(await file.arrayBuffer())).digest("hex");
  try {
    await auditedTransaction(admin.id, async () => {
      const existing = await prisma.paymentImportBatch.findUnique({ where: { tripId_checksum: { tripId: trip.id, checksum } } });
      if (existing) throw new Error("DUPLICATE_IMPORT");
      const batch = await prisma.paymentImportBatch.create({ data: { tripId: trip.id, importedById: admin.id, fileName: file.name.slice(0, 200), checksum, rowCount: prepared.length, importedCount: prepared.length } });
      for (const row of prepared) if (row.ok) await prisma.paymentEvent.create({ data: { tripId: trip.id, registrationId: row.registration.id, recordedById: admin.id, amount: new Prisma.Decimal(row.value.amount).mul(row.value.kind === "REFUND" ? -1 : 1), method: row.value.method, reference: row.value.reference || null, note: row.value.note || null, travellerKey: row.traveller.key, travellerName: row.traveller.name, source: "IMPORT", receivedAt: new Date(`${row.value.receivedDate}T12:00:00+05:30`), importBatchId: batch.id } });
      for (const registration of trip.registrations) {
        const net = runningNet.get(registration.id) ?? 0;
        const hasRefund = prepared.some((row) => row.ok && row.registration.id === registration.id && row.value.kind === "REFUND");
        await prisma.tripRegistration.update({ where: { id: registration.id }, data: { paymentStatus: ledgerStatus(net, expectedPayment(trip, registration.companions, registration.pricingSnapshot), hasRefund) } });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_IMPORT") return NextResponse.json({ error: "This exact spreadsheet was already imported for this trip." }, { status: 409 });
    return NextResponse.json({ error: "The spreadsheet passed preview but could not be committed. Nothing was imported." }, { status: 500 });
  }
  revalidatePath(`/admin/trips/${trip.id}`);
  return NextResponse.json({ ok: true, message: `${prepared.length} ledger entries imported from ${file.name}.`, rows: preview, importedAt: formatDate(new Date()) });
}
