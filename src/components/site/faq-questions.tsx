import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { JOIN_STEPS, TREKS_NOTE } from "@/lib/joining";

/** One question, closed until it's tapped. Links to its id open it. */
function Question({ id, question, children }: { id: string; question: string; children: ReactNode }) {
  return (
    <details id={id} className="group scroll-mt-24 border-b border-ridge">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-md py-5 text-lg font-semibold text-mist transition-colors hover:text-signal [&::-webkit-details-marker]:hidden">
        {question}
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 text-lichen transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className="measure space-y-4 pb-8 leading-relaxed text-mist/90">{children}</div>
    </details>
  );
}

/** The joining steps as a trail: a real sequence, so numbered waypoints on one line. */
function JoinTrail() {
  const last = JOIN_STEPS.length - 1;
  return (
    <ol className="grid gap-6 pt-2">
      {JOIN_STEPS.map((step, i) => (
        <li key={step.title} className="relative grid grid-cols-[2.25rem_1fr] gap-x-4">
          {i < last ? (
            // The line to the next waypoint, through the gap between steps.
            <span aria-hidden="true" className="absolute -bottom-6 left-[1.125rem] top-9 w-px bg-ridge" />
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
          <div className="pt-1.5">
            <h3 className="font-bold text-mist">
              <span className="sr-only">Step {i + 1}: </span>
              {step.title}
            </h3>
            <p className="mt-1 text-sm text-lichen">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** The FAQ's three questions, used on the About & FAQ page and the home page. */
export function FaqQuestions() {
  return (
    <div className="max-w-3xl border-t border-ridge">
      <Question id="who-can-join" question="Who can join Sanchari Chennai?">
        <p>
          Anyone who lives, works or runs a business in Chennai can join, whatever their caste, creed, religion, state
          or language, as long as they follow our membership guidelines.
        </p>
        <p>
          Membership is for adults only. Children can&apos;t be members on their own, but they can come to some
          family-friendly events, under the direct supervision and sole responsibility of their parents or guardians.
        </p>
      </Question>

      <Question id="joining" question="How do I join the group and take part in trips?">
        <p>
          Taking part is entirely voluntary, and it happens step by step, so every trip stays safe and the group gets to
          know each other.
        </p>
        <JoinTrail />
        <p>{TREKS_NOTE}</p>
      </Question>

      <Question id="money" question="How does Sanchari Chennai handle money?">
        <p>We&apos;re completely open about money:</p>
        <ul className="list-disc space-y-2.5 pl-5 marker:text-signal">
          <li>We don&apos;t collect membership fees.</li>
          <li>We don&apos;t run for profit of any kind.</li>
          <li>
            We only collect money to cover a trip&apos;s actual shared costs, such as transport, food and permits.
          </li>
        </ul>
      </Question>
    </div>
  );
}
