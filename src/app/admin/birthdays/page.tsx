import { BirthdayCardPreviews } from "@/components/admin/birthday-card-previews";
import { getBirthdayContacts } from "@/lib/birthday-admin";
import { BirthdayTestSend } from "@/components/admin/birthday-test-send";

export default async function BirthdaysPage() {
  const contacts = await getBirthdayContacts();
  const first = contacts[0];
  return <main className="container py-12"><div className="max-w-3xl"><p className="text-sm text-signal">Private organiser workspace</p><h1 className="mt-2 text-4xl font-black">Birthday wishes</h1><p className="mt-3 text-lichen">Members can save only their birthday month and day. Family birthdays stay linked to the member account and are visible here for sending a personal wish.</p></div><div className="mt-8 max-w-3xl"><BirthdayTestSend /></div>
    {first ? <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]"><section className="space-y-3">{contacts.map((contact) => <div key={contact.id} className="rounded-2xl border border-ridge bg-basalt/40 p-4"><div className="flex items-center gap-3"><div className="h-11 w-11 overflow-hidden rounded-full bg-ridge">{contact.image && <img src={contact.image} alt="" className="h-full w-full object-cover" />}</div><div><p className="font-semibold">{contact.name}</p><p className="text-xs text-lichen">{contact.relationship} · {contact.day}/{contact.month}</p></div></div><div className="mt-3 flex gap-2 text-xs">{contact.email && <a className="rounded-full border border-ridge px-3 py-2 hover:border-signal" href={`mailto:${contact.email}`}>Email</a>}{contact.phone && <a className="rounded-full border border-ridge px-3 py-2 hover:border-signal" href={`https://wa.me/${contact.phone.replace(/\D/g, "")}`} target="_blank">WhatsApp</a>}</div></div>)}</section><BirthdayCardPreviews contact={first} /></div> : <div className="mt-10 rounded-3xl border border-ridge p-8 text-lichen">No birthdays have been added yet. Members can add theirs from Profile.</div>}
  </main>;
}
