import { cn } from "@/lib/utils";

/** A rating as five trail markers, filled up to the score. */
export function RatingMarks({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="sr-only">Rated {rating} out of 5</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className={cn("size-2.5 rounded-full border border-signal", n <= rating ? "bg-signal" : "bg-transparent")}
        />
      ))}
    </span>
  );
}
