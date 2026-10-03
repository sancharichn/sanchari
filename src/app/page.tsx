export default function HomePage() {
  return (
    <main id="main" className="container flex min-h-dvh flex-col justify-center py-24">
      <p className="text-lichen">Sanchari Chennai</p>
      <h1 className="stretch-wide mt-4 text-4xl font-extrabold leading-none tracking-tight text-signal md:text-5xl">
        TRAVEL WITH NATURE
      </h1>
      <p className="measure mt-6 text-lg text-mist/80">
        Trips, registrations and the trail log are on their way. Until then, find us on Instagram at{" "}
        <a className="text-signal underline underline-offset-4" href="https://instagram.com/sanchari.chennai">
          @sanchari.chennai
        </a>{" "}
        or write to{" "}
        <a className="text-signal underline underline-offset-4" href="mailto:sanchari.chn@gmail.com">
          sanchari.chn@gmail.com
        </a>
        .
      </p>
    </main>
  );
}
