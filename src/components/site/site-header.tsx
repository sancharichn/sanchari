import Link from "next/link";
import type { CurrentUser } from "@/lib/session";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";
import { navLinksFor } from "./nav-config";
import { NavLinks } from "./nav-links";
import { Wordmark } from "./wordmark";

export function SiteHeader({ user }: { user: CurrentUser | null }) {
  const links = navLinksFor(user?.role === "ADMIN");

  return (
    <header className="site-header sticky top-0 z-40 border-b border-white/[0.06] bg-black/80 backdrop-blur-md">
      <nav aria-label="Main" className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="rounded-md" aria-label="Sanchari Chennai, home">
          <Wordmark />
        </Link>

        <div className="flex items-center gap-2 md:gap-6">
          <NavLinks links={links} />
          {user ? (
            <Link
              href="/profile"
              className="hidden items-center gap-2.5 rounded-full py-1 pl-1 pr-3 text-sm font-semibold text-mist transition-colors hover:bg-white/[0.06] md:inline-flex"
            >
              <Avatar name={user.name} image={user.image} />
              <span>Your trips</span>
            </Link>
          ) : (
            <Link href="/signin" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden md:inline-flex")}>
              Sign in
            </Link>
          )}
          <MobileNav links={links} signedIn={Boolean(user)} />
        </div>
      </nav>
    </header>
  );
}

export function Avatar({ name, image, size = 28 }: { name: string | null; image: string | null; size?: number }) {
  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small remote avatar, no optimisation needed
      <img
        src={image}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="rounded-full border border-ridge object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="stretch-narrow inline-flex items-center justify-center rounded-full border border-ridge bg-basalt text-xs font-bold text-mist"
      style={{ width: size, height: size }}
    >
      {initial}
    </span>
  );
}
