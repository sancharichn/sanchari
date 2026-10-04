import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What the Sanchari website keeps about you, why, and who can see it.",
};

const UPDATED = "4 October 2026";

const linkClass = "text-mist underline underline-offset-4 hover:text-signal";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-ridge pt-10">
      <h2 id={id} className="stretch-semiwide text-2xl font-bold">
        {title}
      </h2>
      <div className="measure mt-4 space-y-4 leading-relaxed text-mist/90">{children}</div>
    </section>
  );
}

function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2.5 pl-5 marker:text-signal">{children}</ul>;
}

export default function PrivacyPage() {
  const mail = (
    <a className={linkClass} href={`mailto:${CONTACT_EMAIL}`}>
      {CONTACT_EMAIL}
    </a>
  );

  return (
    <main id="main" className="container py-14 md:py-20">
      <h1 className="stretch-wide text-4xl font-extrabold leading-none md:text-5xl">Privacy</h1>
      <p className="measure mt-5 text-lg text-lichen">What this website keeps about you, why, and who can see it.</p>
      <p className="mt-2 text-sm text-lichen">Last updated {UPDATED}</p>

      <div className="measure mt-10 rounded-panel border border-ridge bg-basalt p-6">
        <h2 className="font-bold text-mist">The short version</h2>
        <div className="mt-4 text-mist/90">
          <List>
            <li>Signing in with Google gives us your name, email address and profile photo. Nothing else.</li>
            <li>Your phone number, emergency contact and blood group are optional, and only organisers see them.</li>
            <li>If you post a review or feedback, your first name shows next to it.</li>
            <li>We don&apos;t sell your details, show ads or use tracking cookies.</li>
          </List>
        </div>
      </div>

      <div className="mt-14 space-y-12">
        <Section id="sign-in" title="What we get when you sign in">
          <p>
            Sanchari uses Google sign-in. Google shares your name, email address and profile photo with us, and says so
            on its sign-in screen. We can&apos;t see your Gmail, Drive, contacts, calendar or anything else in your
            Google account, and we never see your password.
          </p>
        </Section>

        <Section id="you-add" title="What you add">
          <List>
            <li>
              Your phone number, an emergency contact and your blood group, on your profile. All three are optional.
            </li>
            <li>
              For each trip you register for: how you&apos;re getting to the start point, and the time you registered,
              which sets your place for a seat or on the waitlist.
            </li>
            <li>Reviews and feedback you write, with your rating.</li>
          </List>
          <p>
            Organisers add your payment status and gear check for each trip, and the trip&apos;s shared expenses,
            including any you paid for the group.
          </p>
        </Section>

        <Section id="use" title="What we use it for">
          <p>Only to run trips:</p>
          <List>
            <li>keeping seats and the waitlist in order, and planning who rides with whom</li>
            <li>reaching you about a trip you&apos;ve registered for</li>
            <li>
              calling your emergency contact, and telling medical staff your blood group, if something goes wrong on a
              trip
            </li>
            <li>splitting shared trip costs</li>
          </List>
          <p>We don&apos;t sell your details or use them for advertising.</p>
        </Section>

        <Section id="who" title="Who can see it">
          <List>
            <li>
              <strong className="font-semibold text-mist">Organisers</strong> see everything above. They can download a
              trip&apos;s roster as a spreadsheet, with names, contact and emergency details, blood groups, travel,
              payment and gear check, to use on the trip.
            </li>
            <li>
              <strong className="font-semibold text-mist">Other members</strong> don&apos;t see your contact details,
              your payments or which trips you&apos;ve registered for.
            </li>
            <li>
              <strong className="font-semibold text-mist">Everyone</strong>, signed in or not, can read reviews and
              feedback, shown with the writer&apos;s first name and the date.
            </li>
          </List>
        </Section>

        <Section id="where" title="Where it's kept">
          <p>
            Your details are stored in a database run by Neon, and the website runs on Vercel, both in the United
            States. Sign-in goes through Google, and gallery photos are kept in the group&apos;s Google Drive.
          </p>
          <p>
            The Instagram section loads its pictures straight from Instagram, so your browser contacts Instagram when
            that section is on screen.
          </p>
        </Section>

        <Section id="cookies" title="Cookies">
          <p>
            One cookie keeps you signed in, and a few short-lived ones are used while Google sign-in is in progress.
            There are no analytics, advertising or tracking cookies. The opening animation notes that it has played in
            your browser&apos;s session storage, which stays on your device.
          </p>
        </Section>

        <Section id="keep" title="How long we keep it">
          <p>
            Your account and trip history stay while the group runs trips, so rosters, trip accounts and reviews of
            past trips stay accurate. Ask us and we&apos;ll delete them.
          </p>
        </Section>

        <Section id="choices" title="Your choices">
          <List>
            <li>
              Change or clear your phone number, emergency contact and blood group on{" "}
              <Link className={linkClass} href="/profile">
                your profile
              </Link>
              .
            </li>
            <li>
              Cancel a registration yourself until the trip starts, as long as no payment has been recorded. After that,
              ask the organiser.
            </li>
            <li>Write to {mail} for a copy of what we hold about you, to correct it, or to delete your account and reviews.</li>
            <li>
              Remove Sanchari from{" "}
              <a className={linkClass} href="https://myaccount.google.com/connections" rel="noopener noreferrer" target="_blank">
                your Google account&apos;s third-party connections
              </a>{" "}
              at any time. That stops future sign-ins but doesn&apos;t delete what we already hold, so write to us for
              that too.
            </li>
          </List>
        </Section>

        <Section id="changes" title="Changes and questions">
          <p>When this page changes, the date at the top changes with it. Questions go to {mail}.</p>
        </Section>
      </div>
    </main>
  );
}
