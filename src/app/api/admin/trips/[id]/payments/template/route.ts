import { getAdminTrip } from "@/lib/admin-queries";
import { toCsv, slugify } from "@/lib/csv";
import { PAYMENT_IMPORT_HEADERS } from "@/lib/payment-import";
import { getAdmin } from "@/lib/session";
import { splitRoster } from "@/lib/trips";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!await getAdmin("finance")) return new Response("Not found", { status: 404 });
  const trip = await getAdminTrip(params.id);
  if (!trip || trip.kind === "MEETUP") return new Response("Not found", { status: 404 });
  const rows = splitRoster(trip.registrations, trip.maxCapacity).confirmed.flatMap((registration) => {
    const lead = registration.user.name ?? registration.user.email;
    return [lead, ...((Array.isArray(registration.companions) ? registration.companions : []) as Array<{ name?: string }>).map((person) => person.name ?? "")].map((traveller) => [registration.id, registration.user.email, traveller, "", "RECEIPT", "UPI", "", new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }), ""]);
  });
  return new Response(toCsv([Array.from(PAYMENT_IMPORT_HEADERS), ...rows]), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${slugify(trip.title)}-fund-import-template.csv"`, "Cache-Control": "no-store" } });
}
