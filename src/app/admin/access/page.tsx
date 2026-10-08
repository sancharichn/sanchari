import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AccessEditor } from "@/components/admin/governance-controls";
export default async function AccessPage({ searchParams }: { searchParams: { q?: string } }) {
  await requireAdmin();
  const q = (searchParams.q ?? "").slice(0, 120);
  const [members, trips] = await Promise.all([
    prisma.user.findMany({ where: { deletedAt: null, role: "MEMBER", ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}) }, select: { id: true, name: true, email: true, staffRole: true, staffTrips: { select: { tripId: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.trip.findMany({ select: { id: true, title: true }, orderBy: { startDate: "desc" } }),
  ]);
  return <main id="main" className="container space-y-6 py-12"><h1 className="text-3xl font-bold">Staff access</h1><p className="max-w-3xl text-lichen">Finance organisers manage receipts, refunds and expenses. Trip leaders manage attendance, carpools, tasks and incidents only for assigned trips. Moderators manage feedback. Full administrators keep access to all tools.</p><Link className="text-signal underline" href="/staff">Open staff workspace</Link><form className="flex flex-wrap gap-3"><label className="grow">Find a member<input name="q" defaultValue={q} placeholder="Name or email" className="ml-3 rounded border border-ridge bg-basalt p-2" /></label><button className="rounded bg-signal px-4 py-2 text-black">Search</button></form><p className="text-sm text-lichen">Up to 50 matching active members. Search to narrow the list.</p><div className="grid gap-5 md:grid-cols-2">{members.map(m => <article key={m.id} className="rounded-panel border border-ridge bg-basalt p-5"><h2 className="font-bold">{m.name || m.email}</h2><p className="break-all text-sm text-lichen">{m.email}</p><AccessEditor member={{ id: m.id, staffRole: m.staffRole, tripIds: m.staffTrips.map(t => t.tripId) }} trips={trips} /></article>)}</div>{!members.length && <p>No matching members.</p>}</main>;
}
