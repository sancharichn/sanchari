import Link from "next/link";
import type { PaymentStatus, TripKind, TripStatus } from "@prisma/client";
import { CancelRegistrationButton } from "@/components/members/cancel-registration";
import { RegisterDialog, type ProfileDefaults } from "@/components/members/register-dialog";
import { buttonVariants } from "@/components/ui/button";
import { SeatsMeter } from "@/components/trips/trip-status";
import { acceptsRegistrations, closedReason, PAYMENT_LABEL, showsSeats, WHO_CAN_JOIN } from "@/lib/trips";

export type ViewerPlace = { kind: "confirmed" } | { kind: "waitlist"; place: number } | null;

export type PanelViewer = {
  isAdmin: boolean;
  profile: ProfileDefaults;
  registration: { paymentStatus: PaymentStatus; gearChecked: boolean; vehicleDetails: string | null } | null;
  place: ViewerPlace;
} | null;

type Props = {
  trip: { id: string; title: string; status: TripStatus; kind: TripKind; maxCapacity: number };
  registered: number;
  started: boolean;
  viewer: PanelViewer;
};

/** Seats, and what this visitor can do next: sign in, register, or see and manage their place. */
export function RegistrationPanel({ trip, registered, started, viewer }: Props) {
  const open = acceptsRegistrations(trip.status) && !started;
  const registration = viewer?.registration ?? null;
  const seatsShown = showsSeats(trip.status, registered);
  // Before the trip, people deciding whether to register need to know who it's open to.
  const upcoming = !started && ["DRAFT", "OPEN", "WAITLIST", "FULL"].includes(trip.status);

  return (
    <div className="rounded-panel border border-ridge bg-basalt p-6">
      {seatsShown ? (
        <>
          <h2 className="stretch-semiwide text-lg font-bold">Seats</h2>
          <SeatsMeter className="mt-4" registered={registered} capacity={trip.maxCapacity} status={trip.status} />
        </>
      ) : null}

      <div className={seatsShown ? "mt-6 border-t border-ridge pt-6" : undefined}>
        {upcoming && !registration ? (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-mist">Who can join</h3>
            <p className="mt-1 text-sm text-lichen">{WHO_CAN_JOIN[trip.kind]}</p>
            <Link
              href="/faq#joining"
              className="mt-2 inline-block text-sm font-semibold text-mist underline underline-offset-4 hover:text-signal"
            >
              How joining works
            </Link>
          </div>
        ) : null}
        {registration ? (
          <YourPlace
            trip={trip}
            place={viewer?.place ?? null}
            registration={registration}
            started={started}
          />
        ) : open ? (
          viewer ? (
            <RegisterDialog tripId={trip.id} tripTitle={trip.title} profile={viewer.profile} />
          ) : (
            <>
              <Link
                href={`/signin?callbackUrl=${encodeURIComponent(`/trips/${trip.id}`)}`}
                className={buttonVariants({ className: "w-full" })}
              >
                Sign in to register
              </Link>
              <p className="mt-3 text-sm text-lichen">You&apos;ll come straight back here after signing in.</p>
            </>
          )
        ) : (
          <p className="text-sm text-lichen">{closedReason(trip.status, started)}</p>
        )}
      </div>

      {viewer?.isAdmin ? (
        <Link
          href={`/admin/trips/${trip.id}`}
          className={buttonVariants({ variant: "outline", size: "sm", className: "mt-5 w-full" })}
        >
          Manage this trip
        </Link>
      ) : null}
    </div>
  );
}

function YourPlace({
  trip,
  place,
  registration,
  started,
}: {
  trip: Props["trip"];
  place: ViewerPlace;
  registration: NonNullable<NonNullable<PanelViewer>["registration"]>;
  started: boolean;
}) {
  const confirmed = place?.kind !== "waitlist";
  const over = trip.status === "COMPLETED";
  const canCancel = !started && trip.status !== "ONGOING" && !over && registration.paymentStatus === "PENDING";

  return (
    <div>
      <p className="stretch-semiwide text-lg font-bold leading-snug text-signal">
        {over
          ? confirmed
            ? "You were on this trip"
            : "You were on the waitlist"
          : confirmed
            ? "You're going"
            : `You're number ${place?.kind === "waitlist" ? place.place : ""} on the waitlist`}
      </p>
      {!over ? (
        <p className="mt-1 text-sm text-lichen">
          {confirmed ? "Your seat is confirmed." : "If someone drops out, you move up automatically."}
        </p>
      ) : null}

      <dl className="mt-5 grid gap-3 text-sm">
        <Row label="Payment" value={PAYMENT_LABEL[registration.paymentStatus]} />
        <Row label="Gear check" value={registration.gearChecked ? "Done" : "Not yet"} />
        <Row label="Getting there" value={registration.vehicleDetails || "Needs a seat"} />
      </dl>

      {canCancel ? (
        <div className="mt-6">
          <CancelRegistrationButton tripId={trip.id} tripTitle={trip.title} />
        </div>
      ) : !started && !over && registration.paymentStatus !== "PENDING" ? (
        <p className="mt-5 text-xs text-lichen">A payment is recorded, so talk to the organiser if you need to cancel.</p>
      ) : null}

      <p className="mt-5 text-xs text-lichen">
        Contact details are on{" "}
        <Link href="/profile" className="text-mist underline underline-offset-4">
          your profile
        </Link>
        .
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3">
      <dt className="text-lichen">{label}</dt>
      <dd className="break-words text-mist">{value}</dd>
    </div>
  );
}
