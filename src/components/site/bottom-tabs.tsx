"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Home, Images, Map, UserRound, LayoutDashboard, Users, MessageSquare, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { isActivePath } from "./nav-config";

/** App-style tabs along the bottom on phones. Feedback and Organiser stay in the menu. */
export function BottomTabs({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const admin = pathname === "/admin" || pathname.startsWith("/admin/");
  const tabs = admin ? [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/trips", label: "Trips", icon: Map },
    { href: "/admin/members", label: "Members", icon: Users },
    { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
    { href: "/", label: "Website", icon: Globe },
  ] : [
    { href: "/", label: "Home", icon: Home },
    { href: "/trips", label: "Trips", icon: Map },
    { href: "/gallery", label: "Gallery", icon: Images },
    { href: "/faq", label: "About", icon: CircleHelp },
    signedIn
      ? { href: "/profile", label: "You", icon: UserRound }
      : { href: "/signin", label: "Sign in", icon: UserRound },
  ];

  return (
    <nav
      aria-label={admin ? "Admin sections" : "Sections"}
      className="mobile-tab-dock fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-black/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" || href === "/admin" ? pathname === href : isActivePath(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold transition-colors",
                  active ? "text-signal" : "text-lichen hover:text-mist",
                )}
              >
                <Icon className="size-5" aria-hidden="true" strokeWidth={active ? 2.25 : 1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
