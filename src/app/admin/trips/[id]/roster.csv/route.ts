import { getAdminTrip } from "@/lib/admin-queries";
import { toCsv, slugify } from "@/lib/csv";
import { formatDateTime } from "@/lib/format";
import { getAdmin } from "@/lib/session";
import { PAYMENT_LABEL, splitRoster } from "@/lib/trips";

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
  ].map(({ r, place }) => [
    place,
    r.user.name ?? "",
    r.user.email,
    r.user.phone ?? "",
    r.user.emergencyContact ?? "",
    r.user.bloodGroup ?? "",
    r.vehicleDetails ?? "Needs a seat",
    PAYMENT_LABEL[r.paymentStatus],
    r.gearChecked ? "Yes" : "No",
    formatDateTime(r.createdAt),
  ]);

  const csv = toCsv([
    ["Place", "Name", "Email", "Phone", "Emergency contact", "Blood group", "Getting there", "Payment", "Gear checked", "Registered"],
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
