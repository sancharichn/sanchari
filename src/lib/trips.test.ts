import { describe, expect, it } from "vitest";
import { dateBlock, formatDateRange, formatINR, fromDateInputValue, toDateInputValue, toPaise, tripDays } from "./format";
import { parseItinerary, rosterPosition, seatSummary, showsSeats, splitRoster, tripTypeLabel, WHO_CAN_JOIN } from "./trips";

const reg = (id: string, minute: number) => ({ id, createdAt: new Date(Date.UTC(2026, 9, 1, 10, minute)) });

describe("splitRoster", () => {
  it("gives seats to the earliest registrations and queues the rest in order", () => {
    const regs = [reg("c", 3), reg("a", 1), reg("d", 4), reg("b", 2)];
    const { confirmed, waitlisted } = splitRoster(regs, 2);
    expect(confirmed.map((r) => r.id)).toEqual(["a", "b"]);
    expect(waitlisted.map((r) => r.id)).toEqual(["c", "d"]);
  });

  it("moves the waitlist up when someone cancels", () => {
    const regs = [reg("a", 1), reg("b", 2), reg("c", 3)];
    expect(rosterPosition(regs, 2, "c")).toEqual({ kind: "waitlist", place: 1 });
    expect(rosterPosition(regs.filter((r) => r.id !== "a"), 2, "c")).toEqual({ kind: "confirmed" });
  });
});

describe("seatSummary", () => {
  it("reports seats left and the waitlist", () => {
    expect(seatSummary(12, 20)).toMatchObject({ taken: 12, left: 8, waitlist: 0 });
    expect(seatSummary(23, 20)).toMatchObject({ taken: 20, left: 0, waitlist: 3, ratio: 1 });
  });
});

describe("tripTypeLabel", () => {
  const day = fromDateInputValue("2026-11-14");
  const next = fromDateInputValue("2026-11-15");

  it("names the type, with the length for longer trips", () => {
    expect(tripTypeLabel("DAY_TRIP", day, day)).toBe("Day trip");
    expect(tripTypeLabel("MEETUP", day, day)).toBe("Meetup");
    expect(tripTypeLabel("STAY_BACK", day, next)).toBe("2-day stay-back trip");
    expect(tripTypeLabel("TREK", day, fromDateInputValue("2026-11-16"))).toBe("3-day trek");
    expect(tripTypeLabel("INTERNATIONAL", day, fromDateInputValue("2026-11-19"))).toBe("6-day international trip");
  });

  it("doesn't call a trip over several days a day trip", () => {
    expect(tripTypeLabel("DAY_TRIP", day, next)).toBe("2-day trip");
  });

  it("says who can join every type", () => {
    expect(WHO_CAN_JOIN.MEETUP).toMatch(/open to everyone/i);
    expect(WHO_CAN_JOIN.DAY_TRIP).toMatch(/two meetups in a row/);
    expect(Object.values(WHO_CAN_JOIN).every((text) => text.length > 20)).toBe(true);
  });
});

describe("showsSeats", () => {
  it("leaves out the headcount of trips that were run outside the site", () => {
    expect(showsSeats("COMPLETED", 0)).toBe(false);
    expect(showsSeats("ONGOING", 0)).toBe(false);
    expect(showsSeats("COMPLETED", 14)).toBe(true);
    expect(showsSeats("OPEN", 0)).toBe(true);
    expect(showsSeats("FULL", 20)).toBe(true);
  });
});

describe("dates in India time", () => {
  const start = fromDateInputValue("2026-11-07");
  const end = fromDateInputValue("2026-11-09");

  it("round-trips date inputs", () => {
    expect(toDateInputValue(start)).toBe("2026-11-07");
  });

  it("formats ranges compactly", () => {
    expect(formatDateRange(start, end)).toBe("7–9 Nov 2026");
    expect(formatDateRange(fromDateInputValue("2026-11-30"), fromDateInputValue("2026-12-02"))).toBe("30 Nov – 2 Dec 2026");
    expect(formatDateRange(start, start)).toBe("7 Nov 2026");
    expect(dateBlock(start, end)).toEqual({ days: "7–9", label: "Nov 2026" });
  });

  it("counts trip days inclusively", () => {
    expect(tripDays(start, end)).toBe(3);
    expect(tripDays(start, start)).toBe(1);
  });
});

describe("money", () => {
  it("converts rupee strings to paise without float drift", () => {
    expect(toPaise("1234.5")).toBe(123450);
    expect(toPaise("0.1")).toBe(10);
    expect(toPaise(19.99)).toBe(1999);
    expect(toPaise("4500")).toBe(450000);
  });

  it("formats rupees in the Indian style", () => {
    expect(formatINR(125000)).toBe("₹1,25,000");
    expect(formatINR("4500.50")).toBe("₹4,500.50");
  });
});

describe("parseItinerary", () => {
  it("keeps valid days and tolerates plain strings", () => {
    expect(parseItinerary([{ title: "Day one" }, "Day two", { nope: true }, 42])).toEqual([
      { title: "Day one", details: "" },
      { title: "Day two", details: "" },
    ]);
    expect(parseItinerary(null)).toEqual([]);
  });
});
