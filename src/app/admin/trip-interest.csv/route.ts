import { getAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const HEADERS = [
  "Journey ID", "Journey", "Planning status", "Proposed year", "Proposed route", "Interest ID", "Submitted", "Last updated",
  "Member ID", "Member name", "Email", "Phone", "WhatsApp", "WhatsApp permission", "Home area", "Travel pace", "Preferred trip kinds",
  "Potential travellers", "Planning note", "Prior qualifying events attended", "Profile blood group", "Profile emergency contact", "Saved family profiles (not confirmed travellers)",
];

function leadAttended(attendance: unknown, checkedInCount: number) {
  return Array.isArray(attendance) ? attendance[0] === true : checkedInCount > 0;
}

export async function GET(request: Request) {
  if (!await getAdmin()) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  const tripId = new URL(request.url).searchParams.get("tripId");
  const trip = tripId ? await prisma.trip.findUnique({ where: { id: tripId }, select: { id: true, title: true, location: true, startDate: true, interestOpen: true } }) : null;
  if (tripId && (!trip || !trip.interestOpen)) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  const journey = trip ? `trip:${trip.id}` : "sri-lanka-2027";
  const journeyTitle = trip?.title ?? "International Trip to Sri Lanka 2027";
  const proposedYear = trip ? String(trip.startDate.getFullYear()) : "2027";
  const proposedRoute = trip?.location ?? "Sigiriya · Kandy · Ella · Southern coast";
  const interests = await prisma.tripInterest.findMany({
    where: { journey, user: { deletedAt: null } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, partySize: true, note: true, createdAt: true, updatedAt: true,
      user: { select: {
        id: true, name: true, email: true, phone: true, whatsappNumber: true, whatsappOptIn: true, homeArea: true, travelPace: true, preferredTripKinds: true, bloodGroup: true, emergencyContact: true,
        familyMembers: { orderBy: { createdAt: "asc" }, select: { name: true, relationship: true, birthdayMonth: true, birthdayDay: true } },
        registrations: { where: { trip: { kind: { in: ["MEETUP", "DAY_TRIP"] } } }, select: { checkedInCount: true, attendance: true, trip: { select: { startDate: true } } } },
      } },
    },
  });
  const now = new Date();
  const rows = interests.map((entry) => {
    const qualifying = entry.user.registrations.filter((registration) => registration.trip.startDate <= now && leadAttended(registration.attendance, registration.checkedInCount)).length;
    const family = entry.user.familyMembers.map((member) => `${member.name} (${member.relationship}${member.birthdayMonth && member.birthdayDay ? `; birthday ${member.birthdayDay}/${member.birthdayMonth}` : ""})`).join("; ");
    return [
      journey, journeyTitle, "PLANNING INTEREST — NOT A BOOKING", proposedYear, proposedRoute, entry.id, formatDateTime(entry.createdAt), formatDateTime(entry.updatedAt),
      entry.user.id, entry.user.name ?? "Member", entry.user.email, entry.user.phone ?? "", entry.user.whatsappNumber ?? "", entry.user.whatsappOptIn ? "Yes" : "No", entry.user.homeArea ?? "", entry.user.travelPace ?? "", entry.user.preferredTripKinds.join("; "),
      entry.partySize, entry.note ?? "", qualifying, entry.user.bloodGroup ?? "", entry.user.emergencyContact ?? "", family,
    ];
  });
  const filename = `${journeyTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-interest.csv`;
  return new Response(toCsv([HEADERS, ...rows]), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
