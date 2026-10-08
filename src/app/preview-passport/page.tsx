import type { TripKind } from "@prisma/client";
import { TripPassport } from "@/components/trips/trip-passport";

/** A local, no-sign-in preview of the member trip workspace. */
export default function PreviewPassportPage() {
  return <TripPassport
    trip={{
      id: "preview-passport", slug: "camping-in-the-jawadhu-hills", title: "Camping in the Jawadhu Hills", location: "Jawadhu Hills", kind: "STAY_BACK" as TripKind,
      startDate: new Date("2026-11-14T00:00:00+05:30"), endDate: new Date("2026-11-15T00:00:00+05:30"), coverPhotoId: null,
      itinerary: [
        { title: "Leave Chennai and set up camp", details: "Meet the group, travel together and settle into the campsite before evening." },
        { title: "Trail time and return", details: "A slow morning outdoors, followed by the return journey to Chennai." },
      ],
    }}
    registration={{ approvalStatus: "APPROVED", paymentStatus: "PAID", gearChecked: false, partySize: 3, vehicleDetails: null, carpoolChoice: "NEED_RIDE", carpoolLocation: "Velachery", carpoolSeats: 3 }}
  />;
}
