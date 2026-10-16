import type { Metadata } from "next";
import { MemberDirectory } from "@/components/admin/member-directory";
import { getMembers } from "@/lib/admin-queries";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Organiser: members" };

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <main id="main" className="container py-10 md:py-14">
      <h1 className="stretch-semiwide text-3xl font-bold">Members</h1>
      <p className="measure mt-3 text-lichen">
        Search active members, update their complete profile and family information, or safely remove an account. Private safety details remain visible only to organisers.
      </p>

      {members.length === 0 ? (
        <p className="mt-8 text-mist">Nobody has signed in yet.</p>
      ) : (
        <MemberDirectory members={members.map(({ _count, createdAt, ...member }) => ({ ...member, trips: _count.registrations, joined: formatDate(createdAt) }))} />
      )}
    </main>
  );
}
