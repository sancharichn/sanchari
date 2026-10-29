import { prisma } from "@/lib/prisma";

export async function getBirthdayContacts() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null, OR: [{ birthdayMonth: { not: null }, birthdayDay: { not: null } }, { familyMembers: { some: { birthdayMonth: { not: null }, birthdayDay: { not: null } } } }] },
    select: { id: true, name: true, email: true, phone: true, whatsappNumber: true, whatsappOptIn: true, image: true, birthdayMonth: true, birthdayDay: true, familyMembers: { select: { id: true, name: true, relationship: true, image: true, birthdayMonth: true, birthdayDay: true } } },
  });
  const contacts = users.flatMap((user) => [
    ...(user.birthdayMonth && user.birthdayDay ? [{ id: user.id, accountId: user.id, name: user.name || "Sanchari member", accountName: user.name || "Sanchari member", email: user.email, phone: user.whatsappNumber || user.phone, whatsappOptIn: user.whatsappOptIn, image: user.image, month: user.birthdayMonth, day: user.birthdayDay, relationship: "Member" }] : []),
    ...user.familyMembers.filter((family) => family.birthdayMonth && family.birthdayDay).map((family) => ({ id: family.id, accountId: user.id, name: family.name, accountName: user.name || user.email, email: user.email, phone: user.whatsappNumber || user.phone, whatsappOptIn: user.whatsappOptIn, image: family.image, month: family.birthdayMonth!, day: family.birthdayDay!, relationship: family.relationship })),
  ]);
  return contacts.sort((a, b) => a.month - b.month || a.day - b.day || a.name.localeCompare(b.name));
}
