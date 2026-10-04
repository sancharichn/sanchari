import { describe, expect, it } from "vitest";
import { registrationSchema } from "./validation";

describe("registrationSchema", () => {
  const base = {
    phone: "98400 12345",
    emergencyContact: "Ravi (brother), 98400 54321",
    bloodGroup: "",
    vehicleDetails: "",
    agreesToGuidelines: true,
  };

  it("accepts a registration that agrees to the guidelines", () => {
    const parsed = registrationSchema.parse(base);
    expect(parsed.agreesToGuidelines).toBe(true);
    expect(parsed.vehicleDetails).toBeNull();
  });

  it("won't register anyone who hasn't ticked the guidelines box", () => {
    for (const agreesToGuidelines of [false, undefined, "true"]) {
      const result = registrationSchema.safeParse({ ...base, agreesToGuidelines });
      expect(result.success).toBe(false);
      const issue = result.error?.issues.find((i) => i.path[0] === "agreesToGuidelines");
      expect(issue?.message).toMatch(/tick this box/i);
    }
  });
});
