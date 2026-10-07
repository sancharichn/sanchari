import { afterEach, describe, expect, it, vi } from "vitest";
import { sendBirthdayEmail } from "./gmail";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("Gmail MIME", () => {
  it("sends CRLF-delimited MIME with escaped UTF-8 subject and inline photo attachment", async () => {
    vi.stubEnv("GMAIL_CLIENT_ID","test"); vi.stubEnv("GMAIL_CLIENT_SECRET","test"); vi.stubEnv("GMAIL_REFRESH_TOKEN","test");
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ access_token:"test-token" }))).mockResolvedValueOnce(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);
    await sendBirthdayEmail("member@example.test", "Birthday ₹ wishes", "<h1>Hello</h1>", "data:image/jpeg;base64,YWJj");
    const sendOptions = fetchMock.mock.calls[1][1];
    const raw = Buffer.from(JSON.parse(sendOptions.body).raw,"base64url").toString();
    expect(raw).toContain("\r\nMIME-Version: 1.0\r\n");
    expect(raw).not.toContain("\\r\\n");
    expect(raw).toContain("Content-ID: <member-photo>");
    expect(raw).toContain("Subject: =?UTF-8?B?");
  });
  it("does not contact Gmail without configured credentials", async () => {
    vi.stubEnv("GMAIL_CLIENT_ID",""); const fetchMock = vi.fn(); vi.stubGlobal("fetch",fetchMock);
    await expect(sendBirthdayEmail("member@example.test","Test","Test")).rejects.toThrow("not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
