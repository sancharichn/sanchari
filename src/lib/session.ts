import "server-only";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  role: Role;
  email: string | null;
  name: string | null;
  image: string | null;
};

/** The signed-in member, with the role freshly read from the database, or null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.id || !user.role) return null;
  return {
    id: user.id,
    role: user.role,
    email: user.email ?? null,
    name: user.name ?? null,
    image: user.image ?? null,
  };
}

/** Same as getCurrentUser, but a database outage degrades to "signed out" instead of an error page. */
export async function getCurrentUserSafe(): Promise<CurrentUser | null> {
  try {
    return await getCurrentUser();
  } catch (error) {
    console.error("[session] Could not read the session", error);
    return null;
  }
}

/** For pages: send signed-out visitors to the sign-in page and back again afterwards. */
export async function requireUser(callbackUrl: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}

/** For admin pages and actions: anyone who isn't ADMIN gets a 404, signed in or not. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") notFound();
  return user;
}

export function isAdmin(user: CurrentUser | null): boolean {
  return user?.role === "ADMIN";
}
