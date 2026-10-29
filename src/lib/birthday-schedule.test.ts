import { describe, expect, it } from "vitest";
import { birthdaySchedule, birthdayTimingLabel } from "./birthday-schedule";

describe("birthday schedule", () => {
  const now = new Date("2026-10-29T06:00:00Z");
  it("places birthdays in non-overlapping day, week and month windows", () => {
    expect(birthdaySchedule(10, 29, now)).toMatchObject({ daysUntil: 0, window: "DAY", year: 2026 });
    expect(birthdaySchedule(10, 30, now)).toMatchObject({ daysUntil: 1, window: "DAY" });
    expect(birthdaySchedule(11, 4, now)).toMatchObject({ daysUntil: 6, window: "WEEK" });
    expect(birthdaySchedule(11, 20, now)).toMatchObject({ daysUntil: 22, window: "MONTH" });
    expect(birthdaySchedule(1, 1, now)).toMatchObject({ window: "LATER", year: 2027 });
  });
  it("moves leap-day wishes to the next valid leap year", () => {
    expect(birthdaySchedule(2, 29, new Date("2027-01-01T00:00:00Z"))).toMatchObject({ year: 2028 });
    expect(birthdayTimingLabel(0)).toBe("Today");
    expect(birthdayTimingLabel(1)).toBe("Tomorrow");
  });
});
