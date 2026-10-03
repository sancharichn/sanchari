import type { Metadata } from "next";
import { Avatar } from "@/components/site/site-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMembers } from "@/lib/admin-queries";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Organiser: members" };

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <main id="main" className="container py-10 md:py-14">
      <h1 className="stretch-semiwide text-3xl font-bold">Members</h1>
      <p className="measure mt-3 text-lichen">
        Everyone who has signed in, newest first. Phone, blood group and emergency contact are only shown to organisers.
      </p>

      {members.length === 0 ? (
        <p className="mt-8 text-mist">Nobody has signed in yet.</p>
      ) : (
        <div className="mt-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Emergency contact</TableHead>
                <TableHead>Blood</TableHead>
                <TableHead className="text-right">Trips</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="min-w-60">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} image={m.image} size={32} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-semibold text-mist">
                          {m.name ?? "No name"}
                          {m.role === "ADMIN" ? <Badge variant="signal">Organiser</Badge> : null}
                        </p>
                        <p className="truncate text-xs text-lichen">{m.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{m.phone ?? <span className="text-lichen">Not given</span>}</TableCell>
                  <TableCell className="min-w-44">{m.emergencyContact ?? <span className="text-lichen">Not given</span>}</TableCell>
                  <TableCell>{m.bloodGroup ?? <span className="text-lichen">—</span>}</TableCell>
                  <TableCell className="stretch-narrow text-right tabular-nums">{m._count.registrations}</TableCell>
                  <TableCell className="whitespace-nowrap text-lichen">{formatDate(m.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
