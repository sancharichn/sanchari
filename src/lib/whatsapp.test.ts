import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { normalizeWhatsapp, sendPromotionWhatsapp, validWhatsappSignature, whatsappConfigured } from "./whatsapp";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("WhatsApp Cloud API boundary", () => {
  it("requires international numbers and authenticates the exact raw payload", () => {
    expect(normalizeWhatsapp("+91 98765 43210")).toBe("919876543210");
    expect(normalizeWhatsapp("9876543210")).toBeNull();
    const raw = '{"a":1}';
    const signature = "sha256=" + createHmac("sha256", "secret").update(raw).digest("hex");
    expect(validWhatsappSignature(raw, signature, "secret")).toBe(true);
    expect(validWhatsappSignature(raw+" ", signature, "secret")).toBe(false);
    expect(validWhatsappSignature(raw, "sha256=bad", "secret")).toBe(false);
    expect(validWhatsappSignature(raw, null, "secret")).toBe(false);
  });
  it("sends only the configured approved template with the expected parameters", async () => {
    for (const [key,value] of Object.entries({ WHATSAPP_ENABLED: "true", WHATSAPP_ACCESS_TOKEN: "test-token", WHATSAPP_PHONE_NUMBER_ID: "1234", WHATSAPP_API_VERSION: "v99.0", WHATSAPP_PROMOTION_TEMPLATE: "trip_confirmation", WHATSAPP_TEMPLATE_LANGUAGE: "en_US", WHATSAPP_APP_SECRET: "test", WHATSAPP_VERIFY_TOKEN: "test" })) vi.stubEnv(key,value);
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messages: [{ id: "wamid.test" }] }), { status: 200 })); vi.stubGlobal("fetch",request);
    expect(whatsappConfigured()).toBe(true);
    expect(await sendPromotionWhatsapp("919876543210","Nature walk","https://example.test/trips/a","delivery-id")).toBe("wamid.test");
    const [url,init] = request.mock.calls[0];
    expect(url).toBe("https://graph.facebook.com/v99.0/1234/messages");
    expect(JSON.parse(init.body)).toMatchObject({ type: "template", to: "919876543210", biz_opaque_callback_data: "delivery-id", template: { name: "trip_confirmation", components: [{ type: "body", parameters: [{ type: "text", text: "Nature walk" }, { type: "text", text: "https://example.test/trips/a" }] }] } });
    vi.stubEnv("WHATSAPP_ENABLED","false"); await expect(sendPromotionWhatsapp("919876543210","Trip","url","key")).rejects.toThrow(); expect(request).toHaveBeenCalledTimes(1);
  });
});
