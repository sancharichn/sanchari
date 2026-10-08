/** A calm placeholder keeps navigation feeling responsive while a page is loading. */
export default function Loading() {
  return <main className="container py-12" aria-label="Loading"><div className="loading-shimmer h-8 w-48" /><div className="mt-10 grid gap-5 md:grid-cols-2"><div className="loading-shimmer h-72" /><div className="loading-shimmer h-72" /></div></main>;
}
