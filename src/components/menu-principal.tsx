"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/cafes", "Cafés"],
  ["/equipamentos", "Equipamentos"],
  ["/metodos", "Métodos"],
] as const;

export function MenuLinks({ atual }: { atual?: string }) {
  return (
    <nav className="menu-principal" aria-label="Principal">
      {LINKS.map(([href, nome]) => (
        <Link key={href} href={href} aria-current={atual?.startsWith(href) ? "page" : undefined}>
          {nome}
        </Link>
      ))}
    </nav>
  );
}

export function MenuPrincipal() {
  return <MenuLinks atual={usePathname()} />;
}
