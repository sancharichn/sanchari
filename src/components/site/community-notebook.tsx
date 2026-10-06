import { BookOpen, GraduationCap, HeartHandshake, ArrowUpRight } from "lucide-react";

const BROCHURE = "/brochures/sanchari-guide.png";

/** Viewports preserve the supplied brochure artwork without redrawing its logos. */
function BrochureArtwork({ viewBox, label, className }: { viewBox: string; label: string; className?: string }) {
  return (
    <svg viewBox={viewBox} role="img" aria-label={label} className={className}>
      <image href={BROCHURE} width="1671" height="941" />
    </svg>
  );
}

export function CommunityNotebook() {
  return (
    <section id="notebook" aria-labelledby="notebook-heading" className="scroll-mt-24 border-t border-ridge pt-10">
      <p className="text-sm font-semibold text-signal">Educate · Empower · Build Brighter Futures</p>
      <h2 id="notebook-heading" className="stretch-semiwide mt-3 text-3xl font-bold">Sanchari Notebook</h2>
      <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-10">
        <figure className="self-start overflow-hidden rounded-panel border border-ridge bg-basalt">
          <BrochureArtwork
            viewBox="563 555 264 386"
            label="Notebook by Sanchari Chennai: the bird and open-book emblem above children with school backpacks in a mountain landscape, from the community brochure."
            className="w-full"
          />
          <figcaption className="px-5 py-4 text-xs text-lichen">Notebook by Sanchari Chennai</figcaption>
        </figure>
        <div>
          <p className="text-lg leading-relaxed text-mist/90">
            Sanchari Notebook began as an annual worldwide charity event and has now grown into a major flagship program.
          </p>
          <ul className="mt-7 grid gap-4">
            {[
              { icon: BookOpen, title: "Educational supplies", body: "It focuses on providing educational supplies to underprivileged children as a fulfillment of societal responsibility rather than traditional charity." },
              { icon: GraduationCap, title: "Continuing education support", body: "The Chennai Sanchari Unit has uniquely expanded this initiative into a continuing education support program." },
              { icon: HeartHandshake, title: "Mentoring, tutoring and support", body: "Under this local program, members mentor, tutor, and support underprivileged children to help them excel in their education and secure their futures." },
            ].map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-panel border border-ridge bg-basalt p-5">
                <Icon className="mb-3 size-5 text-signal" aria-hidden="true" />
                <h3 className="font-semibold text-mist">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-lichen">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const PAGES = [
  { title: "Travel with Nature", crop: "0 0 552 470", description: "General Guidelines & Code of Conduct · V.1 · 10 Oct, 2026" },
  { title: "Welcome & Core Purpose", crop: "563 0 545 470", description: "A voluntary community of travel lovers, sharing common event and trip expenses." },
  { title: "Membership & Participation", crop: "1120 0 551 470", description: "The journey from meetups to longer trips, with treks through the Health & Fitness group." },
  { title: "Strict Code of Conduct & Trip Guidelines", crop: "0 480 552 461", description: "Zero drugs and litter; no harassment, illegal acts, bullying, hate speech or commercial promotions. Practise carpooling." },
  { title: "Sanchari Notebook", crop: "563 480 545 461", description: "Educational supplies and continuing support for underprivileged children." },
  { title: "Financial Transparency", crop: "1120 480 551 461", description: "Shared transport, food and permit costs. Facebook: Sanchari Chennai. Instagram: @sanchari.chennai." },
];

export function CommunityBrochure() {
  return (
    <section id="brochure" aria-labelledby="brochure-heading" className="scroll-mt-24 border-t border-ridge pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-signal">The community guide</p>
          <h2 id="brochure-heading" className="stretch-semiwide mt-3 text-2xl font-bold">General Guidelines &amp; Code of Conduct</h2>
        </div>
        <a href={BROCHURE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-signal underline-offset-4 hover:underline">
          Open the full brochure <ArrowUpRight className="size-4" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
      <p className="mt-3 text-sm text-lichen">The original six-page brochure, with its illustrations and graphics. Select a page to read it.</p>
      <div className="mt-8 grid items-start gap-5 md:grid-cols-2">
        {PAGES.map((page, i) => (
          <details key={page.title} className="group overflow-hidden rounded-panel border border-ridge bg-basalt">
            <summary className="flex cursor-pointer list-none items-start gap-4 p-5 [&::-webkit-details-marker]:hidden">
              <span className="stretch-narrow text-lg font-bold text-signal">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-mist">{page.title}</span>
                <span className="mt-2 block text-sm leading-relaxed text-lichen">{page.description}</span>
              </span>
              <span className="text-signal transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <BrochureArtwork viewBox={page.crop} label={`Brochure page ${i + 1}: ${page.title}`} className="w-full border-t border-ridge" />
          </details>
        ))}
      </div>
    </section>
  );
}
