import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DataRequestReview } from "@/components/admin/governance-controls";
export default async function DataRequestsPage() {
  await requireAdmin();
  const requests = await prisma.dataRequest.findMany({ where: { kind: "DELETE" }, orderBy: { createdAt: "desc" }, take: 100 });
  const members = await prisma.user.findMany({ where: { id: { in: requests.map(r => r.userId) } }, select: { id: true, name: true, email: true } });
  return <main id="main" className="container space-y-6 py-12"><h1 className="text-3xl font-bold">Member data requests</h1><p className="text-lichen">Review deletion requests here. Members download their own data from their profile. Financial records retain an anonymous account reference; review free-text notes and external copies before completing a request.</p>{requests.map(r => { const m = members.find(p => p.id === r.userId); return <article className="rounded-panel border border-ridge bg-basalt p-5" key={r.id}><h2 className="font-bold">{m?.name ?? "Member"} · {r.status}</h2><p className="break-all text-sm text-lichen">{m?.email} · {r.createdAt.toLocaleDateString("en-IN")}</p><p>{r.note}</p>{["OPEN", "REVIEWING"].includes(r.status) && <DataRequestReview id={r.id} />}</article>; })}{!requests.length && <p>No deletion requests.</p>}</main>;
}
