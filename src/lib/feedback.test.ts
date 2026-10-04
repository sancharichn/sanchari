import { describe, expect, it } from "vitest";
import {
  buildResponseSchema,
  guessTopic,
  newQuestionId,
  normaliseWhatsApp,
  parseExtraQuestions,
  qualityFlags,
  scoreResponses,
  stepForField,
  writerLabel,
  type ExtraQuestion,
} from "./feedback";

const extras: ExtraQuestion[] = [
  { id: "kidsgames01", type: "stars", label: "Kids' games", help: "", options: [], required: true },
  { id: "pace000001", type: "choice", label: "Pace", help: "", options: ["Too slow", "Just right", "Too fast"], required: false },
  { id: "ideas00001", type: "text", label: "Game ideas", help: "", options: [], required: false },
  { id: "guide00001", type: "scale", label: "Guide", help: "", options: [], required: false },
];

const valid = {
  anonymous: false,
  name: "Anu Mathew",
  whatsapp: "98765 43210",
  groupSize: 3,
  overall: 5,
  ratings: { venue: "EXCELLENT", food: "GOOD", travel: "NA", planning: "GOOD", value: "NEEDS_WORK" },
  comeAgain: "YES",
  extras: { kidsgames01: 4, pace000001: "Just right", ideas00001: "  Tug of war again  ", guide00001: "" },
  loved: "The sadya by the lake",
  leaderIdea: "",
  nextPlace: "Yercaud",
  shareOk: true,
};

describe("normaliseWhatsApp", () => {
  it("adds +91 to Indian mobiles written in any common way", () => {
    expect(normaliseWhatsApp("98765 43210")).toBe("+919876543210");
    expect(normaliseWhatsApp("+91 98765-43210")).toBe("+919876543210");
    expect(normaliseWhatsApp("09876543210")).toBe("+919876543210");
    expect(normaliseWhatsApp("0091 9876543210")).toBe("+919876543210");
  });

  it("keeps full international numbers", () => {
    expect(normaliseWhatsApp("+44 7700 900123")).toBe("+447700900123");
    expect(normaliseWhatsApp("+1 (415) 555-0100")).toBe("+14155550100");
  });

  it("rejects numbers that can't be WhatsApp numbers", () => {
    expect(normaliseWhatsApp("12345")).toBeNull();
    expect(normaliseWhatsApp("044 2345 6789")).toBeNull();
    expect(normaliseWhatsApp("call me")).toBeNull();
  });
});

describe("buildResponseSchema", () => {
  const schema = buildResponseSchema(extras);

  it("accepts a complete response and tidies the answers", () => {
    const parsed = schema.parse(valid);
    expect(parsed.extras).toEqual({ kidsgames01: 4, pace000001: "Just right", ideas00001: "Tug of war again", guide00001: null });
    expect(parsed.leaderIdea).toBeNull();
    expect(parsed.groupSize).toBe(3);
  });

  it("lets anonymous people leave out their name", () => {
    expect(schema.safeParse({ ...valid, anonymous: true, name: "", whatsapp: "" }).success).toBe(true);
  });

  it("asks for a name unless the response is anonymous", () => {
    const result = schema.safeParse({ ...valid, name: " " });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path.join("."))).toContain("name");
  });

  it("checks the WhatsApp number only when one is given", () => {
    expect(schema.safeParse({ ...valid, whatsapp: "" }).success).toBe(true);
    const bad = schema.safeParse({ ...valid, whatsapp: "12345" });
    expect(bad.error?.issues.map((i) => i.path.join("."))).toContain("whatsapp");
  });

  it("requires the overall rating and every standard aspect", () => {
    const result = schema.safeParse({ ...valid, overall: 0, ratings: { ...valid.ratings, food: undefined } });
    const paths = result.error?.issues.map((i) => i.path.join("."));
    expect(paths).toContain("overall");
    expect(paths).toContain("ratings.food");
  });

  it("enforces required extras and valid options", () => {
    const result = schema.safeParse({ ...valid, extras: { kidsgames01: 0, pace000001: "Very fast" } });
    const paths = result.error?.issues.map((i) => i.path.join("."));
    expect(paths).toContain("extras.kidsgames01");
    expect(paths).toContain("extras.pace000001");
  });

  it("treats a blank group size as unknown", () => {
    expect(schema.parse({ ...valid, groupSize: "" }).groupSize).toBeNull();
    expect(schema.safeParse({ ...valid, groupSize: 0.5 }).success).toBe(false);
  });
});

