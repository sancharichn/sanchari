"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const GROUPS = [
  { label: "Operate", links: [{ href: "/admin", label: "Control room", exact: true }, { href: "/admin/trips", label: "Trips" }, { href: "/admin/members", label: "Members" }, { href: "/admin/shop", label: "Shop" }] },
  { label: "Member care", links: [{ href: "/admin/feedback", label: "Feedback" }, { href: "/admin/suggestions", label: "Suggestions" }, { href: "/admin/birthdays", label: "Birthdays" }] },
  { label: "Governance", links: [{ href: "/admin/notifications", label: "Delivery" }, { href: "/admin/reports", label: "Reports" }, { href: "/admin/analytics", label: "Analytics" }] },
  { label: "Administration", links: [{ href: "/admin/access", label: "Staff access" }, { href: "/admin/activity", label: "Activity history" }, { href: "/admin/data-requests", label: "Data requests" }] },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Organiser workspace" className="admin-nav">
      <div className="admin-nav-brand">
        <span className="admin-nav-mark" aria-hidden="true">S</span>
        <div><p className="font-bold text-mist">Sanchari Ops</p><p className="text-xs text-lichen">Travel with nature</p></div>
      </div>
      <div className="admin-nav-groups">
        {GROUPS.map((group) => (
          <div key={group.label} className="admin-nav-group">
            <p className="admin-nav-group-label">{group.label}</p>
            <div className="admin-nav-links">
              {group.links.map((link) => {
                const active = link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
                return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={cn("admin-nav-link", active && "admin-nav-link-active")}>{link.label}</Link>;
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="admin-nav-foot">Private organiser workspace</p>
    </nav>
  );
}
