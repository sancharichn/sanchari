import "server-only";

function env(name: string) { return process.env[name]?.trim(); }

async function accessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: env("GMAIL_CLIENT_ID") ?? "", client_secret: env("GMAIL_CLIENT_SECRET") ?? "", refresh_token: env("GMAIL_REFRESH_TOKEN") ?? "", grant_type: "refresh_token" }) });
  if (!response.ok) throw new Error(`Gmail token request failed (${response.status})`);
  return (await response.json() as { access_token: string }).access_token;
}

function encoded(value: string) { return Buffer.from(value, "utf8").toString("base64url"); }

export async function sendBirthdayEmail(to: string, subject: string, html: string) {
  if (!env("GMAIL_CLIENT_ID") || !env("GMAIL_CLIENT_SECRET") || !env("GMAIL_REFRESH_TOKEN")) throw new Error("Gmail sending is not configured.");
  const from = env("BIRTHDAY_FROM_EMAIL") ?? "sanchari.chn@gmail.com";
  const raw = [`From: Sanchari Chennai <${from}>`, `To: ${to}`, `Subject: ${subject}`, "MIME-Version: 1.0", "Content-Type: text/html; charset=UTF-8", "", html].join("\\r\\n");
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", { method: "POST", headers: { Authorization: `Bearer ${await accessToken()}`, "content-type": "application/json" }, body: JSON.stringify({ raw: encoded(raw) }) });
  if (!response.ok) throw new Error(`Gmail send failed (${response.status})`);
}
