"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { isActivePath, type NavLink } from "./nav-config";

export function MobileNav({ links, signedIn }: { links: NavLink[]; signedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the menu after navigating.
  useEffect(() => setOpen(false), [pathname]);

  const all: NavLink[] = [
    { href: "/", label: "Home" },
    ...links,
    signedIn ? { href: "/profile", label: "Your trips and details" } : { href: "/signin", label: "Sign in" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex size-10 items-center justify-center rounded-[10px] border border-ridge text-mist md:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="top-4 max-w-none translate-y-0 data-[state=open]:slide-in-from-top-4">
        <DialogTitle className="text-base">Menu</DialogTitle>
        <nav aria-label="Main">
          <ul className="grid gap-1">
            {all.map((link) => {
              const active = link.href === "/" ? pathname === "/" : isActivePath(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "stretch-semiwide block rounded-[10px] px-3 py-3 text-xl font-bold transition-colors hover:bg-white/[0.04]",
                      active ? "text-signal" : "text-mist",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </DialogContent>
    </Dialog>
  );
}
