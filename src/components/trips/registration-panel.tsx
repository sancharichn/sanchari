import Link from "next/link";
import type { TripStatus } from "@prisma/client";
import { buttonVariants } from "@/components/ui/button";
import { SeatsMeter } from "@/components/trips/trip-status";
import { acceptsRegistrations } from "@/lib/trips";

type Props = {
  tripId: string;
  status: TripStatus;
  registered: number;
  capacity: number;
  signedIn: boolean;
  started: boolean;
};

/** Seats and what you can do next, for visitors who haven't registered. */
export function RegistrationPanel({ tripId, status, registered, capacity, signedIn, started }: Props) {
  const open = acceptsRegistrations(status) && !started;

  return (
    <div className="rounded-panel border border-ridge bg-basalt p-6">
      <h2 className="stretch-semiwide text-lg font-bold">Seats</h2>
      <SeatsMeter className="mt-4" registered={registered} capacity={capacity} status={status} />

      <div className="mt-6 border-t border-ridge pt-6">
        {open ? (
          signedIn ? (
            <p className="text-sm text-lichen">Registration for this trip opens here shortly.</p>
          ) : (
            <>
              <Link
                href={`/signin?callbackUrl=${encodeURIComponent(`/trips/${tripId}`)}`}
                className={buttonVariants({ className: "w-full" })}
              >
                Sign in to register
              </Link>
              <p className="mt-3 text-sm text-lichen">You&apos;ll come straight back here after signing in.</p>
            </>
          )
        ) : (
          <p className="text-sm text-lichen">{closedReason(status, started)}</p>
        )}
      </div>
    </div>
  );
}

export function closedReason(status: TripStatus, started: boolean) {
  if (status === "COMPLETED") return "This trip is over. See you on the next one.";
  if (status === "ONGOING" || started) return "This trip has already started.";
  if (status === "FULL") return "Registrations are closed for this trip.";
  return "This trip isn't taking registrations.";
}
