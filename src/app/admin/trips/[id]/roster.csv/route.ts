import { getAdminTrip } from "@/lib/admin-queries";
import { toCsv, slugify } from "@/lib/csv";
import { FAMILY_ROSTER_HEADERS, registrationCsvRows } from "@/lib/family-roster";
import { getAdmin } from "@/lib/session";
import { splitRoster } from "@/lib/trips";
import { expectedPayment, travellerCharges } from "@/lib/operations";
import { formatDateRange, toDateInputValue, toPaise } from "@/lib/format";

export const dynamic = "force-dynamic";

/** The trip roster with contact and emergency details, for the organiser only. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  if (!(await getAdmin())) return notFound();
  const trip = await getAdminTrip(params.id);
  if (!trip) return notFound();

  const { confirmed, waitlisted } = splitRoster(trip.registrations, trip.maxCapacity);
  const totalReceived = trip.paymentEvents.reduce((sum, event) => sum + Number(event.amount), 0);
  const totalExpenses = trip.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const tripHeaders = ["Trip ID", "Trip title", "Trip slug", "Trip kind", "Trip status", "Location", "Dates", "Start date", "End date", "Transport", "Maximum capacity", "Confirmed travellers", "Waitlisted travellers", "Minimum prior events", "Adult price INR", "Age 5–12 price INR", "Under-5 price INR", "Base estimate INR", "Description", "Itinerary", "WhatsApp group", "Net funds received INR", "Expenses INR", "Funds less expenses INR", "Feedback responses", "Open tasks", "Open incidents"];
  const tripValues = [trip.id, trip.title, trip.slug ?? "", trip.kind, trip.status, trip.location, formatDateRange(trip.startDate, trip.endDate), toDateInputValue(trip.startDate), toDateInputValue(trip.endDate), trip.transportMode, trip.maxCapacity, confirmed.reduce((sum, registration) => sum + registration.partySize, 0), waitlisted.reduce((sum, registration) => sum + registration.partySize, 0), trip.minimumPriorEvents, trip.adultBudgetEst?.toString() ?? "", trip.childBudgetEst?.toString() ?? "", trip.under5BudgetEst?.toString() ?? "", trip.budgetEst?.toString() ?? "", trip.description, trip.itinerary ? JSON.stringify(trip.itinerary) : "", trip.whatsappGroupInviteUrl ?? "", totalReceived, totalExpenses, totalReceived - totalExpenses, trip._count.responses, trip.tasks.filter((task) => !task.completedAt).length, trip.incidents.filter((incident) => !incident.closedAt).length];
  const fundHeaders = ["Traveller expected INR", "Traveller allocated INR", "Traveller balance INR", "Booking expected INR", "Booking net received INR", "Booking balance INR", "Latest method", "Latest reference", "Latest received date"];
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
      return [...tripValues, ...row, charge ? charge.expected / 100 : "", allocated / 100, charge ? (charge.expected - allocated) / 100 : "", expected === null ? "" : expected / 100, received / 100, expected === null ? "" : (expected - received) / 100, latest?.method ?? "", latest?.reference ?? "", latest?.receivedAt ? latest.receivedAt.toISOString().slice(0, 10) : ""];
    });
  });

  if (!rows.length) {
    const emptyRoster = Array<string>(FAMILY_ROSTER_HEADERS.length).fill("");
    emptyRoster[0] = "No registrations";
    rows.push([...tripValues, ...emptyRoster, ...Array<string>(fundHeaders.length).fill("")]);
  }

  const csv = toCsv([
    [...tripHeaders, ...FAMILY_ROSTER_HEADERS, ...fundHeaders],
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
