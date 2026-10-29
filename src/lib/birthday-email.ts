import "server-only";
import { birthdayMessage } from "@/lib/birthday-templates";
import { escapeHtml } from "@/lib/email-content";
import { emailFooter } from "@/lib/trip-emails";

export function birthdayEmailCard({ name, image, templateId, origin }: { name: string; image: string | null; templateId: string; origin: string }) {
  const cleanOrigin = origin.replace(/\/$/, "");
  const message = birthdayMessage(templateId, name);
  const portrait = image?.startsWith("data:image/jpeg;base64,") ? "cid:member-photo" : image?.startsWith("https://") ? escapeHtml(image) : null;
  const cover = `${cleanOrigin}/covers/jawadhu-hills-camp.jpg`;
  const html = `<div style="margin:0;background:#071510;padding:24px 12px;font-family:Arial,sans-serif;color:#f6f4ed">
    <div style="max-width:620px;margin:0 auto;overflow:hidden;border:1px solid #315348;border-radius:28px;background:#102820;box-shadow:0 20px 60px rgba(0,0,0,.28)">
      <div style="padding:24px 28px;border-bottom:1px solid #315348;background:#0a1b15">
        <img src="${cleanOrigin}/brand/sanchari-logo.svg" width="180" alt="Sanchari Chennai" style="display:block;width:180px;max-width:100%;height:auto">
        <p style="margin:10px 0 0;color:#dfd25d;letter-spacing:4px;font-size:11px;font-weight:bold">TRAVEL WITH NATURE</p>
      </div>
      <div style="height:220px;background:#18352b"><img src="${escapeHtml(cover)}" width="620" height="220" alt="A Sanchari journey in nature" style="display:block;width:100%;height:220px;object-fit:cover"></div>
      <div style="padding:0 28px 32px;text-align:center">
        <div style="width:116px;height:116px;margin:-58px auto 18px;border:5px solid #dfd25d;border-radius:60px;overflow:hidden;background:#1d4034;box-shadow:0 12px 30px rgba(0,0,0,.35)">${portrait ? `<img src="${portrait}" width="116" height="116" alt="${escapeHtml(name)}" style="display:block;width:116px;height:116px;object-fit:cover">` : `<div style="padding-top:31px;font-size:42px">🌿</div>`}</div>
        <p style="margin:0;color:#dfd25d;font-size:12px;font-weight:bold;letter-spacing:2px">A WISH FROM THE TRAIL</p>
        <h1 style="margin:12px 0 18px;color:#f8f6ed;font-size:36px;line-height:1.15">${escapeHtml(message.subject)}</h1>
        <p style="margin:0 auto;max-width:500px;color:#d7e2dd;font-size:18px;line-height:1.75">${escapeHtml(message.body)}</p>
        <div style="margin:28px auto 0;padding:18px;border:1px solid #3c6657;border-radius:18px;background:#16352a;color:#dfd25d;font-size:14px">May your next journey bring fresh air, warm company and another beautiful story.</div>
        <div style="text-align:left">${emailFooter()}</div>
        <p style="margin:18px 0 0;color:#8fa89e;font-size:11px;line-height:1.5">This private birthday wish was sent using the birthday saved in your Sanchari profile. You can update or remove it from your profile.</p>
      </div>
    </div>
  </div>`;
  return { ...message, html };
}
