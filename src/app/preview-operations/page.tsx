import { notFound } from "next/navigation";
import { OperationsPanel } from "@/components/admin/operations-panel";
export default function PreviewOperations() {
  if (process.env.NODE_ENV === "production") notFound();
  return <main id="main" className="container space-y-8 py-10"><div><p className="text-signal">Development preview · sample records</p><h1 className="mt-2 text-3xl font-bold">Trip day & payments</h1><p className="mt-2 text-lichen">Saving requires an organiser session and a real registration.</p></div><OperationsPanel people={[
    { id: "sample-family", name: "Sample family", email: "family@example.test", phone: null, partySize: 3, checkedInCount: 1, confirmed: true, expected: 350000, net: 200000, paymentStatus: "PARTIAL", carpoolChoice: "NEED_RIDE", carpoolLocation: "Velachery", carpoolSeats: 3, carpoolMatched: false },
    { id: "sample-driver", name: "Sample driver", email: "driver@example.test", phone: null, partySize: 1, checkedInCount: 0, confirmed: true, expected: 150000, net: 150000, paymentStatus: "PAID", carpoolChoice: "OFFER_RIDE", carpoolLocation: "Tambaram", carpoolSeats: 3, carpoolMatched: false },
  ]} events={[{ id: "sample-payment", name: "Sample family", amount: "2000", method: "UPI", reference: "DEMO-001", note: "Family deposit", by: "Sample organiser", date: "7 Oct 2026" }]} /></main>;
}
