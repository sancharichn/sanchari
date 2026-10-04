import Link from "next/link";

// From the FAQ's tagline, money policy and code of conduct. Not a sequence, so no numbers.
const PRINCIPLES = [
  {
    title: "With nature",
    body: "Responsible, eco-friendly travel. We clean up every place after an event and keep single-use plastic to a minimum.",
  },
  {
    title: "As volunteers, at cost",
    body: "No membership fees and no profit. We're a community, not a travel agency, and only collect money for a trip's shared costs.",
  },
  {
    title: "Sober and safe",
    body: "No alcohol, tobacco or drugs on any trip. Zero tolerance for harassment and unsafe riding or driving. No politics, religion or business promotion in our groups.",
  },
];

export function HowWeTravel() {
  return (
    <section aria-labelledby="values-heading" className="container mt-24 md:mt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="values-heading" className="stretch-semiwide text-3xl font-bold">
          How we travel
        </h2>
        <Link href="/faq#guidelines" className="text-sm font-semibold text-signal underline-offset-4 hover:underline">
          Read the guidelines
        </Link>
      </div>
      <ul className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
        {PRINCIPLES.map((principle) => (
          <li key={principle.title} className="border-t border-ridge pt-5">
            <h3 className="stretch-semiwide text-xl font-bold text-mist">{principle.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-lichen">{principle.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
