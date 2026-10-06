import type { TripStatus } from "@prisma/client";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { STATUS_LABEL, seatSummary, showsSeats } from "@/lib/trips";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<TripStatus, NonNullable<BadgeProps["variant"]>> = {
  DRAFT: "dashed",
  OPEN: "signal",
  WAITLIST: "outline",
  FULL: "muted",
  ONGOING: "solid",
  COMPLETED: "muted",
  ARCHIVED: "dashed",
};

export function StatusBadge({ status, className }: { status: TripStatus; className?: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

/** Seats as a line that fills up, with the number that matters in words. */
export function SeatsMeter({
  registered,
  confirmed,
  capacity,
  status,
  className,
}: {
  registered: number;
  confirmed?: number;
  capacity: number;
  status: TripStatus;
  className?: string;
}) {
  if (!showsSeats(status, registered)) return null;
  const seats = seatSummary(registered, capacity, confirmed);

  if (status === "COMPLETED" || status === "ONGOING") {
    return (
      <p className={cn("text-sm text-lichen", className)}>
        <span className="stretch-narrow text-base font-semibold tabular-nums text-mist">{seats.taken}</span>{" "}
        {status === "COMPLETED" ? "travelled" : "on the trail"}
      </p>
    );
  }

  let text: string;
  if (status === "FULL") text = "Registrations closed";
  else if (seats.waitlist > 0) text = `Waitlist open, ${seats.waitlist} waiting`;
  else if (seats.left > 0) text = seats.left === 1 ? "1 seat left" : `${seats.left} seats left`;
  else text = seats.waitlist > 0 ? `Waitlist open, ${seats.waitlist} waiting` : "Waitlist open";

  return (
    <div className={cn("grid gap-1.5", className)}>
      <p className="text-sm text-mist">
        {text}
        <span className="sr-only">
          {" "}
          ({seats.taken} of {capacity} seats taken)
        </span>
      </p>
      <div aria-hidden="true" className="h-[3px] w-full overflow-hidden rounded-full bg-ridge">
        <div className="h-full rounded-full bg-signal" style={{ width: `${Math.round(seats.ratio * 100)}%` }} />
      </div>
      <p aria-hidden="true" className="stretch-narrow text-xs tabular-nums text-lichen">
        {seats.taken}/{capacity}
      </p>
    </div>
  );
}
