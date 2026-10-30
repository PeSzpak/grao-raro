import Link from "next/link";
import { BotaoSacola } from "./sacola";

export function Cabecalho() {
  return (
    <header className="cabecalho">
      <Link href="/" className="marca">
        Grão Raro
      </Link>
      <nav className="menu-principal" aria-label="Principal">
        <Link href="/cafes">Cafés</Link>
        <Link href="/equipamentos">Equipamentos</Link>
        <Link href="/metodos">Métodos</Link>
      </nav>
      <BotaoSacola />
    </header>
  );
}
