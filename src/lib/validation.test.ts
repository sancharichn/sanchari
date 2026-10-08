import { describe, expect, it } from "vitest";
import { profileSchema, registrationSchema } from "./validation";

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

describe("profile birthday dates", () => {
  const profile = { phone: "98400 12345", emergencyContact: "Ravi (brother), 98400 54321", bloodGroup: "", image: "", familyMembers: [] };

  it("accepts day/month birthdays, including February 29, without storing a year", () => {
    expect(profileSchema.safeParse({ ...profile, birthdayMonth: 2, birthdayDay: 29 }).success).toBe(true);
    expect(profileSchema.safeParse({ ...profile, birthdayMonth: "", birthdayDay: "" }).success).toBe(true);
  });

  it("rejects incomplete and impossible birthday selections", () => {
    for (const birthday of [{ birthdayMonth: 2, birthdayDay: 30 }, { birthdayMonth: 4, birthdayDay: 31 }, { birthdayMonth: 5, birthdayDay: "" }]) {
      expect(profileSchema.safeParse({ ...profile, ...birthday }).success).toBe(false);
    }
  });
});
