import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AccessEditor } from "@/components/admin/governance-controls";
export default async function AccessPage({ searchParams }: { searchParams: { q?: string } }) {
  await requireAdmin();
  const q = (searchParams.q ?? "").trim().slice(0, 120);
  const [directory, trips] = await Promise.all([
    prisma.user.findMany({ where: { deletedAt: null, role: "MEMBER", ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}) }, select: { id: true, name: true, email: true, staffRole: true, staffTrips: { select: { tripId: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.trip.findMany({ select: { id: true, title: true }, orderBy: { startDate: "desc" } }),
  ]);
  const members = q ? directory.filter(member => member.email.toLowerCase() === q.toLowerCase()).slice(0, 1) : [];
  return <main id="main" className="container space-y-6 py-12"><h1 className="text-3xl font-bold">Staff access</h1><p className="max-w-3xl text-lichen">Assign only the access a person needs. Search the member directory, choose a person, then assign a role and any trip scope.</p><Link className="text-signal underline" href="/staff">Open staff workspace</Link><form className="flex flex-wrap gap-3"><label className="grow">Choose a member<input name="q" list="member-directory" defaultValue={q} placeholder="Choose an email, or search by name" className="mt-2 block min-h-11 w-full rounded-lg border border-ridge bg-basalt px-3" /><datalist id="member-directory">{directory.map(m => <option key={m.id} value={m.email}>{m.name || m.email}</option>)}</datalist></label><button className="rounded bg-signal px-4 py-2 text-black">Search</button></form><p className="text-sm text-lichen">Role assignment is limited to the selected member; changes are recorded in activity history.</p><div className="grid gap-5 md:grid-cols-2">{members.map(m => <article key={m.id} className="rounded-panel border border-ridge bg-basalt p-5"><h2 className="font-bold">{m.name || m.email}</h2><p className="break-all text-sm text-lichen">{m.email}</p><AccessEditor member={{ id: m.id, staffRole: m.staffRole, tripIds: m.staffTrips.map(t => t.tripId) }} trips={trips} /></article>)}</div>{!members.length && <div className="rounded-panel border border-dashed border-ridge p-6"><p className="font-semibold">{q ? "Select a member from the search suggestions" : "Choose a member to manage access"}</p><p className="mt-2 text-sm text-lichen">Search by name or email, choose their email from the list, then press Search. Only that person’s role editor will open.</p></div>}</main>;
}
