import Link from "next/link";
import { FeedbackCard, type FeedbackCardItem } from "@/components/members/feedback-card";

/** A few recent, well-rated notes from members. Hidden until there are some. */
export function FromTheGroup({ items }: { items: FeedbackCardItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="group-heading" className="container mt-24 md:mt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="group-heading" className="stretch-semiwide text-3xl font-bold">
          From the group
        </h2>
        <Link href="/feedback" className="text-sm font-semibold text-signal underline-offset-4 hover:underline">
          Read all feedback
        </Link>
      </div>
      <ul className="mt-8 grid gap-5 md:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <FeedbackCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}
