"use server";

import { withAudit } from "@/lib/action-audit";
import { done, fail } from "@/lib/action-result";
import { escapeHtml } from "@/lib/email-content";
import { birthdayMessage } from "@/lib/birthday-templates";
import { gmailConfigured, sendBirthdayEmail } from "@/lib/gmail";
import { getAdmin } from "@/lib/session";

/** Sends one controlled card to the organiser inbox so Gmail can be verified without waiting for a birthday. */
export async function sendBirthdayTestEmail() {
  return withAudit(async () => {
    if (!await getAdmin()) return fail("Admin access required.");
    if (!gmailConfigured()) return fail("Gmail is not configured in the current deployment.");
    const recipient = "sanchari.chn@gmail.com";
    const origin = (process.env.NEXTAUTH_URL ?? "https://sancharichennai.vercel.app").replace(/\/$/, "");
    const message = birthdayMessage("travel-nature", "Sanchari Chennai");
    const html = `<div style="background:#102820;color:#f6f4ed;padding:32px;font-family:Arial,sans-serif;max-width:600px"><div style="padding-bottom:18px;border-bottom:1px solid #3d5b4f"><img src="${origin}/brand/sanchari-logo.svg" width="170" alt="Sanchari Chennai" style="display:block;width:170px;height:auto"><p style="color:#e6d65c;letter-spacing:3px;font-size:12px">TRAVEL WITH NATURE</p></div><img src="${origin}/covers/jawadhu-hills-camp.jpg" width="100%" alt="A night under the stars"><h1 style="font-size:36px;color:#e6d65c">${escapeHtml(message.subject)}</h1><p style="font-size:18px;line-height:1.7">${escapeHtml(message.body)}</p><p>Travel with Nature</p><p style="font-size:12px;color:#b8c8c2">This is a one-time organiser test of the Sanchari birthday card delivery.</p></div>`;
    try {
      await sendBirthdayEmail(recipient, `${message.subject} · Test`, html);
      return done(`Test birthday card sent to ${recipient}. Check Inbox and Spam.`);
    } catch (error) {
      console.error("[birthday-test] delivery failed", error);
      return fail("Gmail rejected the test card. Check the Gmail credentials and Vercel deployment logs.");
    }
  });
}
