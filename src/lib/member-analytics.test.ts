import { describe, expect, it } from "vitest";
import { repeatMemberMetrics, cancellationRate } from "./member-analytics";
import { permits } from "./permissions";
describe("operational metrics and role boundaries", () => {
  it("counts distinct attended trips per booking holder", () => {
    expect(repeatMemberMetrics([{ userId: "a", tripId: "1" },{ userId: "a", tripId: "1" },{ userId: "a", tripId: "2" },{ userId: "b", tripId: "2" }])).toEqual({ members: 2, repeat: 1, rate: 50 });
    expect(repeatMemberMetrics([])).toEqual({ members: 0, repeat: 0, rate: 0 });
    expect(cancellationRate(8,2)).toBe(20); expect(cancellationRate(0,0)).toBe(0);
  });
  it("grants only the selected staff capability", () => {
    for (const capability of ["admin","finance","lead","moderate"] as const) {
      expect(permits("ADMIN",null,capability)).toBe(true);
      expect(permits("MEMBER",null,capability,true)).toBe(false);
      expect(permits("MEMBER","FINANCE",capability,true)).toBe(capability === "finance");
      expect(permits("MEMBER","MODERATOR",capability,true)).toBe(capability === "moderate");
      expect(permits("MEMBER","LEADER",capability,false)).toBe(false);
      expect(permits("MEMBER","LEADER",capability,true)).toBe(capability === "lead");
    }
  });
});
