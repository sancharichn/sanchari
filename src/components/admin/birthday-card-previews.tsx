"use client";

import { useState } from "react";
import { BIRTHDAY_TEMPLATES, birthdayMessage } from "@/lib/birthday-templates";

export function BirthdayCardPreviews({ contact }: { contact: { name: string; image: string | null } }) {
  const [selected, setSelected] = useState<string>(BIRTHDAY_TEMPLATES[0].id);
  const template = BIRTHDAY_TEMPLATES.find((item) => item.id === selected) ?? BIRTHDAY_TEMPLATES[0];
  const message = birthdayMessage(template.id, contact.name);
  return <div className="space-y-5">
    <div className="flex flex-wrap gap-2">{BIRTHDAY_TEMPLATES.map((item) => <button key={item.id} onClick={() => setSelected(item.id)} className={`rounded-full border px-3 py-2 text-xs ${item.id === selected ? "border-signal bg-signal text-basalt" : "border-ridge text-lichen"}`}>{item.title}</button>)}</div>
    <article className={`relative isolate min-h-[280px] overflow-hidden rounded-3xl border border-ridge p-6 ${template.id === "simple-warmth" ? "bg-mist text-basalt" : "bg-basalt text-mist"}`}>
      <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-signal/20 blur-2xl" /><div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-80 -skew-x-12 rounded-full bg-emerald-400/10 blur-2xl" /><div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 opacity-50" style={{ background: "linear-gradient(135deg, transparent 35%, rgba(230,214,92,.35) 36% 40%, transparent 41%), linear-gradient(35deg, transparent 50%, rgba(49,92,72,.6) 51% 62%, transparent 63%)" }} />
      <div className="flex items-center justify-between"><img src="/brand/sanchari-logo.svg" alt="Sanchari Chennai" className="h-10 w-auto" /><span className="text-xs opacity-70">A birthday wish from Sanchari</span></div>
      <div className="mt-8 flex items-center gap-5"><div className="h-24 w-24 overflow-hidden rounded-full border-2 border-signal bg-ridge">{contact.image && <img src={contact.image} alt="" className="h-full w-full object-cover" />}</div><div><p className="text-3xl font-black">{template.title}</p><p className="mt-2 max-w-md text-sm opacity-80">{message.body}</p></div></div>
    </article>
  </div>;
}
