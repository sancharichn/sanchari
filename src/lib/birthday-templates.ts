export const BIRTHDAY_TEMPLATES = [
  { id: "trail-light", title: "Trail light", subject: "Happy birthday, {{name}}!", body: "Happy birthday, {{name}}! May the year ahead bring you new trails, kind people and plenty of reasons to pause and take in the view. With warm wishes from everyone at Sanchari Chennai." },
  { id: "travel-nature", title: "Travel with Nature", subject: "A birthday wish from Sanchari Chennai", body: "Happy birthday, {{name}}. We hope your next trip around the sun is filled with fresh air, open roads and beautiful places. Keep travelling with nature!" },
  { id: "campfire", title: "Campfire cheer", subject: "Campfire cheers for {{name}}", body: "Campfire cheers, {{name}}! Thank you for being part of our travelling community. Wishing you a joyful birthday and many memorable journeys ahead." },
  { id: "yellow-trail", title: "Yellow trail", subject: "Keep following the yellow trail, {{name}}", body: "Happy birthday, {{name}}! Keep following the yellow trail toward good adventures, good company and a year that feels like a favourite trip." },
  { id: "simple-warmth", title: "Simple warmth", subject: "Warm birthday wishes, {{name}}", body: "Warm birthday wishes, {{name}}. From all of us at Sanchari Chennai, may your day be gentle, bright and full of people who make you smile." },
] as const;

export function birthdayMessage(templateId: string, name: string) {
  const template = BIRTHDAY_TEMPLATES.find((item) => item.id === templateId) ?? BIRTHDAY_TEMPLATES[0];
  return { subject: template.subject.replaceAll("{{name}}", name), body: template.body.replaceAll("{{name}}", name) };
}
