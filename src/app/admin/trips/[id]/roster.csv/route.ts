import { getAdminTrip } from "@/lib/admin-queries";
import { toCsv, slugify } from "@/lib/csv";
import { FAMILY_ROSTER_HEADERS, registrationCsvRows } from "@/lib/family-roster";
import { getAdmin } from "@/lib/session";
import { splitRoster } from "@/lib/trips";
import { expectedPayment, travellerCharges } from "@/lib/operations";
import { toPaise } from "@/lib/format";

export const dynamic = "force-dynamic";

/** The trip roster with contact and emergency details, for the organiser only. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  if (!(await getAdmin())) return notFound();
  const trip = await getAdminTrip(params.id);
  if (!trip) return notFound();

  const { confirmed, waitlisted } = splitRoster(trip.registrations, trip.maxCapacity);
  const rows = [
    ...confirmed.map((r) => ({ r, place: "Seat" })),
    ...waitlisted.map((r, i) => ({ r, place: `Waitlist ${i + 1}` })),
  ].flatMap(({ r, place }) => {
    const base = registrationCsvRows(r, place);
    const charges = travellerCharges(trip, r.user.name ?? r.user.email, r.companions, r.pricingSnapshot);
    const events = trip.paymentEvents.filter((event) => event.registrationId === r.id);
    const received = events.reduce((sum, event) => sum + toPaise(event.amount), 0);
    const expected = expectedPayment(trip, r.companions, r.pricingSnapshot);
    const latest = events[0];
    return base.map((row, index) => {
      const charge = charges[index];
      const allocated = charge ? events.filter((event) => event.travellerKey === charge.key).reduce((sum, event) => sum + toPaise(event.amount), 0) : 0;
      return [...row, charge ? charge.expected / 100 : "", allocated / 100, charge ? (charge.expected - allocated) / 100 : "", expected === null ? "" : expected / 100, received / 100, expected === null ? "" : (expected - received) / 100, latest?.method ?? "", latest?.reference ?? "", latest?.receivedAt ? latest.receivedAt.toISOString().slice(0, 10) : ""];
    });
  });

  const csv = toCsv([
    [...FAMILY_ROSTER_HEADERS, "Traveller expected INR", "Traveller allocated INR", "Traveller balance INR", "Booking expected INR", "Booking net received INR", "Booking balance INR", "Latest method", "Latest reference", "Latest received date"],
    ...rows,
  ]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slugify(trip.title)}-roster.csv"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
