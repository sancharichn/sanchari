import { generateKeyPairSync } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { readServiceAccount, signFileId, verifyFileId } from "./google";
import { GET } from "@/app/api/gallery/[id]/route";

const original = { ...process.env };
afterEach(() => {
  process.env = { ...original };
});

describe("signed gallery file IDs", () => {
  it("accepts its own signatures and rejects anything else", () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    const sig = signFileId("1AbCdEfGhIjKlMnOp");
    expect(verifyFileId("1AbCdEfGhIjKlMnOp", sig)).toBe(true);
    expect(verifyFileId("1AbCdEfGhIjKlMnOq", sig)).toBe(false);
    expect(verifyFileId("1AbCdEfGhIjKlMnOp", null)).toBe(false);
    expect(verifyFileId("1AbCdEfGhIjKlMnOp", "0".repeat(32))).toBe(false);
  });

  it("changes when the secret changes", () => {
    process.env.NEXTAUTH_SECRET = "one";
    const a = signFileId("1AbCdEfGhIjKlMnOp");
    process.env.NEXTAUTH_SECRET = "two";
    expect(verifyFileId("1AbCdEfGhIjKlMnOp", a)).toBe(false);
  });
});

describe("readServiceAccount", () => {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 1024 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const key = { client_email: "gallery@sanchari.iam.gserviceaccount.com", private_key: pem.replace(/\n/g, "\\n") };

  it("reads pasted JSON and turns escaped newlines back into real ones", () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify(key);
    const account = readServiceAccount();
    expect(account?.client_email).toBe(key.client_email);
    expect(account?.private_key).toContain("\n");
    expect(account?.token_uri).toBe("https://oauth2.googleapis.com/token");
  });

  it("reads base64-encoded JSON", () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = Buffer.from(JSON.stringify(key)).toString("base64");
    expect(readServiceAccount()?.client_email).toBe(key.client_email);
  });

  it("returns null when missing or broken", () => {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    expect(readServiceAccount()).toBeNull();
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = "{not json";
    expect(readServiceAccount()).toBeNull();
  });
});

describe("gallery image proxy", () => {
  const call = (id: string, query: string) =>
    GET(new Request(`https://example.com/api/gallery/${id}?${query}`), { params: { id } });

  it("refuses unsigned or malformed requests before touching Drive", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    expect((await call("1AbCdEfGhIjKlMnOp", "w=480")).status).toBe(404);
    expect((await call("1AbCdEfGhIjKlMnOp", `w=480&sig=${"a".repeat(32)}`)).status).toBe(404);
    expect((await call("../../etc", `sig=${signFileId("../../etc")}`)).status).toBe(404);
  });

  it("answers 404 when the gallery isn't configured", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const id = "1AbCdEfGhIjKlMnOp";
    expect((await call(id, `w=480&sig=${signFileId(id)}`)).status).toBe(404);
  });
});
