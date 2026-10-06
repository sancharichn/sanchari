import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TripFeedbackForm } from "@/components/feedback/trip-feedback-form";
import { ContourField } from "@/components/site/contour-field";
import { parseExtraQuestions } from "@/lib/feedback";
import { signFormToken } from "@/lib/feedback-server";
import { formatDateRange } from "@/lib/format";
import { getFeedbackFormTrip } from "@/lib/queries";
import { getCurrentUserSafe } from "@/lib/session";
import { CONTACT_EMAIL } from "@/lib/site";
import { isPublicStatus } from "@/lib/trips";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

const DEFAULT_INTRO =
  "Thank you for travelling with us. Tell us what worked and what didn't: your answers shape the next trip.";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const trip = await getFeedbackFormTrip(params.id);
  if (!trip || !isPublicStatus(trip.status)) return { title: "Feedback", robots: { index: false } };
  return {
    title: `Feedback: ${trip.title}`,
    description: `Tell Sanchari Chennai how ${trip.title} went.`,
    robots: { index: false },
  };
}

export default async function TripFeedbackPage({ params }: Params) {
  const [trip, user] = await Promise.all([getFeedbackFormTrip(params.id), getCurrentUserSafe()]);
  const isAdmin = user?.role === "ADMIN";
  if (!trip || (!isPublicStatus(trip.status) && !isAdmin)) notFound();

  const form = trip.feedbackForm;
  const open = Boolean(form?.isOpen) && isPublicStatus(trip.status);
  const tripHref = `/trips/${trip.id}`;

  return (
    <main id="main" className="mobile-glass-screen">
      <header className="relative isolate overflow-hidden border-b border-ridge">
        <ContourField className="opacity-60 [mask-image:linear-gradient(to_bottom,black_35%,transparent)]" />
        <div className="container relative max-w-3xl py-12 md:py-14">
          <Link href={tripHref} className="inline-flex items-center gap-2 text-sm font-semibold text-lichen hover:text-mist">
            <ArrowLeft className="size-4" aria-hidden="true" />
            The trip
          </Link>
          <p className="mt-8 text-sm font-semibold text-signal">Sanchari Chennai · Trip feedback</p>
          <h1 className="stretch-wide mt-3 text-4xl font-extrabold leading-[0.95] md:text-5xl">{trip.title}</h1>
          <p className="mt-4 text-lichen">
            {formatDateRange(trip.startDate, trip.endDate)}, {trip.location}
          </p>
          {open || isAdmin ? (
            <p className="measure mt-5 whitespace-pre-line text-lg leading-relaxed text-mist/90">{form?.intro || DEFAULT_INTRO}</p>
          ) : null}
        </div>
      </header>

      <div className="container max-w-3xl py-10 md:py-14">
        {open ? (
          <TripFeedbackForm
            tripId={trip.id}
            tripHref={tripHref}
            extras={parseExtraQuestions(form!.questions)}
            token={signFormToken(form!.id)}
            defaultName={user?.name ?? ""}
            signedIn={Boolean(user)}
            preview={false}
          />
        ) : isAdmin ? (
          <>
            <p className="mb-8 rounded-[10px] border border-dashed border-lichen/60 px-4 py-3 text-sm text-mist">
              {form
                ? "This form is closed, so you're seeing an organiser's preview."
                : "This trip has no feedback form yet, so you're seeing the standard questions."}{" "}
              <Link href={`/admin/trips/${trip.id}?tab=feedback`} className="font-semibold underline underline-offset-4 hover:text-signal">
                Set it up and open it
              </Link>
              .
            </p>
            <TripFeedbackForm
              tripId={trip.id}
              tripHref={tripHref}
              extras={parseExtraQuestions(form?.questions)}
              token=""
              defaultName={user?.name ?? ""}
              signedIn
              preview
            />
          </>
        ) : (
          <div className="rounded-panel border border-ridge bg-basalt p-6 sm:p-8">
            <h2 className="stretch-semiwide text-2xl font-bold">Feedback isn&apos;t open for this trip</h2>
            <p className="measure mt-3 text-lichen">
              The organisers open it after the trip. If there&apos;s something you&apos;d like them to know now, write to{" "}
              <a className="text-mist underline underline-offset-4 hover:text-signal" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              .
            </p>
            <Link href={tripHref} className="mt-6 inline-block font-semibold text-signal underline-offset-4 hover:underline">
              Back to the trip
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
