import type { NextAuthOptions } from "next-auth";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import { auditedTransaction, prisma } from "@/lib/prisma";

/** The one account that is promoted to ADMIN. Everyone else signs in as MEMBER. */
export function adminEmail() {
  return (process.env.ADMIN_EMAIL || "sanchari.chn@gmail.com").trim().toLowerCase();
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/signin", error: "/signin" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    /**
     * Creates the member record on first sign-in. Only Google accounts with a
     * verified email get in. ADMIN_EMAIL is promoted to ADMIN; nobody else is
     * ever promoted here, and existing roles are left as they are in the DB.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return false;

      const googleProfile = profile as GoogleProfile | undefined;
      const email = (googleProfile?.email ?? user.email ?? "").trim().toLowerCase();
      if (!email || googleProfile?.email_verified === false) return false;

      const isAdmin = email === adminEmail();
      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, deletedAt: true } });
      if (existing?.deletedAt) return false;
      await auditedTransaction(existing?.id ?? null, () => prisma.user.upsert({
        where: { email },
        create: {
          email,
          name: user.name ?? null,
          image: user.image ?? null,
          role: isAdmin ? "ADMIN" : "MEMBER",
        },
        update: {
          name: user.name ?? undefined,
          ...(isAdmin ? { role: "ADMIN" as const } : {}),
        },
      }));
      return true;
    },

    /**
     * Runs at sign-in and every time the session is read, so the role always
     * comes from the database rather than from whatever was true at sign-in.
     */
    async jwt({ token }) {
      const email = token.email?.toLowerCase();
      if (!email) return token;

      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true, staffRole: true, deletedAt: true, name: true, image: true },
      });

      if (!dbUser || dbUser.deletedAt) {
        // The member record was removed: keep the cookie inert.
        delete token.uid;
        delete token.role;
        delete token.staffRole;
        return token;
      }

      token.uid = dbUser.id;
      token.role = dbUser.role;
      token.staffRole = dbUser.staffRole;
      token.name = dbUser.name;
      // Uploaded images stay in the database; a photo must never inflate the session cookie.
      token.picture = dbUser.image?.startsWith("data:") ? null : dbUser.image;
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid;
        session.user.role = token.role;
        session.user.staffRole = token.staffRole;
        session.user.name = token.name ?? session.user.name;
        session.user.image = (token.picture as string | null | undefined) ?? session.user.image;
      }
      return session;
    },
  },
};
