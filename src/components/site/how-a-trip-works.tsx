const STEPS = [
  { title: "Sign in", body: "Use your Google account. It takes a few seconds." },
  { title: "Register", body: "Pick a trip and tell us how you're getting to the start point." },
  { title: "Pay the organiser", body: "Your payment status shows on your profile once it's recorded." },
  { title: "Gear check", body: "We go through your kit before departure, so nobody forgets a headlamp." },
  { title: "Head out", body: "Meet at the start point. The trail does the rest." },
];

/** A real sequence, so it gets numbered waypoints on a shared line. */
export function HowATripWorks() {
  return (
    <section aria-labelledby="how-heading" className="container mt-24 md:mt-32">
      <h2 id="how-heading" className="stretch-semiwide text-3xl font-bold">
        How a trip works
      </h2>
      <ol className="relative mt-10 grid gap-8 md:grid-cols-5 md:gap-6">
        <span aria-hidden="true" className="absolute left-[1.125rem] top-0 h-full w-px bg-ridge md:left-0 md:top-[1.125rem] md:h-px md:w-full" />
        {STEPS.map((step, i) => {
          const last = i === STEPS.length - 1;
          return (
            <li key={step.title} className="relative grid grid-cols-[2.25rem_1fr] gap-x-4 md:block">
              <span
                aria-hidden="true"
                className={
                  last
                    ? "stretch-narrow relative z-10 inline-flex size-9 items-center justify-center rounded-full border border-signal bg-signal text-sm font-bold tabular-nums text-night"
                    : "stretch-narrow relative z-10 inline-flex size-9 items-center justify-center rounded-full border border-signal bg-night text-sm font-bold tabular-nums text-signal"
                }
              >
                {i + 1}
              </span>
              <div className="md:mt-5">
                <h3 className="font-bold text-mist">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-lichen">{step.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
