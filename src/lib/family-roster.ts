import type { PaymentStatus } from "@prisma/client";
import { readCompanions } from "./family";
import { formatDateTime } from "./format";
import { PAYMENT_LABEL } from "./trips";

export const FAMILY_ROSTER_HEADERS = [
  "Place", "Name", "Email", "Phone", "Emergency contact", "Blood group", "Getting there", "Car pool", "Car-pool location", "Car-pool seats", "Payment", "Gear checked", "Registered", "Agreed to guidelines (18 or over)",
  "Registration ID", "Registering adult", "Age", "Relationship", "Adult or child", "Party size", "Family permission", "Parental supervision confirmed", "Party checked in", "Ride arranged",
];

type Registration = {
  checkedInCount?: number; carpoolMatched?: boolean;
  id: string; partySize: number; companions: unknown; paymentStatus: PaymentStatus; carpoolChoice: string; carpoolLocation: string | null; carpoolSeats: number | null;
  gearChecked: boolean; vehicleDetails: string | null; createdAt: Date;
  agreedToGuidelinesAt: Date | null; familyConsentAt: Date | null; parentalConsentAt: Date | null;
  user: { name: string | null; email: string; phone: string | null; emergencyContact: string | null; bloodGroup: string | null };
};

/** One line per traveller, linked to their shared registration and adult contact. */
export function registrationCsvRows(r: Registration, place: string) {
  const lead = r.user.name ?? r.user.email;
  const people = [
    { name: lead, age: "", relationship: "Registering adult", bloodGroup: r.user.bloodGroup, child: false, lead: true },
    ...readCompanions(r.companions).map((person) => ({ ...person, child: person.age < 18, lead: false })),
  ];
  return people.map((person) => [
    place, person.name, r.user.email, r.user.phone ?? "", r.user.emergencyContact ?? "", person.bloodGroup ?? "",
    r.vehicleDetails ?? "Needs a seat", r.carpoolChoice === "NONE" ? "No car pool" : r.carpoolChoice === "OFFER_RIDE" ? "Offers ride" : "Needs ride", r.carpoolLocation ?? "", r.carpoolSeats ?? "", PAYMENT_LABEL[r.paymentStatus], r.gearChecked ? "Yes" : "No", formatDateTime(r.createdAt),
    person.lead ? (r.agreedToGuidelinesAt ? formatDateTime(r.agreedToGuidelinesAt) : "Registered before this was asked") : "Covered by registering adult's family permission",
    r.id, lead, person.age, person.relationship, person.child ? "Child" : "Adult", r.partySize,
    r.familyConsentAt ? formatDateTime(r.familyConsentAt) : "", person.child && r.parentalConsentAt ? formatDateTime(r.parentalConsentAt) : "", r.checkedInCount ?? 0, r.carpoolMatched ? "Yes" : "No",
  ]);
}
