import Link from "next/link";
import { FaqQuestions } from "./faq-questions";

/** The FAQ on the home page, so the whole story reads in one scroll. */
export function HomeQuestions() {
  return (
    <section aria-labelledby="home-questions-heading" className="container mt-24 md:mt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="home-questions-heading" className="stretch-semiwide text-3xl font-bold">
          Questions
        </h2>
        <Link href="/faq" className="text-sm font-semibold text-signal underline-offset-4 hover:underline">
          About Sanchari Chennai
        </Link>
      </div>
      <div className="mt-6">
        <FaqQuestions />
      </div>
    </section>
  );
}
