import { NextResponse } from "next/server";
import { z } from "zod";
import { auditedTransaction, prisma } from "@/lib/prisma";
import { validWhatsappSignature } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (!process.env.WHATSAPP_VERIFY_TOKEN || params.get("hub.mode") !== "subscribe" || params.get("hub.verify_token") !== process.env.WHATSAPP_VERIFY_TOKEN) return new Response("Forbidden", { status: 403 });
  return new Response(params.get("hub.challenge") ?? "", { headers: { "Content-Type": "text/plain" } });
}
const payloadSchema = z.object({ entry: z.array(z.object({ changes: z.array(z.object({ value: z.object({
  statuses: z.array(z.object({ id: z.string(), status: z.string(), biz_opaque_callback_data: z.string().optional() })).optional(),
  messages: z.array(z.object({ from: z.string(), text: z.object({ body: z.string() }).optional() })).optional(),
}) })) })) });
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 1000000) return new Response("Too large", { status: 413 });
  if (!validWhatsappSignature(raw, request.headers.get("x-hub-signature-256"))) return new Response("Forbidden", { status: 403 });
  let parsed;
  try { parsed = payloadSchema.safeParse(JSON.parse(raw)); } catch { return new Response("Invalid JSON", { status: 400 }); }
  if (!parsed.success) return new Response("Invalid payload", { status: 400 });
  await auditedTransaction(null, async () => {
    for (const entry of parsed.data.entry) for (const change of entry.changes) {
      for (const status of change.value.statuses ?? []) {
        const states: Record<string, string[]> = { sent: ["SENDING", "REVIEW_REQUIRED"], delivered: ["SENDING", "SENT", "REVIEW_REQUIRED", "FAILED"], read: ["SENDING", "SENT", "DELIVERED", "REVIEW_REQUIRED", "FAILED"], failed: ["SENDING", "SENT", "REVIEW_REQUIRED"] };
        if (!states[status.status]) continue;
        await prisma.notification.updateMany({ where: { channel: "WHATSAPP", OR: [{ providerId: status.id }, ...(status.biz_opaque_callback_data ? [{ id: status.biz_opaque_callback_data }] : [])], status: { in: states[status.status] } }, data: { providerId: status.id, status: status.status.toUpperCase(), error: status.status === "failed" ? "Meta reported delivery failure." : null } });
      }
      for (const message of change.value.messages ?? []) {
        if (/^(stop|unsubscribe)$/i.test(message.text?.body.trim() ?? "")) await prisma.user.updateMany({ where: { whatsappNumber: message.from, whatsappOptIn: true }, data: { whatsappOptIn: false } });
      }
    }
  });
  return NextResponse.json({ received: true });
}
