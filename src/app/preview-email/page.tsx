import { notFound } from "next/navigation";
import { CONTACT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";

export default function PreviewEmailPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <main className="email-preview-page"><div className="container py-12"><p className="text-sm font-semibold text-signal">Local email preview</p><h1 className="mt-2 text-4xl font-black">Sanchari email template</h1><p className="mt-3 max-w-2xl text-lichen">This is the shared visual structure used for approval, meetup, trip, payment, feedback, waitlist, and birthday messages.</p><div className="email-preview-window mt-10"><div className="email-preview-header"><img src="/brand/sanchari-logo.svg" alt="Sanchari Chennai" /><p>TRAVEL WITH NATURE</p></div><h2>Reminder: meetup today</h2><h3>Morning nature walk · Sanchari Chennai</h3><p>10 October 2026 · Chennai</p><p className="email-preview-copy">Our meetup is today. Please arrive a few minutes early and keep your phone reachable for organiser updates. We look forward to seeing you.</p><a className="email-preview-cta" href="/trips">Open your trip</a><div className="email-preview-footer"><p>Sanchari Chennai · Travel with Nature</p><p>Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p><p>Instagram: <a href={INSTAGRAM_URL}>@{INSTAGRAM_HANDLE}</a></p></div></div></div></main>;
}
