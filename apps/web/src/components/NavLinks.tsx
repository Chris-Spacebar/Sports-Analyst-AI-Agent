"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/picks", label: "Picks" },
  { href: "/track-record", label: "Track record" },
  { href: "/markets", label: "Live prices" }
];

const isActive = (href: string, pathname: string): boolean => {
  if (href === "/") return pathname === "/";
  if (href === "/picks") {
    return (
      pathname.startsWith("/picks") ||
      pathname.startsWith("/event/") ||
      pathname.startsWith("/research")
    );
  }
  if (href === "/markets") {
    return pathname.startsWith("/markets") || pathname.startsWith("/market/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={isActive(l.href, pathname) ? "nav-active" : undefined}>
          {l.label}
        </Link>
      ))}
    </>
  );
}
