import type { Metadata } from "next";
import Link from "next/link";
import { FeedbackCard } from "@/components/members/feedback-card";
import { FeedbackForm } from "@/components/members/feedback-form";
import { buttonVariants } from "@/components/ui/button";
import { getRecentFeedback, getReviewableTrips } from "@/lib/queries";
import { getCurrentUserSafe } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Feedback" };

export default async function FeedbackPage() {
  const user = await getCurrentUserSafe();
  const [feedback, reviewable] = await Promise.all([
    getRecentFeedback(40),
    user ? getReviewableTrips(user.id) : Promise.resolve([]),
  ]);

  return (
    <main id="main" className="container py-14 md:py-20">
      <h1 className="stretch-wide text-4xl font-extrabold leading-none md:text-5xl">Feedback</h1>
      <p className="measure mt-5 text-lg text-lichen">
        What worked, what didn&apos;t, and what you&apos;d like next. Reviews of a trip can come from anyone who had a
        seat on it.
      </p>

      <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-16">
        <section aria-labelledby="recent-heading" className="min-w-0">
          <h2 id="recent-heading" className="stretch-semiwide text-2xl font-bold">
            Recent notes
          </h2>
          {feedback.length === 0 ? (
            <p className="mt-6 text-lichen">Nothing here yet. Be the first to write.</p>
          ) : (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2">
              {feedback.map((item) => (
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
          <div className="mt-6">
            {user ? (
              <FeedbackForm trips={reviewable} />
            ) : (
              <div className="rounded-panel border border-ridge bg-basalt p-6">
                <p className="text-mist">Sign in with Google to leave feedback.</p>
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
