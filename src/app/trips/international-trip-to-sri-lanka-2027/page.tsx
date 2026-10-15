import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { InterestForm } from "@/components/trips/interest-form";
import { buttonVariants } from "@/components/ui/button";
export const dynamic = "force-dynamic";
export const metadata = { title: "Sri Lanka 2027 · Register your interest", description: "Help shape Sanchari Chennai’s Sri Lanka journey. Express interest while dates and costs are being planned." };

const images = [
  "https://images.unsplash.com/photo-1711797750174-c3750dd9d7c9?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1612862862126-865765df2ded?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1705365256815-d3ed208fdc9f?auto=format&fit=crop&w=1400&q=85",
];

export default async function SriLanka2027Page() {
  const user = await getCurrentUser();
  const saved = user ? await prisma.tripInterest.findUnique({ where: { journey_userId: { journey: "sri-lanka-2027", userId: user.id } }, select: { partySize: true, note: true } }) : null;
  return <main id="main" className="mobile-glass-screen container py-14 md:py-20"><Link href="/" className="text-sm text-signal">← Back home</Link><div className="mt-8 overflow-hidden rounded-[1.5rem] border border-ridge bg-basalt"><div className="grid h-64 grid-cols-3 gap-1 md:h-96">{images.map((src) => <img key={src} src={src} alt="Sri Lanka landscape" className="size-full object-cover" />)}</div><div className="p-6 md:p-10"><span className="rounded-full border border-signal/70 px-3 py-1 text-xs font-bold uppercase tracking-[.14em] text-signal">Interest open · details soon</span><h1 className="mt-5 text-4xl font-black md:text-6xl">International Trip to Sri Lanka 2027</h1><p className="mt-4 text-lg text-lichen">Sigiriya · Kandy · Ella · Southern coast</p><p className="mt-8 max-w-2xl leading-8 text-mist/85">We are shaping a slow, nature-first journey through Sri Lanka. Dates, itinerary, cost and registration will be shared here once the route is ready.</p><section id="interest" className="mt-8 rounded-panel border border-signal/30 bg-signal/5 p-5 md:p-7"><h2 className="text-2xl font-bold">Help us plan this journey</h2><p className="mt-3 text-sm leading-6 text-lichen">Register your interest so we can plan the group and route. Dates, price and itinerary are not final. No payment is required, no seat is reserved, and joining the interest list does not guarantee eligibility or approval for the final trip. Your details are visible only to organisers.</p>{user ? <InterestForm saved={saved} /> : <Link href="/signin?callbackUrl=%2Ftrips%2Finternational-trip-to-sri-lanka-2027%23interest" className={buttonVariants({ className: "mt-5" })}>Sign in to register interest</Link>}</section><p className="mt-6 text-sm text-lichen">Follow <a className="text-signal underline" href="https://instagram.com/sanchari.chennai">@sanchari.chennai</a> for the first announcement.</p></div></div></main>;
}