describe("stepForField", () => {
  it("sends each error back to its step", () => {
    expect(stepForField("whatsapp")).toBe(1);
    expect(stepForField("ratings.food")).toBe(2);
    expect(stepForField("comeAgain")).toBe(2);
    expect(stepForField("extras.kidsgames01")).toBe(3);
    expect(stepForField("leaderIdea")).toBe(4);
  });
});

describe("parseExtraQuestions", () => {
  it("keeps valid questions and drops broken ones", () => {
    const stored = [
      extras[0],
      { id: "x", type: "stars", label: "Too short id" },
      { id: "choice0001", type: "choice", label: "Only one option", options: ["Yes"] },
      "not a question",
    ];
    expect(parseExtraQuestions(stored).map((q) => q.id)).toEqual(["kidsgames01"]);
    expect(parseExtraQuestions(null)).toEqual([]);
  });

  it("makes ids that pass its own checks", () => {
    for (let i = 0; i < 20; i++) expect(newQuestionId()).toMatch(/^[a-z0-9]{6,16}$/);
  });
});

describe("qualityFlags", () => {
  it("flags very quick submissions and links", () => {
    expect(qualityFlags(["Lovely trip"], 300)).toEqual([]);
    expect(qualityFlags(["Lovely trip"], 10)).toEqual(["quick"]);
    expect(qualityFlags(["Cheap deals at www.example.com"], null)).toEqual(["link"]);
    expect(qualityFlags([null, "see example.in"], 90)).toEqual(["link"]);
  });
});

describe("guessTopic", () => {
  it("puts ideas under a sensible topic", () => {
    expect(guessTopic("More veg options at lunch", "IDEA")).toBe("Food");
    expect(guessTopic("Start earlier to beat the traffic", "IDEA")).toBe("Travel and transport");
    expect(guessTopic("Bonfire games for the kids", "IDEA")).toBe("Activities and games");
    expect(guessTopic("Carry a first aid kit", "IDEA")).toBe("Safety");
    expect(guessTopic("Yercaud", "PLACE")).toBe("Destinations");
    expect(guessTopic("അടുത്ത തവണ കൂടുതൽ സമയം", "IDEA")).toBe("Other");
  });
});

describe("scoreResponses", () => {
  it("adds up ratings, extras and group sizes", () => {
    const scores = scoreResponses(
      [
        {
          overall: 5,
          comeAgain: "YES",
          groupSize: 3,
          ratings: { venue: "EXCELLENT", food: "GOOD", travel: "NA" },
          extras: { kidsgames01: 4, pace000001: "Just right", ideas00001: "Tug of war" },
        },
        {
          overall: 3,
          comeAgain: "MAYBE",
          groupSize: null,
          ratings: { venue: "NEEDS_WORK", food: "GOOD", travel: "GOOD" },
          extras: { kidsgames01: 2, pace000001: "Too fast", guide00001: "EXCELLENT" },
        },
      ],
      extras,
    );

    expect(scores.n).toBe(2);
    expect(scores.people).toBe(4);
    expect(scores.overall.average).toBe(4);
    expect(scores.overall.counts).toEqual([0, 0, 1, 0, 1]);
    expect(scores.comeAgain.yesShare).toBe(0.5);

    const venue = scores.aspects.find((a) => a.id === "venue")!;
    expect(venue.counts).toEqual({ EXCELLENT: 1, GOOD: 0, NEEDS_WORK: 1, answered: 2 });
    const travel = scores.aspects.find((a) => a.id === "travel")!;
    expect(travel.counts.answered).toBe(1);

    const [kids, pace, ideas, guide] = scores.extras;
    expect(kids.kind === "stars" && kids.average).toBe(3);
    expect(pace.kind === "choice" && pace.counts).toEqual([
      { option: "Too slow", count: 0 },
      { option: "Just right", count: 1 },
      { option: "Too fast", count: 1 },
    ]);
    expect(ideas.kind === "text" && ideas.answers).toEqual(["Tug of war"]);
    expect(guide.kind === "scale" && guide.counts.EXCELLENT).toBe(1);
  });

  it("copes with no responses", () => {
    const scores = scoreResponses([], extras);
    expect(scores.overall.average).toBeNull();
    expect(scores.comeAgain.yesShare).toBeNull();
  });
});

describe("writerLabel", () => {
  it("never shows a name for anonymous answers", () => {
    expect(writerLabel({ anonymous: true, name: "Anu Mathew" })).toBe("Anonymous");
    expect(writerLabel({ anonymous: true, name: "Anu Mathew" }, { firstNameOnly: true })).toBe("A traveller");
    expect(writerLabel({ anonymous: false, name: "Anu Mathew" }, { firstNameOnly: true })).toBe("Anu");
  });
});
