import "server-only";
import { createHmac, createSign, timingSafeEqual } from "node:crypto";

/*
 * Google service-account access, without pulling in the googleapis SDK:
 * sign a JWT with the key from GOOGLE_SERVICE_ACCOUNT_JSON and swap it for an
 * access token, cached until shortly before it expires.
 */

export const DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

type ServiceAccount = { client_email: string; private_key: string; token_uri: string };

export function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    // Accept the key file as pasted, or base64-encoded.
    const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(json) as Partial<ServiceAccount>;
    if (!parsed.client_email || !parsed.private_key) return null;
    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
      token_uri: parsed.token_uri || "https://oauth2.googleapis.com/token",
    };
  } catch {
    console.error("[google] GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON (or base64-encoded JSON).");
    return null;
  }
}

const tokens = new Map<string, { token: string; expiresAt: number }>();

export async function getGoogleAccessToken(scope: string): Promise<string | null> {
  const cached = tokens.get(scope);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const account = readServiceAccount();
  if (!account) return null;

  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: account.client_email,
    scope,
    aud: account.token_uri,
    iat: now,
    exp: now + 3600,
  })}`;

  let signature: string;
  try {
    signature = createSign("RSA-SHA256").update(unsigned).sign(account.private_key).toString("base64url");
  } catch {
    console.error("[google] Could not sign with the service account's private key.");
    return null;
  }

  const response = await fetch(account.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error(`[google] Token request failed with ${response.status}.`);
    return null;
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  tokens.set(scope, { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 });
  return data.access_token;
}

/* ----------------------------------------------------------------------------
 * Signed gallery URLs: only files the gallery listed can be fetched through
 * the image proxy, so it can't be used to read anything else the service
 * account can see.
 * ------------------------------------------------------------------------- */

function signingKey() {
  return process.env.NEXTAUTH_SECRET || "development-only-secret";
}

export function signFileId(fileId: string): string {
  return createHmac("sha256", signingKey()).update(`gallery:${fileId}`).digest("hex").slice(0, 32);
}

export function verifyFileId(fileId: string, signature: string | null): boolean {
  if (!signature || signature.length !== 32) return false;
  const expected = Buffer.from(signFileId(fileId));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
