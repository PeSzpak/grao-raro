import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Calculadora } from "@/components/calculadora";
import { AdicionarKit } from "@/components/sacola";
import { formatarBRL } from "@/domain/dinheiro";
import { foto, metodoDaVitrine, unsplash } from "@/lib/vitrine";

export async function generateMetadata({ params }: PageProps<"/metodos/[slug]">): Promise<Metadata> {
  const metodo = await metodoDaVitrine((await params).slug);
  return metodo ? { title: metodo.nome, description: metodo.resumo } : {};
}

export default function PaginaMetodo({ params }: PageProps<"/metodos/[slug]">) {
  return (
    <main className="pagina">
      <Suspense fallback={<p className="suave">Carregando o guia</p>}>
        <Metodo params={params} />
      </Suspense>
    </main>
  );
}

async function Metodo({ params }: Pick<PageProps<"/metodos/[slug]">, "params">) {
  const { slug } = await params;
  const m = await metodoDaVitrine(slug);
  if (!m) notFound();
  const total = m.kit.reduce((t, p) => t + p.precoCentavos, 0);

  return (
    <>
      <div className="pagina-cabeca">
        <div>
          <p className="pequeno suave">
            <Link className="link" href="/metodos">
              Métodos
            </Link>
          </p>
          <h1 className="titulo" style={{ marginTop: 12 }}>
            {m.nome}
          </h1>
          <p className="lead suave" style={{ marginTop: 16, maxWidth: "44ch" }}>
            {m.resumo}
          </p>
        </div>
      </div>

      <div className="receita">
        <div style={{ display: "grid", gap: 32 }}>
          <Calculadora proporcao={m.proporcao} />
          <dl className="ficha painel">
            {[
              ["Moagem", m.moagem],
              ["Temperatura", m.temperaturaC],
              ["Tempo", m.tempoMin >= 60 ? `${m.tempoMin / 60} horas` : `${m.tempoMin} minutos`],
            ].map(([rotulo, valor]) => (
              <div key={rotulo}>
                <dt>{rotulo}</dt>
                <span className="pontilhado" aria-hidden />
                <dd>{valor}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div style={{ display: "grid", gap: 24 }}>
          <figure style={{ position: "relative", aspectRatio: "4 / 3", overflow: "hidden" }}>
            <Image src={unsplash(m.imagem, 1200, 900)} alt={`Preparo em ${m.nome}`} fill priority sizes="(max-width: 860px) 100vw, 45vw" style={{ objectFit: "cover" }} />
          </figure>
          <p className="pequeno suave">{foto(`metodo-${m.slug}`).credito}</p>
          <h2 className="lead" style={{ fontWeight: 800 }}>
            O que você precisa
          </h2>
          <ul className="kit">
            {m.kit.map((p) => (
              <li key={p.slug}>
                <Link className="link" href={`/produto/${p.slug}`}>
                  {p.nome}
                </Link>
                <span>{formatarBRL(p.precoCentavos)}</span>
              </li>
            ))}
          </ul>
          <p className="total">
            <span>Kit completo</span>
            <span>{formatarBRL(total)}</span>
          </p>
          <AdicionarKit slugs={m.kit.map((p) => p.slug)} />
        </div>
      </div>
    </>
  );
}
