import type { Metadata } from "next";
import { CommunityBrochure, CommunityNotebook } from "@/components/site/community-notebook";
import { FaqQuestions } from "@/components/site/faq-questions";
import { OpenDetailsOnHash } from "@/components/site/open-details-on-hash";
import { CONTACT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About & FAQ",
  description: "Who Sanchari Chennai is, how to join its meetups and trips, and the guidelines every member follows.",
};

const linkClass = "text-mist underline underline-offset-4 hover:text-signal";

export default function FaqPage() {
  return (
    <main id="main" className="mobile-glass-screen container py-14 md:py-20">
      <OpenDetailsOnHash />

      <h1 className="stretch-wide text-4xl font-extrabold leading-none md:text-5xl">About &amp; FAQ</h1>
      <p className="measure mt-5 text-lg text-lichen">
        Who we are, how to join our trips, and the guidelines we all travel by.
      </p>

      <nav aria-label="About page sections" className="mt-7 flex flex-wrap gap-3 text-sm font-semibold text-signal">
        <a href="#brochure" className="rounded-full border border-ridge px-4 py-2 hover:border-signal/60">Community brochure</a>
      </nav>

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

        <section
          id="questions"
          aria-labelledby="questions-heading"
          className="scroll-mt-24 border-t border-ridge pt-10"
        >
          <h2 id="questions-heading" className="stretch-semiwide text-2xl font-bold">
            Questions
          </h2>
          <div className="mt-4">
            <FaqQuestions />
          </div>
        </section>

        <section
          id="guidelines"
          aria-labelledby="guidelines-heading"
          className="scroll-mt-24 border-t border-ridge pt-10"
        >
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
              Anyone found using or carrying them on a trip faces immediate disciplinary action and is expelled from the
              group.
            </p>
            <p>
              We also leave no litter. We clean up every place after an event and keep single-use plastic to a minimum.
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

        <CommunityNotebook />
        <CommunityBrochure />

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
