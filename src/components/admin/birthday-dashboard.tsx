"use client";

import { useState } from "react";
import { Cake, CalendarDays, Check, Clock3, Mail, MessageCircle, Sparkles, Users } from "lucide-react";
import { BIRTHDAY_TEMPLATES, birthdayMessage } from "@/lib/birthday-templates";

export type ScheduledBirthday = {
  id: string;
  accountId: string;
  name: string;
  accountName: string;
  email: string | null;
  phone: string | null;
  whatsappOptIn: boolean;
  image: string | null;
  month: number;
  day: number;
  relationship: string;
  daysUntil: number;
  timing: string;
  dateLabel: string;
  window: "DAY" | "WEEK" | "MONTH" | "LATER";
};

const GROUPS = [
  { id: "DAY", eyebrow: "Next day", title: "Celebrate now", description: "Birthdays today and tomorrow", icon: Cake, tone: "border-signal/40 bg-signal/[.07]" },
  { id: "WEEK", eyebrow: "Next 7 days", title: "This week", description: "Prepare personal wishes early", icon: Clock3, tone: "border-emerald-400/25 bg-emerald-400/[.05]" },
  { id: "MONTH", eyebrow: "Next 31 days", title: "Coming month", description: "The month ahead at a glance", icon: CalendarDays, tone: "border-sky-300/20 bg-sky-300/[.04]" },
] as const;

