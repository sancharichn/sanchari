import { prisma } from "@/lib/prisma";

export async function getBirthdayContacts() {
  const users = await prisma.user.findMany({
    where: { OR: [{ birthdayMonth: { not: null }, birthdayDay: { not: null } }, { familyMembers: { some: { birthdayMonth: { not: null }, birthdayDay: { not: null } } } }] },
    select: { id: true, name: true, email: true, phone: true, image: true, birthdayMonth: true, birthdayDay: true, familyMembers: { select: { id: true, name: true, relationship: true, image: true, birthdayMonth: true, birthdayDay: true } } },
  });
  const contacts = users.flatMap((user) => [
    ...(user.birthdayMonth && user.birthdayDay ? [{ id: user.id, name: user.name || "Sanchari member", email: user.email, phone: user.phone, image: user.image, month: user.birthdayMonth, day: user.birthdayDay, relationship: "Member" }] : []),
    ...user.familyMembers.filter((family) => family.birthdayMonth && family.birthdayDay).map((family) => ({ id: family.id, name: family.name, email: user.email, phone: user.phone, image: family.image || user.image, month: family.birthdayMonth!, day: family.birthdayDay!, relationship: family.relationship })),
  ]);
  return contacts.sort((a, b) => a.month - b.month || a.day - b.day || a.name.localeCompare(b.name));
}
