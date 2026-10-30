import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GradeProdutos } from "@/components/grade-produtos";
import { produtosDaVitrine } from "@/lib/vitrine";

export const metadata: Metadata = { title: "Cafés" };

// Os processos do catálogo agrupados como a torrefação fala deles.
const PROCESSOS: Record<string, (processo: string) => boolean> = {
  Lavados: (p) => p === "Lavado",
  Naturais: (p) => p === "Natural",
  "Cereja descascado": (p) => p === "Cereja descascado",
  Fermentados: (p) => /ferment|anaer/i.test(p),
};

export default function Cafes({ searchParams }: PageProps<"/cafes">) {
  return (
    <main className="pagina">
      <div className="pagina-cabeca">
        <div>
          <h1 className="titulo">Cafés</h1>
          <p className="lead suave" style={{ marginTop: 16, maxWidth: "40ch" }}>
            Lotes pequenos, com fazenda, altitude e processo na etiqueta. Preço por pacote.
          </p>
        </div>
        <Suspense>
          <Filtros searchParams={searchParams} />
        </Suspense>
      </div>
      <Suspense fallback={<p className="suave">Carregando os lotes</p>}>
        <Lista searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Filtros({ searchParams }: Pick<PageProps<"/cafes">, "searchParams">) {
  const { processo } = await searchParams;
  return (
    <nav className="filtros" aria-label="Filtrar por processo">
      <Link href="/cafes" aria-current={!processo ? "page" : undefined}>
        Todos
      </Link>
      {Object.keys(PROCESSOS).map((p) => (
        <Link key={p} href={`/cafes?processo=${encodeURIComponent(p)}`} aria-current={processo === p ? "page" : undefined}>
          {p}
        </Link>
      ))}
    </nav>
  );
}

async function Lista({ searchParams }: Pick<PageProps<"/cafes">, "searchParams">) {
  const { processo } = await searchParams;
  const cafes = await produtosDaVitrine({ categoria: "cafes" });
  const filtro = typeof processo === "string" ? PROCESSOS[processo] : undefined;
  const filtrados = filtro ? cafes.filter((c) => c.processo && filtro(c.processo)) : cafes;
  return <GradeProdutos produtos={filtrados} />;
}