function whatsappNumber(value: string | null) {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (/^[6-9]\d{9}$/.test(digits)) return `91${digits}`;
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

function whatsappWish(name: string, templateId: string) {
  const message = birthdayMessage(templateId, name);
  return `${message.body}\n\nWith warm wishes,\nSanchari Chennai · Travel with Nature\nInstagram: @sanchari.chennai\nEmail: sanchari.chn@gmail.com`;
}

export function BirthdayDashboard({ contacts, totalContacts }: { contacts: ScheduledBirthday[]; totalContacts: number }) {
  const [templateId, setTemplateId] = useState<string>(BIRTHDAY_TEMPLATES[1].id);
  const template = BIRTHDAY_TEMPLATES.find((item) => item.id === templateId) ?? BIRTHDAY_TEMPLATES[1];
  return <div className="space-y-8">
    <section className="grid gap-3 sm:grid-cols-3">
      {GROUPS.map((group) => { const count = contacts.filter((contact) => contact.window === group.id).length; const Icon = group.icon; return <div key={group.id} className={`rounded-panel border p-5 ${group.tone}`}><div className="flex items-center justify-between gap-3"><Icon className="size-5 text-signal" aria-hidden="true" /><span className="text-3xl font-black tabular-nums text-mist">{count}</span></div><p className="mt-4 text-xs font-bold uppercase tracking-[.14em] text-signal">{group.eyebrow}</p><p className="mt-1 font-semibold text-mist">{group.description}</p></div>; })}
    </section>

    <section className="overflow-hidden rounded-panel border border-ridge bg-basalt/80">
      <div className="relative border-b border-ridge p-5 sm:p-6"><div className="pointer-events-none absolute right-0 top-0 h-32 w-48 rounded-full bg-signal/10 blur-3xl" /><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-signal"><Sparkles className="size-4" aria-hidden="true" /> Wish style</p><h2 className="mt-2 text-xl font-bold">Choose the message for today’s WhatsApp wishes</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-lichen">The member’s name, Sanchari signature, Instagram and email are added automatically. WhatsApp opens the prepared message for an organiser to review and press Send.</p></div>
      <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-5" role="radiogroup" aria-label="Birthday message style">{BIRTHDAY_TEMPLATES.map((item) => <button key={item.id} type="button" role="radio" aria-checked={templateId === item.id} onClick={() => setTemplateId(item.id)} className={`flex min-h-12 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${templateId === item.id ? "border-signal bg-signal text-night" : "border-ridge bg-night/40 text-mist hover:border-signal/60"}`}><span>{item.title}</span>{templateId === item.id ? <Check className="size-4 shrink-0" aria-hidden="true" /> : null}</button>)}</div>
      <div className="border-t border-ridge bg-night/35 px-5 py-4 text-sm text-lichen"><strong className="text-mist">Preview:</strong> {birthdayMessage(template.id, "Member").body}</div>
    </section>

    {GROUPS.map((group) => { const groupContacts = contacts.filter((contact) => contact.window === group.id); const Icon = group.icon; return <section key={group.id} aria-labelledby={`birthday-${group.id.toLowerCase()}`} className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-signal">{group.eyebrow}</p><h2 id={`birthday-${group.id.toLowerCase()}`} className="mt-1 flex items-center gap-2 text-2xl font-black"><Icon className="size-6 text-signal" aria-hidden="true" />{group.title}</h2></div><span className="rounded-full border border-ridge px-3 py-1 text-xs text-lichen">{groupContacts.length} birthday{groupContacts.length === 1 ? "" : "s"}</span></div>
      {groupContacts.length ? <div className="grid gap-4 lg:grid-cols-2">{groupContacts.map((contact) => <BirthdayContact key={`${contact.id}-${group.id}`} contact={contact} templateId={templateId} />)}</div> : <div className="rounded-panel border border-dashed border-ridge bg-basalt/25 p-7 text-center text-sm text-lichen">No birthdays in this window.</div>}</section>; })}

    <p className="rounded-xl border border-ridge bg-basalt/45 p-4 text-sm leading-6 text-lichen"><Users className="mr-2 inline size-4 text-signal" aria-hidden="true" /><strong className="text-mist">{totalContacts} saved birthdays</strong> across member and family profiles. This focused queue shows the next 31 days; later birthdays move into view automatically.</p>
  </div>;
}

function BirthdayContact({ contact, templateId }: { contact: ScheduledBirthday; templateId: string }) {
  const number = contact.whatsappOptIn ? whatsappNumber(contact.phone) : null;
  const initials = contact.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <article className="group relative overflow-hidden rounded-panel border border-ridge bg-basalt p-5 transition hover:-translate-y-0.5 hover:border-signal/45 hover:shadow-[0_18px_50px_rgba(0,0,0,.25)] sm:p-6"><div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-signal/10 blur-2xl" /><div className="relative flex items-start gap-4"><div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-signal/35 bg-gradient-to-br from-signal/25 to-emerald-500/10 text-lg font-black text-signal">{contact.image ? <img src={contact.image} alt="" className="h-full w-full object-cover" /> : initials}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="truncate text-lg font-bold text-mist">{contact.name}</h3><p className="mt-1 text-xs text-lichen">{contact.relationship === "Member" ? "Member profile" : `${contact.relationship} · family of ${contact.accountName}`}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${contact.daysUntil <= 1 ? "bg-signal text-night" : "border border-ridge text-signal"}`}>{contact.timing}</span></div><p className="mt-3 flex items-center gap-2 text-sm font-semibold text-mist"><CalendarDays className="size-4 text-signal" aria-hidden="true" />{contact.dateLabel}</p></div></div>
    <div className="relative mt-5 flex flex-wrap gap-2">{number ? <a href={`https://wa.me/${number}?text=${encodeURIComponent(whatsappWish(contact.name, templateId))}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-bold text-[#071d10] transition hover:bg-[#36df77]"><MessageCircle className="size-4" aria-hidden="true" />Prepare WhatsApp wish</a> : <span className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-ridge px-4 text-center text-xs text-lichen">{contact.phone ? "WhatsApp permission is off" : "WhatsApp number missing"}</span>}{contact.email ? <a href={`mailto:${contact.email}?subject=${encodeURIComponent(birthdayMessage(templateId, contact.name).subject)}&body=${encodeURIComponent(whatsappWish(contact.name, templateId))}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ridge px-4 text-sm font-semibold text-mist hover:border-signal"><Mail className="size-4" aria-hidden="true" />Email</a> : null}</div>
  </article>;
}
