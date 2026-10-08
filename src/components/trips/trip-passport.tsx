import Link from "next/link";
import { CalendarDays, Car, Check, ChevronRight, CircleAlert, CreditCard, MapPin, ShieldCheck, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { coverPhoto } from "@/lib/drive";
import { formatDateRange } from "@/lib/format";
import { parseItinerary, tripTypeLabel, PAYMENT_LABEL } from "@/lib/trips";
import { tripPath } from "@/lib/trip-url";

type PassportTrip = {
  id: string;
  slug: string | null;
  title: string;
  location: string;
  startDate: Date;
  endDate: Date;
  kind: Parameters<typeof tripTypeLabel>[0];
  coverPhotoId: string | null;
  itinerary: unknown;
};

type PassportRegistration = {
  approvalStatus: string;
  paymentStatus: keyof typeof PAYMENT_LABEL;
  gearChecked: boolean;
  partySize: number;
  vehicleDetails: string | null;
  carpoolChoice: "NONE" | "NEED_RIDE" | "OFFER_RIDE";
  carpoolLocation: string | null;
  carpoolSeats: number | null;
};

/** A member's single, calm view of everything that matters after registering. */
export function TripPassport({ trip, registration }: { trip: PassportTrip; registration: PassportRegistration }) {
  const cover = coverPhoto(trip.coverPhotoId, trip.title);
  const days = parseItinerary(trip.itinerary);
  const approved = registration.approvalStatus === "APPROVED";
  const pending = registration.approvalStatus === "PENDING";
  const paid = registration.paymentStatus === "PAID";
  const carpoolReady = registration.carpoolChoice === "NONE" || Boolean(registration.carpoolLocation && registration.carpoolSeats);
  const checks = [
    { label: "Registration", done: approved, detail: approved ? "Approved by organiser" : pending ? "Awaiting organiser review" : "Contact the organiser" },
    { label: "Payment", done: trip.kind === "MEETUP" || paid, detail: trip.kind === "MEETUP" ? "No payment needed" : PAYMENT_LABEL[registration.paymentStatus] },
    { label: "Travel plan", done: carpoolReady, detail: carpoolReady ? "Travel details saved" : "Add your car pool details" },
    { label: "Gear check", done: trip.kind === "MEETUP" || registration.gearChecked, detail: trip.kind === "MEETUP" ? "No gear check needed" : registration.gearChecked ? "Marked ready" : "To be confirmed" },
  ];
  const complete = checks.filter((item) => item.done).length;

  return (
    <main id="main" className="passport-page mobile-glass-screen">
      <section className="passport-hero relative isolate overflow-hidden">
        {cover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- our own cached image proxy */}
            <img src={cover.src[1600]} srcSet={`${cover.src[960]} 960w, ${cover.src[1600]} 1600w`} sizes="100vw" alt="" className="absolute inset-0 -z-20 size-full object-cover" />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(4,13,17,.94),rgba(4,13,17,.72)_52%,rgba(4,13,17,.42))]" />
          </>
        ) : null}
        <div className="container py-10 md:py-16">
          <Link href={tripPath(trip)} className="inline-flex items-center gap-1 text-sm font-semibold text-mist/80 transition-colors hover:text-signal">
            <ChevronRight className="size-4 rotate-180" aria-hidden="true" /> Trip details
          </Link>
          <p className="passport-kicker mt-10">Your trip passport</p>
          <h1 className="stretch-wide mt-3 max-w-3xl text-4xl font-extrabold leading-[.96] md:text-6xl">{trip.title}</h1>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-mist/85">
            <span className="inline-flex items-center gap-2"><CalendarDays className="size-4 text-signal" />{formatDateRange(trip.startDate, trip.endDate)}</span>
            <span className="inline-flex items-center gap-2"><MapPin className="size-4 text-signal" />{trip.location}</span>
            <span className="inline-flex items-center gap-2"><Users className="size-4 text-signal" />{registration.partySize} {registration.partySize === 1 ? "traveller" : "travellers"}</span>
          </div>
        </div>
      </section>

      <div className="container grid gap-8 py-8 md:py-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-8">
          <section className="passport-surface p-5 sm:p-7" aria-labelledby="passport-ready">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div><p className="passport-eyebrow">Trip readiness</p><h2 id="passport-ready" className="mt-1 text-2xl font-bold">{complete} of {checks.length} things ready</h2></div>
              <span className="passport-count" aria-label={`${complete} of ${checks.length} readiness checks complete`}>{complete}/{checks.length}</span>
            </div>
            <ol className="passport-steps mt-7">
              {checks.map((item, index) => <li key={item.label} className={item.done ? "passport-step passport-step-done" : "passport-step"}>
                <span className="passport-step-mark" aria-hidden="true">{item.done ? <Check className="size-3.5" /> : index + 1}</span>
                <span><strong>{item.label}</strong><small>{item.detail}</small></span>
              </li>)}
            </ol>
          </section>

          <section className="passport-surface p-5 sm:p-7" aria-labelledby="passport-plan">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="passport-eyebrow">The plan</p><h2 id="passport-plan" className="mt-1 text-2xl font-bold">{tripTypeLabel(trip.kind, trip.startDate, trip.endDate)}</h2></div><Link href={tripPath(trip)} className="text-sm font-semibold text-signal hover:underline">Full trip details</Link></div>
            {days.length ? <ol className="passport-itinerary mt-7">{days.map((day, index) => <li key={`${day.title}-${index}`}><span>Day {index + 1}</span><div><h3>{day.title}</h3>{day.details ? <p>{day.details}</p> : null}</div></li>)}</ol> : <p className="mt-6 text-lichen">The organiser will add the detailed plan here.</p>}
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="passport-surface p-5" aria-labelledby="passport-travel">
            <p className="passport-eyebrow">Getting there</p><h2 id="passport-travel" className="mt-1 text-xl font-bold">Travel plan</h2>
            <div className="mt-5 space-y-4 text-sm">
              <PassportRow icon={<Car className="size-4" />} label="Car pool" value={registration.carpoolChoice === "OFFER_RIDE" ? `Offering ${registration.carpoolSeats ?? ""} seat(s)` : registration.carpoolChoice === "NEED_RIDE" ? `Needs ${registration.carpoolSeats ?? ""} seat(s)` : registration.vehicleDetails || "No car pool request"} detail={registration.carpoolLocation ?? undefined} />
              <PassportRow icon={<CreditCard className="size-4" />} label="Payment" value={trip.kind === "MEETUP" ? "No payment needed" : PAYMENT_LABEL[registration.paymentStatus]} />
            </div>
          </section>
          <section className="passport-note p-5"><ShieldCheck className="size-5 text-signal" /><div><h2 className="font-bold">Keep this page handy</h2><p className="mt-1 text-sm text-lichen">Your trip status and plan stay together here as the organiser updates them.</p></div></section>
          {!approved ? <p className="flex gap-2 rounded-xl border border-signal/25 bg-signal/[.06] p-4 text-sm text-mist"><CircleAlert className="size-4 shrink-0 text-signal" />Your place becomes ready after organiser approval.</p> : null}
          <Link href="/profile" className={buttonVariants({ variant: "outline", className: "w-full" })}>Your profile</Link>
        </aside>
      </div>
    </main>
  );
}

function PassportRow({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail?: string }) {
  return <div className="flex gap-3"><span className="mt-0.5 text-signal">{icon}</span><div><p className="text-lichen">{label}</p><p className="mt-0.5 font-semibold text-mist">{value}</p>{detail ? <p className="mt-0.5 text-lichen">{detail}</p> : null}</div></div>;
}
