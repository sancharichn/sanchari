import { getAdmin } from "@/lib/session";
import { getAdminTrip } from "@/lib/admin-queries";
import { toCsv, slugify } from "@/lib/csv";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!await getAdmin()) return new Response("Not found", { status: 404 });
  const trip = await getAdminTrip(params.id);
  if (!trip) return new Response("Not found", { status: 404 });
  return new Response(toCsv([["Date", "Member", "Registration", "Amount INR", "Method", "Reference", "Notes", "Recorded by"], ...trip.paymentEvents.map((p) => [formatDateTime(p.createdAt), p.registration.user.name ?? p.registration.user.email, p.registrationId, p.amount.toString(), p.method, p.reference ?? "", p.note ?? "", p.recordedBy.name ?? p.recordedBy.email])]), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${slugify(trip.title)}-payments.csv"`, "Cache-Control": "no-store" } });
}
