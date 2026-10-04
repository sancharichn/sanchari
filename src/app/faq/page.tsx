import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { OpenDetailsOnHash } from "@/components/site/open-details-on-hash";
import { JOIN_STEPS, TREKS_NOTE } from "@/lib/joining";
import { CONTACT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About & FAQ",
  description: "Who Sanchari Chennai is, how to join its meetups and trips, and the guidelines every member follows.",
};

const linkClass = "text-mist underline underline-offset-4 hover:text-signal";

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

export default function FaqPage() {
  return (
    <main id="main" className="container py-14 md:py-20">
      <OpenDetailsOnHash />

      <h1 className="stretch-wide text-4xl font-extrabold leading-none md:text-5xl">About &amp; FAQ</h1>
      <p className="measure mt-5 text-lg text-lichen">
        Who we are, how to join our trips, and the guidelines we all travel by.
      </p>

      <div className="mt-14 space-y-16">
        <section id="about" aria-labelledby="about-heading" className="scroll-mt-24 border-t border-ridge pt-10">
          <h2 id="about-heading" className="stretch-semiwide text-2xl font-bold">
            Who we are
          </h2>
          <div className="measure mt-5 space-y-4 leading-relaxed text-mist/90">
            <p>
              Sanchari began over a decade ago as an online community of Malayali travel lovers, and has grown into the
              largest community of its kind. It has since become an offline movement too, with local units in almost
              every district of Kerala, in South Indian cities like Chennai and Bangalore, and chapters in the Middle
              East, Europe and Canada.
            </p>
            <p>
              Sanchari Chennai is one of its most active units: a home for travel lovers living in Chennai, most of us
              from Kerala. The group gathered strong momentum again after COVID. Our members come from sport,
              literature, education, cinema and many other fields, and share one love: travel.
            </p>
          </div>

          <div className="measure mt-8 border-l-2 border-signal pl-6">
            <h3 className="stretch-semiwide text-2xl font-bold">Travel with Nature</h3>
            <div className="mt-3 space-y-3 leading-relaxed text-mist/90">
              <p>
                That&apos;s our tagline. We actively promote responsible, eco-friendly and sustainable travel, and aim
                to be role models for this generation and the next.
              </p>
              <p>
                Sanchari Chennai is purely a voluntary community of like-minded people. We are not a commercial travel
                agency or a business.
              </p>
            </div>
          </div>
        </section>

        <section id="questions" aria-labelledby="questions-heading" className="scroll-mt-24 border-t border-ridge pt-10">
          <h2 id="questions-heading" className="stretch-semiwide text-2xl font-bold">
            Questions
          </h2>
          <div className="mt-4 max-w-3xl border-t border-ridge">
            <Question id="who-can-join" question="Who can join Sanchari Chennai?">
              <p>
                Anyone who lives, works or runs a business in Chennai can join, whatever their caste, creed, religion,
                state or language, as long as they follow our membership guidelines.
              </p>
              <p>
                Membership is for adults only. Children can&apos;t be members on their own, but they can come to some
                family-friendly events, under the direct supervision and sole responsibility of their parents or
                guardians.
              </p>
            </Question>

            <Question id="joining" question="How do I join the group and take part in trips?">
              <p>
                Taking part is entirely voluntary, and it happens step by step, so every trip stays safe and the group
                gets to know each other.
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
        </section>

        <section id="guidelines" aria-labelledby="guidelines-heading" className="scroll-mt-24 border-t border-ridge pt-10">
          <h2 id="guidelines-heading" className="stretch-semiwide text-2xl font-bold">
            Guidelines and code of conduct
          </h2>
          <p className="mt-2 text-lichen">Strictly enforced, on every trip and in every group.</p>

          <h3 className="stretch-wide mt-10 text-4xl font-extrabold leading-[0.95] md:text-5xl md:leading-[0.95]">
            Zero drugs.
            <br />
            Zero litter.
          </h3>
          <div className="mt-6 grid max-w-4xl gap-x-10 gap-y-4 leading-relaxed text-mist/90 md:grid-cols-2">
            <p>
              We never promote alcohol, tobacco or any other substance on our travels, and they are strictly banned.
              Anyone found using or carrying them on a trip faces immediate disciplinary action and is expelled from
              the group.
            </p>
            <p>
              We also leave no litter. We clean up every place after an event and keep single-use plastic to a
              minimum.
            </p>
          </div>

          <h3 className="mt-12 text-xl font-bold">Safety, harassment and etiquette</h3>
          <div className="mt-4 grid max-w-4xl gap-x-10 gap-y-4 leading-relaxed text-mist/90 md:grid-cols-2">
            <p>
              Every Sanchari event has zero tolerance for sexual harassment, illegal activity and safety violations,
              such as riding without a helmet or travelling without a seatbelt.
            </p>
            <p>
              Politics, religious discussions, hate speech and business promotions aren&apos;t allowed in any of our
              official groups or channels.
            </p>
          </div>
        </section>

        <div className="border-t border-ridge pt-10">
          <p className="measure text-lichen">
            Have a question we haven&apos;t answered? Write to{" "}
            <a className={linkClass} href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{" "}
            or message{" "}
            <a className={linkClass} href={INSTAGRAM_URL} rel="noopener noreferrer" target="_blank">
              @{INSTAGRAM_HANDLE}
            </a>{" "}
            on Instagram.
          </p>
        </div>
      </div>
    </main>
  );
}
