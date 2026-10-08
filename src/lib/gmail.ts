import "server-only";

function env(name: string) { return process.env[name]?.trim(); }
export function gmailConfigured() { return Boolean(env("GMAIL_CLIENT_ID") && env("GMAIL_CLIENT_SECRET") && env("GMAIL_REFRESH_TOKEN")); }

async function accessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", signal: AbortSignal.timeout(12000), headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: env("GMAIL_CLIENT_ID") ?? "", client_secret: env("GMAIL_CLIENT_SECRET") ?? "", refresh_token: env("GMAIL_REFRESH_TOKEN") ?? "", grant_type: "refresh_token" }) });
  if (!response.ok) throw new Error(`Gmail token request failed (${response.status})`);
  return (await response.json() as { access_token: string }).access_token;
}

function encoded(value: string) { return Buffer.from(value, "utf8").toString("base64url"); }

export async function sendBirthdayEmail(to: string, subject: string, html: string, photo?: string | null) {
  if (!env("GMAIL_CLIENT_ID") || !env("GMAIL_CLIENT_SECRET") || !env("GMAIL_REFRESH_TOKEN")) throw new Error("Gmail sending is not configured.");
  const from = env("BIRTHDAY_FROM_EMAIL") ?? "sanchari.chn@gmail.com";
  if ([to, from].some((value) => /[\r\n<>]/.test(value))) throw new Error("Invalid mail address.");
  const boundary = "sanchari-" + crypto.randomUUID();
  const attachment = photo?.startsWith("data:image/jpeg;base64,") ? photo.split(",")[1] : null;
  const lines = [`From: Sanchari Chennai <${from}>`, `To: ${to}`, `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`, "MIME-Version: 1.0", `Content-Type: multipart/related; boundary="${boundary}"`, "", `--${boundary}`, "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "", Buffer.from(html).toString("base64")];
  if (attachment) lines.push(`--${boundary}`, "Content-Type: image/jpeg", "Content-Transfer-Encoding: base64", "Content-ID: <member-photo>", "Content-Disposition: inline", "", attachment);
  lines.push(`--${boundary}--`);
  const raw = lines.join("\r\n");
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", { method: "POST", signal: AbortSignal.timeout(12000), headers: { Authorization: `Bearer ${await accessToken()}`, "content-type": "application/json" }, body: JSON.stringify({ raw: encoded(raw) }) });
  if (!response.ok) throw new Error(`Gmail send failed (${response.status})`);
}
