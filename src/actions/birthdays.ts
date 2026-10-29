"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withAudit } from "@/lib/action-audit";
import { done, fail } from "@/lib/action-result";
import { getBirthdayContacts } from "@/lib/birthday-admin";
import { birthdayEmailCard } from "@/lib/birthday-email";
import { indiaBirthdayDate } from "@/lib/email-content";
import { BIRTHDAY_TEMPLATES } from "@/lib/birthday-templates";
import { gmailConfigured, sendBirthdayEmail } from "@/lib/gmail";
import { auditedTransaction, prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/session";

/** Sends one controlled card to the organiser inbox so Gmail can be verified without waiting for a birthday. */
export async function sendBirthdayTestEmail() {
  return withAudit(async () => {
    if (!await getAdmin()) return fail("Admin access required.");
    if (!gmailConfigured()) return fail("Gmail is not configured in the current deployment.");
    const recipient = "sanchari.chn@gmail.com";
    const origin = (process.env.NEXTAUTH_URL ?? "https://sancharichennai.vercel.app").replace(/\/$/, "");
    const card = birthdayEmailCard({ name: "Sanchari Chennai", image: null, templateId: "travel-nature", origin });
    try {
      await sendBirthdayEmail(recipient, `${card.subject} · Test`, card.html);
      return done(`Test birthday card sent to ${recipient}. Check Inbox and Spam.`);
    } catch (error) {
      console.error("[birthday-test] delivery failed", error);
      return fail("Gmail rejected the test card. Check the Gmail credentials and Vercel deployment logs.");
    }
  });
}

const templateIds = BIRTHDAY_TEMPLATES.map((template) => template.id) as [typeof BIRTHDAY_TEMPLATES[number]["id"], ...Array<typeof BIRTHDAY_TEMPLATES[number]["id"]>];
const birthdaySendInput = z.object({ contactId: z.string().min(1).max(80), accountId: z.string().min(1).max(80), templateId: z.enum(templateIds) });

export async function sendBirthdayCardEmail(input: unknown) {
  const admin = await getAdmin();
  if (!admin) return fail("Admin access required.");
  const parsed = birthdaySendInput.safeParse(input);
  if (!parsed.success) return fail("Choose a valid birthday card and try again.");
  if (!gmailConfigured()) return fail("Gmail is not configured in the current deployment.");
  const contact = (await getBirthdayContacts()).find((item) => item.id === parsed.data.contactId && item.accountId === parsed.data.accountId);
  if (!contact?.email) return fail("This member does not have an email address.");
  const year = indiaBirthdayDate().year;
  const recipientKey = `${contact.id}:${contact.email}`;
  let delivery;
  try {
    delivery = await auditedTransaction(admin.id, () => prisma.birthdayDelivery.create({ data: { recipientKey, birthdayYear: year, status: "SENDING" } }));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return fail("A birthday email has already been attempted for this person this year. Check Birthday delivery history before retrying.");
    return fail("The birthday delivery could not be prepared.");
  }
  const origin = (process.env.NEXTAUTH_URL ?? "https://sancharichennai.vercel.app").replace(/\/$/, "");
  const card = birthdayEmailCard({ name: contact.name, image: contact.image, templateId: parsed.data.templateId, origin });
  try {
    await sendBirthdayEmail(contact.email, card.subject, card.html, contact.image);
    await auditedTransaction(admin.id, () => prisma.birthdayDelivery.update({ where: { id: delivery.id }, data: { status: "SENT", sentAt: new Date() } }));
    revalidatePath("/admin/birthdays");
    revalidatePath("/admin/reports");
    return done(`Birthday card emailed to ${contact.name}.`);
  } catch (error) {
    console.error("[birthday-manual] delivery failed", error);
    await auditedTransaction(admin.id, () => prisma.birthdayDelivery.update({ where: { id: delivery.id }, data: { status: "REVIEW_REQUIRED" } }));
    return fail("Gmail could not confirm delivery. Check Birthday delivery history before retrying so the member does not receive a duplicate.");
  }
}
