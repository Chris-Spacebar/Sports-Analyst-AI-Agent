"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/events", label: "Events" },
  { href: "/markets", label: "Markets" },
  { href: "/research", label: "Research" }
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`) ||
          (l.href === "/events" && pathname.startsWith("/event/")) ||
          (l.href === "/markets" && pathname.startsWith("/market/"));
        return (
          <Link key={l.href} href={l.href} className={active ? "nav-active" : undefined}>
            {l.label}
          </Link>
        );
      })}
    </>
  );
}
