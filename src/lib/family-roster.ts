import type { PaymentStatus } from "@prisma/client";
import { readCompanions } from "./family";
import { formatDateTime } from "./format";
import { PAYMENT_LABEL } from "./trips";

export const FAMILY_ROSTER_HEADERS = [
  "Place", "Booking approval", "Approved", "Name", "Email", "Phone", "WhatsApp", "WhatsApp permission", "Home area", "Travel pace", "Preferred trip kinds", "Emergency contact", "Blood group", "Getting there", "Car pool", "Car-pool location", "Car-pool seats", "Payment", "Gear checked", "Registered", "Agreed to guidelines (18 or over)",
  "Registration ID", "Member ID", "Member since", "Registering adult", "Age", "Relationship", "Price band", "Party size", "Family permission", "Parental supervision confirmed", "Party checked in", "Traveller attended", "Ride arranged",
];

type Registration = {
  checkedInCount?: number; carpoolMatched?: boolean;
  approvalStatus?: string; approvedAt?: Date | null; attendance?: unknown;
  id: string; partySize: number; companions: unknown; paymentStatus: PaymentStatus; carpoolChoice: string; carpoolLocation: string | null; carpoolSeats: number | null;
  gearChecked: boolean; vehicleDetails: string | null; createdAt: Date;
  agreedToGuidelinesAt: Date | null; familyConsentAt: Date | null; parentalConsentAt: Date | null;
  user: { id?: string; name: string | null; email: string; phone: string | null; whatsappNumber?: string | null; whatsappOptIn?: boolean; homeArea?: string | null; travelPace?: string | null; preferredTripKinds?: string[]; createdAt?: Date; emergencyContact: string | null; bloodGroup: string | null };
};

/** One line per traveller, linked to their shared registration and adult contact. */
export function registrationCsvRows(r: Registration, place: string) {
  const lead = r.user.name ?? r.user.email;
  const people = [
    { name: lead, age: "", relationship: "Registering adult", bloodGroup: r.user.bloodGroup, child: false, lead: true },
    ...readCompanions(r.companions).map((person) => ({ ...person, child: person.age < 13, lead: false })),
  ];
  const attendance = Array.isArray(r.attendance) ? r.attendance : null;
  return people.map((person, index) => [
    place, r.approvalStatus ?? "APPROVED", r.approvedAt ? formatDateTime(r.approvedAt) : "", person.name, r.user.email, r.user.phone ?? "", r.user.whatsappNumber ?? "", r.user.whatsappOptIn ? "Yes" : "No", r.user.homeArea ?? "", r.user.travelPace ?? "", r.user.preferredTripKinds?.join("; ") ?? "", r.user.emergencyContact ?? "", person.bloodGroup ?? "",
    r.vehicleDetails ?? "Needs a seat", r.carpoolChoice === "NONE" ? "No car pool" : r.carpoolChoice === "OFFER_RIDE" ? "Offers ride" : "Needs ride", r.carpoolLocation ?? "", r.carpoolSeats ?? "", PAYMENT_LABEL[r.paymentStatus], r.gearChecked ? "Yes" : "No", formatDateTime(r.createdAt),
    person.lead ? (r.agreedToGuidelinesAt ? formatDateTime(r.agreedToGuidelinesAt) : "Registered before this was asked") : "Covered by registering adult's family permission",
    r.id, r.user.id ?? "", r.user.createdAt ? formatDateTime(r.user.createdAt) : "", lead, person.age, person.relationship, person.lead || Number(person.age) >= 13 ? "Adult / age 13+" : Number(person.age) < 5 ? "Under 5" : "Age 5–12", r.partySize,
    r.familyConsentAt ? formatDateTime(r.familyConsentAt) : "", person.child && r.parentalConsentAt ? formatDateTime(r.parentalConsentAt) : "", r.checkedInCount ?? 0, attendance ? attendance[index] === true ? "Yes" : "No" : index < (r.checkedInCount ?? 0) ? "Yes" : "No", r.carpoolMatched ? "Yes" : "No",
  ]);
}
