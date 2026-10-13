export default function Loading() {
  return <main id="main" className="container py-12" aria-busy="true" aria-label="Loading page">
    <p role="status" className="mb-6 text-sm text-lichen">Loading your next journey…</p>
    <div aria-hidden="true" className="rounded-panel border border-ridge bg-basalt p-6 md:p-12">
      <div className="h-64 rounded-xl bg-white/5" />
      <div className="mt-6 h-8 w-2/3 rounded bg-white/10" />
      <div className="mt-4 h-4 w-5/6 rounded bg-white/5" />
      <div className="mt-3 h-4 w-1/2 rounded bg-white/5" />
    </div>
  </main>;
}
