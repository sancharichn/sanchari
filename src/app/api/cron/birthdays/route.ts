import { NextResponse } from "next/server";
import { birthdayMessage, BIRTHDAY_TEMPLATES } from "@/lib/birthday-templates";
import { getBirthdayContacts } from "@/lib/birthday-admin";
import { sendBirthdayEmail } from "@/lib/gmail";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const today = new Date(); const contacts = (await getBirthdayContacts()).filter((contact) => contact.month === today.getMonth() + 1 && contact.day === today.getDate() && contact.email);
  let sent = 0;
  for (const contact of contacts) {
    const key = `${contact.id}:${contact.email}`;
    const already = await prisma.birthdayDelivery.findUnique({ where: { recipientKey_birthdayYear: { recipientKey: key, birthdayYear: today.getFullYear() } } });
    if (already) continue;
    const message = birthdayMessage(BIRTHDAY_TEMPLATES[sent % BIRTHDAY_TEMPLATES.length].id, contact.name);
    const html = `<div style="font-family:Arial,sans-serif;max-width:640px;padding:36px;border-radius:24px;background:#101010;color:#f6f4ed"><img src="${process.env.NEXTAUTH_URL ?? "https://sanchari.chn"}/brand/sanchari-logo.svg" width="160" alt="Sanchari Chennai"><h1 style="font-size:36px;color:#f4df00">${message.subject.replace("!", "")}</h1><p style="font-size:18px;line-height:1.6">${message.body}</p><p style="color:#aeb7ad">Travel with Nature · Sanchari Chennai</p></div>`;
    await sendBirthdayEmail(contact.email!, message.subject, html);
    await prisma.birthdayDelivery.create({ data: { recipientKey: key, birthdayYear: today.getFullYear() } }); sent++;
  }
  return NextResponse.json({ sent, checked: contacts.length });
}
