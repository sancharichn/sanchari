import Link from "next/link";
import { JOIN_STEPS, TREKS_NOTE } from "@/lib/joining";

/** The steps to join, across the home page: a real sequence, so numbered waypoints joined by a line. */
export function HowToJoin() {
  const last = JOIN_STEPS.length - 1;
  return (
    <section id="join" aria-labelledby="join-heading" className="container mt-24 scroll-mt-24 md:mt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="join-heading" className="stretch-semiwide text-3xl font-bold">
          How to join
        </h2>
        <Link href="/faq" className="text-sm font-semibold text-signal underline-offset-4 hover:underline">
          Read the FAQ
        </Link>
      </div>
      <p className="measure mt-3 text-lichen">
        Everyone starts with a meetup, then moves on to longer trips step by step. It keeps every trip safe and helps
        the group get to know each other.
      </p>
      <ol className="mt-10 grid gap-8 md:grid-cols-4 md:gap-6">
        {JOIN_STEPS.map((step, i) => (
          <li key={step.title} className="relative grid grid-cols-[2.25rem_1fr] gap-x-4 md:block">
            {i < last ? (
              // The line to the next waypoint: down on phones, across on wider screens.
              <span
                aria-hidden="true"
                className="absolute -bottom-8 left-[1.125rem] top-9 w-px bg-ridge md:bottom-auto md:left-9 md:top-[1.125rem] md:h-px md:w-[calc(100%-0.75rem)]"
              />
            ) : null}
            <span
              aria-hidden="true"
              className={
                i === last
                  ? "stretch-narrow relative z-10 inline-flex size-9 items-center justify-center rounded-full border border-signal bg-signal text-sm font-bold tabular-nums text-night"
                  : "stretch-narrow relative z-10 inline-flex size-9 items-center justify-center rounded-full border border-signal bg-night text-sm font-bold tabular-nums text-signal"
              }
            >
              {i + 1}
            </span>
            <div className="pt-1.5 md:mt-5 md:pt-0">
              <h3 className="font-bold text-mist">
                <span className="sr-only">Step {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm text-lichen">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-10 text-sm text-lichen">{TREKS_NOTE}</p>
    </section>
  );
}
