import Link from "next/link";
import { ArrowLeft, MessageSquareHeart } from "lucide-react";
import { FeedbackCard } from "@/components/members/feedback-card";
import type { ProfileDefaults } from "@/components/members/register-dialog";
import { ContourField } from "@/components/site/contour-field";
import { buttonVariants } from "@/components/ui/button";
import { durationLabel, formatDateRange, formatINR } from "@/lib/format";
import { reviewToCard, type TripForPage } from "@/lib/queries";
import type { CurrentUser } from "@/lib/session";
import { isPublicStatus, parseItinerary, rosterPosition, splitRoster, STATUS_LABEL } from "@/lib/trips";
import { ItineraryTrail } from "./itinerary-trail";
import { RegistrationPanel } from "./registration-panel";
import { TripAccounts } from "./trip-accounts";
import { StatusBadge } from "./trip-status";

export type TripViewer = { user: CurrentUser; profile: ProfileDefaults } | null;

/** The whole trip page, given its data. Kept separate from fetching so it can be previewed. */
export function TripDetail({ trip, viewer, now = new Date() }: { trip: TripForPage; viewer: TripViewer; now?: Date }) {
  const days = parseItinerary(trip.itinerary);
  const started = trip.startDate.getTime() <= now.getTime();
  const isAdmin = viewer?.user.role === "ADMIN";

  const { confirmed } = splitRoster(trip.registrations, trip.maxCapacity);
  const myRegistration = viewer ? (trip.registrations.find((r) => r.userId === viewer.user.id) ?? null) : null;
  const myPlace = myRegistration ? rosterPosition(trip.registrations, trip.maxCapacity, myRegistration.id) : null;
  const travelling = myPlace?.kind === "confirmed";

  const showAccounts = Boolean(viewer) && (travelling || isAdmin);
  const feedbackOpen = Boolean(trip.feedbackForm?.isOpen) && isPublicStatus(trip.status);
  const reviews = trip.responses.map((r) => reviewToCard(r));
  const feedbackHref = `/trips/${trip.id}/feedback`;

  return (
    <main id="main">
      <header className="relative isolate overflow-hidden border-b border-ridge">
        <ContourField className="opacity-70 [mask-image:linear-gradient(to_bottom,black_35%,transparent)]" />
        <div className="container relative py-12 md:py-16">
          <Link href="/trips" className="inline-flex items-center gap-2 text-sm font-semibold text-lichen hover:text-mist">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All trips
          </Link>

          {!isPublicStatus(trip.status) ? (
            <p className="mt-6 max-w-xl rounded-[10px] border border-dashed border-lichen/60 px-4 py-3 text-sm text-mist">
              This trip is {STATUS_LABEL[trip.status].toLowerCase()}, so only organisers can see this page.
            </p>
          ) : null}

          <div className="mt-6">
            <StatusBadge status={trip.status} />
          </div>
          <h1 className="stretch-wide mt-4 max-w-4xl text-4xl font-extrabold leading-[0.95] tracking-[-0.01em] md:text-5xl">
            {trip.title}
          </h1>

          <dl className="mt-10 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
            <Fact label="When" value={formatDateRange(trip.startDate, trip.endDate)} />
            <Fact label="Where" value={trip.location} />
            <Fact label="Length" value={durationLabel(trip.startDate, trip.endDate)} />
            <Fact
              label="Estimated cost"
              value={trip.budgetEst ? `${formatINR(trip.budgetEst)} per person` : "To be confirmed"}
            />
          </dl>
        </div>
      </header>

      <div className="container grid gap-14 py-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <div className="min-w-0 space-y-16">
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="stretch-semiwide text-2xl font-bold">
              About this trip
            </h2>
            <p className="measure mt-5 whitespace-pre-line leading-relaxed text-mist/90">{trip.description}</p>
          </section>

          <section aria-labelledby="plan-heading">
            <h2 id="plan-heading" className="stretch-semiwide text-2xl font-bold">
              Day by day
            </h2>
            <div className="mt-8">
              <ItineraryTrail days={days} />
            </div>
          </section>

          {showAccounts && viewer ? (
            <TripAccounts
              expenses={trip.expenses}
              travellerIds={confirmed.map((r) => r.userId)}
              viewerId={viewer.user.id}
              budgetEst={trip.budgetEst}
            />
          ) : null}

          {trip.status === "COMPLETED" || feedbackOpen || reviews.length > 0 ? (
            <section aria-labelledby="reviews-heading">
              <h2 id="reviews-heading" className="stretch-semiwide text-2xl font-bold">
                From the people who went
              </h2>
              {feedbackOpen ? (
                <div className="mt-6 flex max-w-2xl flex-wrap items-center justify-between gap-4 rounded-panel border border-signal/50 bg-basalt p-5">
                  <p className="text-mist">
                    <span className="font-semibold">Were you on this trip?</span>{" "}
                    <span className="text-lichen">Tell us how it went. It takes about three minutes.</span>
                  </p>
                  <Link href={feedbackHref} className={buttonVariants({ size: "sm" })}>
                    <MessageSquareHeart className="size-4" aria-hidden="true" />
                    Give feedback
                  </Link>
                </div>
              ) : null}
              {reviews.length > 0 ? (
                <ul className="mt-8 grid gap-5 sm:grid-cols-2">
                  {reviews.map((item) => (
                    <li key={item.id}>
                      <FeedbackCard item={item} showTrip={false} />
                    </li>
                  ))}
                </ul>
              ) : trip.status === "COMPLETED" ? (
                <p className="mt-6 text-lichen">No reviews on the site yet.</p>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="order-first lg:sticky lg:top-24 lg:order-last lg:self-start">
          {feedbackOpen ? (
            <Link
              href={feedbackHref}
              className="mb-4 flex items-center gap-3 rounded-panel border border-signal/50 bg-basalt p-4 text-sm font-semibold text-mist transition-colors hover:border-signal"
            >
              <MessageSquareHeart className="size-5 text-signal" aria-hidden="true" />
              Were you on this trip? Give feedback
            </Link>
          ) : null}
          <RegistrationPanel
            trip={trip}
            registered={trip.registrations.length}
            started={started}
            viewer={
              viewer
                ? {
                    isAdmin,
                    profile: viewer.profile,
                    registration: myRegistration,
                    place: myPlace,
                  }
                : null
            }
          />
        </aside>
      </div>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-lichen">{label}</dt>
      <dd className="mt-1 font-semibold leading-snug text-mist">{value}</dd>
    </div>
  );
}
