import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Every /admin page renders inside this layout, which re-checks the role
 * against the database. Non-admins get the standard 404.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <div className="border-b border-ridge bg-basalt/60">
        <div className="container pt-8">
          <p className="text-sm text-lichen">Organiser tools</p>
          <div className="mt-3">
            <AdminNav />
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
