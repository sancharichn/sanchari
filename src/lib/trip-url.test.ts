import { describe, expect, it } from "vitest";
import { tripPath, tripSlugFromTitle } from "./trip-url";

describe("trip URLs", () => {
  it("makes a readable, URL-safe slug from the title", () => {
    expect(tripSlugFromTitle("Camping in the Jawadhu Hills!")).toBe("camping-in-the-jawadhu-hills");
    expect(tripSlugFromTitle("Kodaikānāl & Munnar")).toBe("kodaikanal-munnar");
  });

  it("keeps older records reachable until they receive a slug", () => {
    expect(tripPath({ id: "cmutgjl750000gq04nmd2n8ci", slug: null })).toBe("/trips/cmutgjl750000gq04nmd2n8ci");
    expect(tripPath({ id: "cmutgjl750000gq04nmd2n8ci", slug: "camping-in-the-jawadhu-hills" })).toBe("/trips/camping-in-the-jawadhu-hills");
  });
});
