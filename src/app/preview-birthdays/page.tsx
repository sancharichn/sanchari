import { notFound } from "next/navigation";
import { BirthdayDashboard, type ScheduledBirthday } from "@/components/admin/birthday-dashboard";

export default function BirthdayPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const contacts: ScheduledBirthday[] = [
    { id: "one", accountId: "one", name: "Ananya", accountName: "Ananya", email: "ananya@example.com", phone: "9876543210", whatsappOptIn: true, image: null, month: 10, day: 29, relationship: "Member", daysUntil: 0, timing: "Today", dateLabel: "October 29", window: "DAY" },
    { id: "two", accountId: "two", name: "Maya", accountName: "Arun", email: "arun@example.com", phone: "9876543211", whatsappOptIn: true, image: null, month: 11, day: 2, relationship: "Child", daysUntil: 4, timing: "In 4 days", dateLabel: "November 2", window: "WEEK" },
    { id: "three", accountId: "three", name: "Rahul", accountName: "Rahul", email: "rahul@example.com", phone: null, whatsappOptIn: false, image: null, month: 11, day: 18, relationship: "Member", daysUntil: 20, timing: "In 20 days", dateLabel: "November 18", window: "MONTH" },
  ];
  return <main className="container py-12"><p className="text-sm text-signal">Local preview · sample records</p><h1 className="mt-2 text-4xl font-black">Birthday moments</h1><p className="mt-3 max-w-2xl text-lichen">Preview of the organiser birthday calendar. WhatsApp and email buttons are sample links on this page.</p><div className="mt-10"><BirthdayDashboard contacts={contacts} totalContacts={9} /></div></main>;
}
