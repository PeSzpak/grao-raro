import Link from "next/link";
import { Suspense } from "react";
import { Marca } from "./marca";
import { MenuLinks, MenuPrincipal } from "./menu-principal";
import { BotaoSacola } from "./sacola";

export function Cabecalho() {
  return (
    <header className="cabecalho">
      <Link href="/" aria-label="Grão Raro, página inicial">
        <Marca />
      </Link>
      <Suspense fallback={<MenuLinks />}>
        <MenuPrincipal />
      </Suspense>
      <div className="cabecalho-acoes">
        <details className="menu-celular">
          <summary>Menu</summary>
          <MenuLinks />
        </details>
        <BotaoSacola />
      </div>
    </header>
  );
}
