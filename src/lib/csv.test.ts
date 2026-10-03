import { describe, expect, it } from "vitest";
import { slugify, toCsv } from "./csv";
import { tripSchema } from "./validation";

describe("toCsv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(toCsv([["a,b", 'say "hi"', "two\nlines"]])).toBe('﻿"a,b","say ""hi""","two\nlines"\r\n');
  });

  it("defuses spreadsheet formulas", () => {
    const csv = toCsv([["=HYPERLINK(\"x\")", "+91 98400 12345", "-5", "@cmd"]]);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain("'+91 98400 12345");
    expect(csv).toContain("'-5");
    expect(csv).toContain("'@cmd");
  });
});

describe("slugify", () => {
  it("makes safe file names", () => {
    expect(slugify("Kolli Hills: night trek!")).toBe("kolli-hills-night-trek");
    expect(slugify("!!!")).toBe("trip");
  });
});

describe("tripSchema", () => {
  const base = {
    title: "Kolli Hills night trek",
    location: "Namakkal",
    description: "A night walk to the falls.",
    startDate: "2026-11-07",
    endDate: "2026-11-09",
    maxCapacity: "20",
    budgetEst: "4500",
    status: "OPEN",
    itinerary: [
      { title: "Night bus", details: "" },
      { title: "", details: "" },
    ],
  };

  it("drops empty itinerary days and parses numbers", () => {
    const parsed = tripSchema.parse(base);
    expect(parsed.itinerary).toEqual([{ title: "Night bus", details: "" }]);
    expect(parsed.maxCapacity).toBe(20);
    expect(parsed.budgetEst).toBe("4500");
  });

  it("rejects a trip that ends before it starts", () => {
    const result = tripSchema.safeParse({ ...base, endDate: "2026-11-01" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["endDate"]);
  });

  it("asks for a title when a day has details", () => {
    const result = tripSchema.safeParse({ ...base, itinerary: [{ title: "", details: "Bring a torch" }] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["itinerary", 0, "title"]);
  });
});
