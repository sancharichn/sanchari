import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export function whatsappConfigured() {
  return process.env.WHATSAPP_ENABLED === "true" && ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_API_VERSION", "WHATSAPP_PROMOTION_TEMPLATE", "WHATSAPP_TEMPLATE_LANGUAGE", "WHATSAPP_APP_SECRET", "WHATSAPP_VERIFY_TOKEN"].every(key => Boolean(process.env[key]?.trim()));
}
export function validWhatsappSignature(body: string, signature: string | null, secret = process.env.WHATSAPP_APP_SECRET) {
  if (!secret || !signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  return timingSafeEqual(Buffer.from(signature.slice(7), "hex"), createHmac("sha256", secret).update(body).digest());
}
export function normalizeWhatsapp(input: string) {
  const number = input.trim().replace(/[ ()-]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(number) ? number.slice(1) : null;
}
export async function sendPromotionWhatsapp(to: string, title: string, url: string, key: string) {
  if (!whatsappConfigured() || !/^[1-9]\d{7,14}$/.test(to)) throw new Error("WhatsApp is not configured or recipient is invalid.");
  const version = process.env.WHATSAPP_API_VERSION!;
  const phone = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  if (!/^v\d+\.\d+$/.test(version) || !/^\d+$/.test(phone)) throw new Error("Invalid WhatsApp configuration.");
  const response = await fetch(`https://graph.facebook.com/${version}/${phone}/messages`, {
    method: "POST", signal: AbortSignal.timeout(12000),
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template", biz_opaque_callback_data: key, template: { name: process.env.WHATSAPP_PROMOTION_TEMPLATE, language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE }, components: [{ type: "body", parameters: [{ type: "text", text: title }, { type: "text", text: url }] }] } }),
  });
  if (!response.ok) throw new Error(`WhatsApp request failed (${response.status}).`);
  const data = await response.json() as { messages?: { id: string }[] };
  if (!data.messages?.[0]?.id) throw new Error("WhatsApp acceptance could not be confirmed.");
  return data.messages[0].id;
}
