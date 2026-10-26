import { describe, expect, it } from "vitest";
import { meetsLandingImageQuality } from "@/lib/drive-quality";

describe("meetsLandingImageQuality", () => {
  it("accepts a hero-quality image", () => expect(meetsLandingImageQuality({ size: "1048576", imageMediaMetadata: { width: 1600, height: 900 } })).toBe(true));
  it("rejects files smaller than one megabyte", () => expect(meetsLandingImageQuality({ size: "1048575", imageMediaMetadata: { width: 4000, height: 3000 } })).toBe(false));
  it("rejects images below the minimum dimensions", () => expect(meetsLandingImageQuality({ size: "3000000", imageMediaMetadata: { width: 1599, height: 899 } })).toBe(false));
  it("uses the displayed orientation", () => expect(meetsLandingImageQuality({ size: "3000000", imageMediaMetadata: { width: 900, height: 1600, rotation: 1 } })).toBe(true));
  it("rejects files without reliable metadata", () => expect(meetsLandingImageQuality({ size: "3000000" })).toBe(false));
});
