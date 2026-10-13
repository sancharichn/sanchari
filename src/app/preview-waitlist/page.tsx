import { notFound } from "next/navigation";
import { RegistrationPanel } from "@/components/trips/registration-panel";
export default function PreviewWaitlist() {
  if (process.env.NODE_ENV === "production") notFound();
  return <main id="main" className="container py-12"><p className="text-sm text-signal">Local preview · sample trip · no real registration</p><h1 className="mt-3 text-3xl font-bold">Waitlist registration</h1><p className="mt-3 text-lichen">The highlighted notice and button below are the changes on a waitlist trip page. Open the button to see the notice inside registration too.</p><div className="mt-8 max-w-lg"><RegistrationPanel trip={{ id: "preview-waitlist", slug: null, title: "Jawadhu Hills · sample", status: "WAITLIST", kind: "STAY_BACK", maxCapacity: 30, minimumPriorEvents: 2, adultBudgetEst: null, childBudgetEst: null, budgetEst: null }} registered={30} confirmed={30} started={false} viewer={{ isAdmin: false, profile: { phone: null, emergencyContact: null, bloodGroup: null }, registration: null, place: null }} /></div></main>;
}
