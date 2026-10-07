"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/trips", label: "Trips" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/birthdays", label: "Birthdays" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/suggestions", label: "Suggestions" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Organiser" className="-mb-px flex gap-1 overflow-x-auto">
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors",
              active ? "border-signal text-mist" : "border-transparent text-lichen hover:text-mist",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
