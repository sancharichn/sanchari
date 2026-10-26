"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { done, fail, invalid, type ActionResult } from "@/lib/action-result";
import { withAudit } from "@/lib/action-audit";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { TRIP_KIND_VALUES } from "@/lib/validation";

const schema = z.object({
  preferredTripKinds: z.array(z.enum(TRIP_KIND_VALUES)).max(TRIP_KIND_VALUES.length),
  travelPace: z.union([z.literal(""), z.enum(["RELAXED", "BALANCED", "ACTIVE"])]).transform((value) => value || null),
  homeArea: z.string().trim().max(80, "Keep your starting area under 80 characters.").transform((value) => value || null),
});

export async function savePersonalization(input: unknown): Promise<ActionResult> {
  return withAudit(async () => {
    const user = await getCurrentUser();
    if (!user) return fail("Sign in to personalise your Sanchari experience.");
    const parsed = schema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    if (!parsed.data.preferredTripKinds.length && !parsed.data.travelPace && !parsed.data.homeArea) return fail("Choose at least one preference so we can personalise your experience.");
    await prisma.user.update({ where: { id: user.id }, data: { ...parsed.data, personalizationUpdatedAt: new Date() } });
    revalidatePath("/"); revalidatePath("/profile"); revalidatePath("/admin/members");
    return done("Your travel preferences are saved. Recommendations now follow your choices.");
  });
}
