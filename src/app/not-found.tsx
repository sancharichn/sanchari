import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="container flex min-h-[70dvh] flex-col justify-center py-24">
      <p className="stretch-narrow text-2xl font-semibold tabular-nums text-signal">404</p>
      <h1 className="stretch-semiwide mt-2 text-3xl font-bold">This trail doesn&apos;t go anywhere</h1>
      <p className="measure mt-4 text-lichen">The page you were looking for doesn&apos;t exist, or you don&apos;t have access to it.</p>
      <p className="mt-8">
        <Link href="/" className="font-semibold text-signal underline underline-offset-4">
          Back to the start
        </Link>
      </p>
    </main>
  );
}
