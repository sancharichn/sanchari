import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { BIRTHDAY_TEMPLATES } from "@/lib/birthday-templates";
import { birthdayEmailCard } from "@/lib/birthday-email";
import { getBirthdayContacts } from "@/lib/birthday-admin";
import { gmailConfigured, sendBirthdayEmail } from "@/lib/gmail";
import { indiaBirthdayDate } from "@/lib/email-content";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!gmailConfigured() || !process.env.NEXTAUTH_URL) return NextResponse.json({ status: "not_configured", sent: 0 });
  const today = indiaBirthdayDate();
  const contacts = (await getBirthdayContacts()).filter((c) => c.month === today.month && c.day === today.day && c.email);
  let sent = 0, skipped = 0, failed = 0;
  for (const contact of contacts) {
    let delivery;
    try {
      // Claim before sending. A timeout is left for organiser review rather than risking a duplicate.
      delivery = await prisma.birthdayDelivery.create({ data: { recipientKey: `${contact.id}:${contact.email}`, birthdayYear: today.year, status: "SENDING" } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") { skipped++; continue; }
      throw error;
    }
    const template = BIRTHDAY_TEMPLATES[today.day % BIRTHDAY_TEMPLATES.length];
    const origin = process.env.NEXTAUTH_URL.replace(/\/$/, "");
    const card = birthdayEmailCard({ name: contact.name, image: contact.image, templateId: template.id, origin });
    try {
      await sendBirthdayEmail(contact.email!, card.subject, card.html, contact.image);
      await prisma.birthdayDelivery.update({ where: { id: delivery.id }, data: { status: "SENT", sentAt: new Date() } }); sent++;
    } catch {
      await prisma.birthdayDelivery.update({ where: { id: delivery.id }, data: { status: "REVIEW_REQUIRED" } }); failed++;
    }
  }
  return NextResponse.json({ sent, skipped, failed, checked: contacts.length });
}
