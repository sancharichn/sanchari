import type { Metadata } from "next";
import Link from "next/link";
import { deleteFeedback } from "@/actions/admin";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { RatingMarks } from "@/components/members/rating-marks";
import { TripsCompared } from "@/components/admin/trips-compared";
import { getAllFeedback, getFeedbackOverview } from "@/lib/admin-queries";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Organiser: feedback" };

export default async function AdminFeedbackPage() {
  const [feedback, trips] = await Promise.all([getAllFeedback(), getFeedbackOverview()]);

  return (
    <main id="main" className="container py-10 md:py-14">
      <h1 className="stretch-semiwide text-3xl font-bold">Feedback</h1>

      <TripsCompared trips={trips} />

      <section aria-labelledby="notes-heading" className="mt-16">
        <h2 id="notes-heading" className="stretch-semiwide text-xl font-bold">
          Notes from the Feedback page
        </h2>
        <p className="measure mt-2 text-sm text-lichen">
          What signed-in members wrote about the group in general, newest first. Deleting removes it from the public pages
          too.
        </p>

        {feedback.length === 0 ? (
          <p className="mt-6 text-mist">No notes yet.</p>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {feedback.map((f) => (
              <li key={f.id} className="rounded-panel border border-ridge bg-basalt p-5">
                <div className="flex items-center justify-between gap-3">
                  <RatingMarks rating={f.rating} />
                  <ConfirmActionButton
                    label="Delete"
                    title="Delete this feedback?"
                    description="It disappears from the site. This can't be undone."
                    confirmLabel="Delete feedback"
                    pendingLabel="Deleting…"
                    variant="ghost"
                    action={deleteFeedback.bind(null, f.id)}
                  />
                </div>
                <p className="mt-3 whitespace-pre-line text-mist">{f.comment}</p>
                <p className="mt-3 text-xs text-lichen">
                  {f.user.name ?? f.user.email}, {formatDate(f.createdAt)}
                  {f.trip ? (
                    <>
                      , on{" "}
                      <Link href={`/admin/trips/${f.trip.id}?tab=feedback`} className="underline underline-offset-4 hover:text-signal">
                        {f.trip.title}
                      </Link>
                    </>
                  ) : (
                    ", about the group"
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
