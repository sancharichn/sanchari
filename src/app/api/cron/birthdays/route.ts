import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { birthdayMessage, BIRTHDAY_TEMPLATES } from "@/lib/birthday-templates";
import { getBirthdayContacts } from "@/lib/birthday-admin";
import { gmailConfigured, sendBirthdayEmail } from "@/lib/gmail";
import { escapeHtml, indiaBirthdayDate } from "@/lib/email-content";
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
    const message = birthdayMessage(template.id, contact.name);
    const origin = process.env.NEXTAUTH_URL.replace(/\/$/, "");
    const photo = contact.image?.startsWith("data:image/jpeg;base64,") ? "cid:member-photo" : contact.image?.startsWith("https://") ? contact.image : null;
    const html = `<div style="background:#102820;color:#f6f4ed;padding:32px;font-family:Arial,sans-serif;max-width:600px"><img src="${origin}/covers/jawadhu-hills-camp.jpg" width="100%" alt="A night under the stars"><p style="color:#ffe600;letter-spacing:4px">SANCHARI CHENNAI</p>${photo ? `<img src="${escapeHtml(photo)}" width="120" height="120" style="border-radius:60px;object-fit:cover" alt="Birthday portrait">` : ""}<h1 style="font-size:36px;color:#ffe600">Happy birthday, ${escapeHtml(contact.name)}!</h1><p style="font-size:18px;line-height:1.7">${escapeHtml(message.body)}</p><p>Travel with Nature</p><p style="font-size:12px">To stop birthday wishes, clear the birthday on your <a href="${escapeHtml(origin)}/profile" style="color:#ffe600">profile</a>.</p></div>`;
    try {
      await sendBirthdayEmail(contact.email!, message.subject, html, contact.image);
      await prisma.birthdayDelivery.update({ where: { id: delivery.id }, data: { status: "SENT", sentAt: new Date() } }); sent++;
    } catch {
      await prisma.birthdayDelivery.update({ where: { id: delivery.id }, data: { status: "REVIEW_REQUIRED" } }); failed++;
    }
  }
  return NextResponse.json({ sent, skipped, failed, checked: contacts.length });
}
