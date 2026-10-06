import { getAdminTrip } from "@/lib/admin-queries";
import { toCsv, slugify } from "@/lib/csv";
import { FAMILY_ROSTER_HEADERS, registrationCsvRows } from "@/lib/family-roster";
import { getAdmin } from "@/lib/session";
import { splitRoster } from "@/lib/trips";

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
  ].flatMap(({ r, place }) => registrationCsvRows(r, place));

  const csv = toCsv([
    FAMILY_ROSTER_HEADERS,
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
