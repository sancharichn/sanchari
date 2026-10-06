import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquareHeart } from "lucide-react";
import { FeedbackCard, type FeedbackCardItem } from "@/components/members/feedback-card";
import { FeedbackForm } from "@/components/members/feedback-form";
import { buttonVariants } from "@/components/ui/button";
import { formatDateRange } from "@/lib/format";
import { getFeaturedReviews, getOpenFeedbackTrips, getRecentFeedback, reviewToCard } from "@/lib/queries";
import { getCurrentUserSafe } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Feedback" };

export default async function FeedbackPage() {
  const [user, notes, reviews, openTrips] = await Promise.all([
    getCurrentUserSafe(),
    getRecentFeedback(40),
    getFeaturedReviews(40),
    getOpenFeedbackTrips(),
  ]);

  // Picked quotes from trip feedback and members' notes, newest first.
  const items: FeedbackCardItem[] = [...reviews.map((r) => reviewToCard(r)), ...notes]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 40);

  return (
    <main id="main" className="mobile-glass-screen container py-14 md:py-20">
      <h1 className="stretch-wide text-4xl font-extrabold leading-none md:text-5xl">Feedback</h1>
      <p className="measure mt-5 text-lg text-lichen">
        What worked, what didn&apos;t, and what you&apos;d like next. After each trip, its feedback form is shared on
        WhatsApp; for anything else, write to us here.
      </p>

      {openTrips.length > 0 ? (
        <section aria-labelledby="open-heading" className="mt-12">
          <h2 id="open-heading" className="stretch-semiwide text-2xl font-bold">
            Tell us about a trip
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {openTrips.map((trip) => (
              <li key={trip.id} className="flex flex-col gap-4 rounded-panel border border-signal/50 bg-basalt p-5">
                <div>
                  <p className="font-bold text-mist">{trip.title}</p>
                  <p className="mt-1 text-sm text-lichen">
                    {formatDateRange(trip.startDate, trip.endDate)}, {trip.location}
                  </p>
                </div>
                <Link href={`/trips/${trip.id}/feedback`} className={buttonVariants({ size: "sm", className: "mt-auto self-start" })}>
                  <MessageSquareHeart className="size-4" aria-hidden="true" />
                  Give feedback
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-14 grid gap-14 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-16">
        <section aria-labelledby="recent-heading" className="min-w-0">
          <h2 id="recent-heading" className="stretch-semiwide text-2xl font-bold">
            Recent notes
          </h2>
          {items.length === 0 ? (
            <p className="mt-6 text-lichen">Nothing here yet. Be the first to write.</p>
          ) : (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2">
              {items.map((item) => (
                <li key={item.id}>
                  <FeedbackCard item={item} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="write-heading" className="order-first lg:order-last">
          <h2 id="write-heading" className="stretch-semiwide text-2xl font-bold">
            Write to us
          </h2>
          <p className="mt-2 text-sm text-lichen">About the group in general: ideas, praise, things to fix.</p>
          <div className="mt-6">
            {user ? (
              <FeedbackForm />
            ) : (
              <div className="rounded-panel border border-ridge bg-basalt p-6">
                <p className="text-mist">Sign in with Google to write to us here.</p>
                <Link
                  href={`/signin?callbackUrl=${encodeURIComponent("/feedback")}`}
                  className={buttonVariants({ size: "sm", className: "mt-4" })}
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
