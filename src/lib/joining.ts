/**
 * How a new member works up to longer trips, from the group's FAQ. The About & FAQ
 * page and the home page both show these, so the wording lives in one place.
 */
export const JOIN_STEPS = [
  { title: "Meetups", body: "Open to everyone. Every new member starts here." },
  {
    title: "One-day trips and events",
    body: "For members who have come to at least two meetups in a row, as long as there are places.",
  },
  {
    title: "Stay-back, night and multi-day trips",
    body: "For members who have been on at least two or three one-day trips in the last 12 months.",
  },
  {
    title: "International trips",
    body: "For members who have been on at least one or two stay-back or multi-day trips.",
  },
] as const;

export const TREKS_NOTE = "Treks are organised by our Health & Fitness group, which members are introduced to over time.";
