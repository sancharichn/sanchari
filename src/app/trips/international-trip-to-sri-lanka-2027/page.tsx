import Link from "next/link";

const images = [
  "https://images.unsplash.com/photo-1588258524675-c2c0f4d5e6c7?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1588598198321-9735fd5247b0?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?auto=format&fit=crop&w=1400&q=85",
];

export default function SriLanka2027Page() {
  return <main className="mobile-glass-screen container py-14 md:py-20"><Link href="/" className="text-sm text-signal">← Back home</Link><div className="mt-8 overflow-hidden rounded-[1.5rem] border border-ridge bg-basalt"><div className="grid h-64 grid-cols-3 gap-1 md:h-96">{images.map((src) => <img key={src} src={src} alt="Sri Lanka landscape" className="size-full object-cover" />)}</div><div className="p-6 md:p-10"><span className="rounded-full border border-signal/70 px-3 py-1 text-xs font-bold uppercase tracking-[.14em] text-signal">Details soon</span><h1 className="mt-5 text-4xl font-black md:text-6xl">International Trip to Sri Lanka 2027</h1><p className="mt-4 text-lg text-lichen">Sigiriya · Kandy · Ella · Southern coast</p><p className="mt-8 max-w-2xl leading-8 text-mist/85">We are shaping a slow, nature-first journey through Sri Lanka. Dates, itinerary, cost and registration will be shared here once the route is ready.</p><p className="mt-6 text-sm text-lichen">Follow <a className="text-signal underline" href="https://instagram.com/sanchari.chennai">@sanchari.chennai</a> for the first announcement.</p></div></div></main>;
}
