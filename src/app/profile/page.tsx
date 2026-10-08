import { MemberDataControls } from "@/components/admin/governance-controls";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { FamilySummary } from "@/components/members/family-summary";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProfileForm } from "@/components/members/profile-form";
import { Avatar } from "@/components/site/site-header";
import { StatusBadge } from "@/components/trips/trip-status";
import { buttonVariants } from "@/components/ui/button";
import { formatDateRange } from "@/lib/format";
import { getMemberProfile, getMyTrips } from "@/lib/queries";
import { tripPath } from "@/lib/trip-url";
import { requireUser } from "@/lib/session";
import { PAYMENT_LABEL } from "@/lib/trips";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your trips", robots: { index: false } };

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const [profile, trips] = await Promise.all([getMemberProfile(user.id), getMyTrips(user.id)]);

  const preferences = await prisma.user.findUnique({ where: { id: user.id }, select: { whatsappOptIn: true, whatsappNumber: true } });
  const requests = await prisma.dataRequest.findMany({ where: { userId: user.id, kind: "DELETE" }, orderBy: { createdAt: "desc" }, take: 5 });
  const profileChecks = [
    { label: "Phone", done: Boolean(profile?.phone) },
    { label: "Emergency contact", done: Boolean(profile?.emergencyContact) },
    { label: "Profile photo", done: Boolean(profile?.image) },
    { label: "Birthday", done: Boolean(profile?.birthdayMonth && profile?.birthdayDay) },
  ];
  const completeChecks = profileChecks.filter((check) => check.done).length;
  const upcomingTrips = trips.filter((item) => !["COMPLETED", "ARCHIVED"].includes(item.trip.status)).length;
  const completedTrips = trips.filter((item) => item.trip.status === "COMPLETED").length;

  return (
    <main id="main" className="mobile-glass-screen container py-14 md:py-20">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={profile?.name ?? user.name} image={profile?.image ?? user.image} size={56} />
          <div className="min-w-0">
            <h1 className="stretch-semiwide truncate text-3xl font-bold">{profile?.name ?? "Your profile"}</h1>
            <p className="truncate text-lichen">{profile?.email ?? user.email}</p>
          </div>
        </div>
        <SignOutButton size="sm" />
      </div>

      <section aria-labelledby="profile-ready-heading" className="mt-8 rounded-panel border border-ridge bg-basalt/70 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div><h2 id="profile-ready-heading" className="font-bold text-mist">Profile readiness</h2><p className="mt-1 text-sm text-lichen">These details help organisers support you on a trip.</p></div>
          <p className="stretch-narrow text-2xl font-bold text-signal">{completeChecks}/{profileChecks.length}</p>
        </div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {profileChecks.map((check) => <li key={check.label} className="flex items-center gap-2 rounded-lg border border-ridge px-3 py-2 text-sm"><span aria-hidden="true" className={check.done ? "text-signal" : "text-lichen"}>{check.done ? "✓" : "○"}</span><span className={check.done ? "text-mist" : "text-lichen"}>{check.label}</span></li>)}
        </ul>
      </section>

      <section className="profile-journey mt-6 grid gap-3 sm:grid-cols-3" aria-label="Your travel snapshot">
        <div><span>Upcoming</span><strong>{upcomingTrips}</strong><small>trip{upcomingTrips === 1 ? "" : "s"} ahead</small></div>
        <div><span>Travelled</span><strong>{completedTrips}</strong><small>shared journeys</small></div>
        <div><span>Family</span><strong>{profile?.familyMembers.length ?? 0}</strong><small>saved profiles</small></div>
      </section>

      <section aria-labelledby="my-trips-heading" className="mt-14">
        <h2 id="my-trips-heading" className="stretch-semiwide text-2xl font-bold">
          Your trips
        </h2>
        {trips.length === 0 ? (
          <div className="mt-6 rounded-panel border border-ridge bg-basalt p-6">
            <p className="text-mist">You haven&apos;t registered for a trip yet.</p>
            <Link href="/trips" className={buttonVariants({ size: "sm", className: "mt-4" })}>
              See upcoming trips
            </Link>
          </div>
        ) : (
          <ul className="mt-6 border-b border-ridge">
            {trips.map((r) => {
              const over = r.trip.status === "COMPLETED";
              const place =
                r.position?.kind === "waitlist"
                  ? over
                    ? "Was on the waitlist"
                    : `Waitlist, number ${r.position.place}`
                  : over
                    ? "Travelled"
                    : "Seat confirmed";
              return (
                <li key={r.id} className="border-t border-ridge">
                  <Link
                    href={tripPath(r.trip)}
                    className="group grid gap-3 py-5 transition-colors hover:bg-white/[0.02] md:grid-cols-[minmax(0,1fr)_10rem_10rem_8rem] md:items-center md:px-2"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-mist group-hover:text-signal">{r.trip.title}</p>
                      <p className="text-sm text-lichen">
                        {formatDateRange(r.trip.startDate, r.trip.endDate)}, {r.trip.location}
                      </p>
                    </div>
                    <p className="text-sm text-mist">{place}</p>
                    <p className="text-sm text-lichen">
                      Payment: <span className="text-mist">{PAYMENT_LABEL[r.paymentStatus]}</span>
                    </p>
                    <div className="md:text-right">
                      <StatusBadge status={r.trip.status} />
                    </div>
                  </Link>
                  <FamilySummary companions={r.companions} />
                  <Link href={`${tripPath(r.trip)}/passport`} className="mb-5 inline-flex text-sm font-semibold text-signal underline-offset-4 hover:underline">
                    Open trip passport
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="details-heading" className="mt-16">
        <h2 id="details-heading" className="stretch-semiwide text-2xl font-bold">
          Your details
        </h2>
        <p className="measure mt-3 text-lichen">
          Only organisers can see these. They&apos;re used to plan rides and to reach someone if anything goes wrong on a
          trip.
        </p>
        <div className="mt-8">
          <ProfileForm
            profile={{
              phone: profile?.phone ?? null,
              emergencyContact: profile?.emergencyContact ?? null,
              bloodGroup: profile?.bloodGroup ?? null,
              birthdayMonth: profile?.birthdayMonth ?? null,
      birthdayDay: profile?.birthdayDay ?? null,
      image: profile?.image ?? null,
              familyMembers: profile?.familyMembers ?? [],
            }}
          />
        </div>
      </section>
      {(user.role === "ADMIN" || user.staffRole) && <Link className="mt-8 block text-signal underline" href="/staff">Open staff workspace</Link>}
      <MemberDataControls optIn={preferences?.whatsappOptIn ?? false} number={preferences?.whatsappNumber ?? null} />
      {requests.map(r => <div className="mt-4 rounded-panel border border-ridge p-4" key={r.id}><p>Deletion request · {r.status} · {r.createdAt.toLocaleDateString("en-IN")}</p><p className="text-lichen">{r.note ?? "Awaiting organiser review."}</p></div>)}
    </main>
  );
}
