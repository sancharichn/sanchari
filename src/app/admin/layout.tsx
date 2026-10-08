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
    <div className="admin-workspace">
      <aside className="admin-sidebar"><AdminNav /></aside>
      <div className="admin-workspace-content">
        <header className="admin-mobile-bar"><p className="font-bold text-mist">Sanchari Ops</p><p className="text-xs text-lichen">Organiser workspace</p></header>
        {children}
      </div>
    </div>
  );
}
