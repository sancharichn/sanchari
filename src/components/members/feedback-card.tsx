import { RatingMarks } from "@/components/members/rating-marks";
import { firstName, formatDate } from "@/lib/format";

export type FeedbackCardItem = {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  user: { name: string | null };
  trip?: { id: string; title: string } | null;
};

/** One piece of feedback: the words first, then who and when. */
export function FeedbackCard({ item, showTrip = true }: { item: FeedbackCardItem; showTrip?: boolean }) {
  return (
    <figure className="flex h-full flex-col rounded-panel border border-ridge bg-basalt p-6">
      <RatingMarks rating={item.rating} />
      <blockquote className="mt-4 flex-1 whitespace-pre-line leading-relaxed text-mist">{item.comment}</blockquote>
      <figcaption className="mt-5 text-sm text-lichen">
        <span className="font-semibold text-mist">{firstName(item.user.name)}</span>
        {showTrip && item.trip ? <>, on {item.trip.title}</> : null}
        <span className="block text-xs">{formatDate(item.createdAt)}</span>
      </figcaption>
    </figure>
  );
}
