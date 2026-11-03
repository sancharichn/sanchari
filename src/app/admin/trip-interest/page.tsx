import Link from "next/link";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { TripInterestCommunication } from "@/components/admin/trip-interest-communication";

function whatsappNumber(value: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return `91${digits}`;
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}
export default async function TripInterestPage({ searchParams }: { searchParams: { tripId?: string } }) {
  await requireAdmin();
  const trip = searchParams.tripId ? await prisma.trip.findUnique({ where: { id: searchParams.tripId }, select: { id: true, slug: true, title: true, location: true, interestOpen: true } }) : null;
  if (searchParams.tripId && (!trip || !trip.interestOpen)) return <main className="container py-12"><Link href="/admin/trips" className="text-signal">← Trips</Link><p className="mt-8">This trip does not have an open planning interest group.</p></main>;
  const journey = trip ? `trip:${trip.id}` : "sri-lanka-2027";
  const journeyTitle = trip?.title ?? "International Trip to Sri Lanka 2027";
  const publicPath = trip ? `/trips/${trip.slug ?? trip.id}` : "/trips/international-trip-to-sri-lanka-2027";
  const publicUrl = `${process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "https://sancharichennai.vercel.app"}${publicPath}`;
  const interests = await prisma.tripInterest.findMany({ where: { journey, user: { deletedAt: null } }, orderBy: { createdAt: "asc" }, select: { id: true, partySize: true, note: true, createdAt: true, user: { select: { id: true, name: true, email: true, phone: true, whatsappOptIn: true, whatsappNumber: true } } } });
  const whatsappMembers = interests.flatMap((entry) => { const number = entry.user.whatsappOptIn ? whatsappNumber(entry.user.whatsappNumber) : null; return number ? [{ id: entry.user.id, name: entry.user.name || "Member", number }] : []; });
  return <main id="main" className="container py-12"><Link href="/admin/trips" className="text-signal">← Trips</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">{journeyTitle} · Interest list</h1><p className="mt-3 text-lichen">Planning enquiries only. These members have not booked, paid or been approved for travel.</p></div><a href={`/admin/trip-interest.csv${trip ? `?tripId=${trip.id}` : ""}`} className={buttonVariants({ variant: "outline" })}><Download className="size-4" aria-hidden="true" />Download complete CSV</a></div><p className="mt-4 max-w-3xl text-sm text-lichen">The Excel-compatible file includes planning notes, contact and WhatsApp details, traveller preferences, saved family profile summaries and prior qualifying attendance. Family profiles are context only; they are not confirmed travellers.</p><dl className="my-8 grid grid-cols-2 gap-4"><div className="rounded-panel border border-ridge p-5"><dt>Interested households</dt><dd className="mt-2 text-3xl font-bold text-signal">{interests.length}</dd></div><div className="rounded-panel border border-ridge p-5"><dt>Potential travellers</dt><dd className="mt-2 text-3xl font-bold text-signal">{interests.reduce((sum, entry) => sum + entry.partySize, 0)}</dd></div></dl><TripInterestCommunication journey={journey} journeyTitle={journeyTitle} publicUrl={publicUrl} emailAudienceCount={interests.filter((entry) => entry.user.email).length} whatsappMembers={whatsappMembers} /><div className="grid gap-4 md:grid-cols-2">{interests.map(entry => <article key={entry.id} className="rounded-panel border border-ridge bg-basalt p-5"><h2 className="font-bold">{entry.user.name || "Member"}</h2><p className="mt-2 break-all text-sm">{entry.user.email}</p><p className="text-sm">{entry.user.phone || "Phone not added"}</p><p className="mt-3 text-signal">{entry.partySize} potential traveller(s)</p><p className="mt-2 whitespace-pre-wrap break-words text-sm text-lichen">{entry.note || "No preferences added."}</p><p className="mt-4 text-xs text-lichen">Registered {formatDateTime(entry.createdAt)}</p></article>)}</div>{!interests.length && <p className="rounded-panel border border-dashed border-ridge p-6">No interest registered yet.</p>}</main>;
}
