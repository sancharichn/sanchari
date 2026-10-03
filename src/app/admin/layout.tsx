import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Every /admin page renders inside this layout, which re-checks the role
 * against the database. Non-admins get the standard 404.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
