import { CakeSlice, MessageCircleHeart } from "lucide-react";
import { BirthdayDashboard } from "@/components/admin/birthday-dashboard";
import { getBirthdayContacts } from "@/lib/birthday-admin";
import { birthdayDateLabel, birthdaySchedule, birthdayTimingLabel } from "@/lib/birthday-schedule";
import { BirthdayTestSend } from "@/components/admin/birthday-test-send";

export default async function BirthdaysPage() {
  const contacts = await getBirthdayContacts();
  const scheduled = contacts.map((contact) => { const schedule = birthdaySchedule(contact.month, contact.day); return { ...contact, daysUntil: schedule.daysUntil, window: schedule.window, timing: birthdayTimingLabel(schedule.daysUntil), dateLabel: birthdayDateLabel(contact.month, contact.day) }; }).sort((a, b) => a.daysUntil - b.daysUntil || a.name.localeCompare(b.name));
  const upcoming = scheduled.filter((contact) => contact.window !== "LATER");
  return <main className="container py-10 sm:py-12"><section className="relative overflow-hidden rounded-[2rem] border border-ridge bg-gradient-to-br from-basalt via-basalt to-emerald-950/70 p-6 sm:p-9"><div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-signal/15 blur-3xl" /><div className="pointer-events-none absolute -bottom-24 left-1/4 h-44 w-80 rotate-12 rounded-full bg-emerald-400/10 blur-3xl" /><div className="relative grid items-end gap-7 lg:grid-cols-[1fr_auto]"><div className="max-w-3xl"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-signal"><CakeSlice className="size-4" aria-hidden="true" /> Private organiser workspace</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Birthday moments</h1><p className="mt-4 max-w-2xl text-base leading-7 text-lichen">See who to celebrate today, this week and through the coming month. Prepare a warm, personal WhatsApp wish without losing track of family birthdays.</p></div><div className="rounded-2xl border border-signal/25 bg-night/50 p-4 text-sm text-lichen backdrop-blur"><MessageCircleHeart className="mb-3 size-6 text-signal" aria-hidden="true" /><strong className="block text-mist">Human review before sending</strong>Each button opens WhatsApp with the message ready. The organiser presses Send.</div></div></section>
    {contacts.length ? <div className="mt-8"><BirthdayDashboard contacts={upcoming} totalContacts={contacts.length} /></div> : <div className="mt-8 rounded-3xl border border-ridge p-8 text-lichen">No birthdays have been added yet. Members can add theirs from Profile.</div>}
    <details className="mt-8 max-w-3xl rounded-panel border border-ridge bg-basalt/45 p-5"><summary className="cursor-pointer font-bold text-mist">Email delivery test</summary><div className="mt-4"><BirthdayTestSend /></div></details>
  </main>;
}
