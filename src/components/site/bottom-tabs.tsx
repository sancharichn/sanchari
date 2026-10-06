"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Home, Images, Map, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { isActivePath } from "./nav-config";

/** App-style tabs along the bottom on phones. Feedback and Organiser stay in the menu. */
export function BottomTabs({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const tabs = [
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
      aria-label="Sections"
      className="mobile-tab-dock fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-black/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : isActivePath(pathname, href);
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
