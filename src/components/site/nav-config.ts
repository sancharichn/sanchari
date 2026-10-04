export type NavLink = { href: string; label: string };

export function navLinksFor(isAdmin: boolean): NavLink[] {
  const links: NavLink[] = [
    { href: "/trips", label: "Trips" },
    { href: "/gallery", label: "Gallery" },
    { href: "/feedback", label: "Feedback" },
    { href: "/faq", label: "About & FAQ" },
  ];
  if (isAdmin) links.push({ href: "/admin", label: "Organiser" });
  return links;
}

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
