import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Compra } from "@/components/compra";
import { formatarBRL } from "@/domain/dinheiro";
import { foto, produtoDaVitrine, unsplash } from "@/lib/vitrine";

export async function generateMetadata({ params }: PageProps<"/produto/[slug]">): Promise<Metadata> {
  const produto = await produtoDaVitrine((await params).slug);
  return produto ? { title: produto.nome, description: produto.descricao } : {};
}

export default function PaginaProduto({ params }: PageProps<"/produto/[slug]">) {
  return (
    <main className="pagina">
      <Suspense fallback={<p className="suave">Carregando a etiqueta</p>}>
        <Produto params={params} />
      </Suspense>
    </main>
  );
}

async function Produto({ params }: Pick<PageProps<"/produto/[slug]">, "params">) {
  const { slug } = await params;
  const p = await produtoDaVitrine(slug);
  if (!p) notFound();
  const credito = foto(slug).credito;
  const cafe = p.categoria === "cafes";
  const ficha = (
    cafe
      ? [
          ["Origem", p.origem],
          ["Produtor", p.produtor],
          ["Variedade", p.variedade],
          ["Processo", p.processo],
          ["Altitude", p.altitudeM],
          ["Peso", p.peso],
        ]
      : [
          ["Para", p.subtitulo],
          ["Feito em", p.peso],
        ]
  ).filter((linha): linha is [string, string] => Boolean(linha[1]));

  return (
    <div className="produto">
      <div className="produto-foto">
        <figure>
          <Image src={unsplash(p.imagem, 1200, 1200)} alt={cafe ? `Origem do ${p.nome}` : p.nome} fill priority sizes="(max-width: 860px) 100vw, 55vw" />
        </figure>
        <p className="pequeno suave" style={{ marginTop: 10 }}>
          {credito}
        </p>
      </div>

      <article className="produto-etiqueta etiqueta">
        <div>
          <p className="pequeno suave">{cafe ? [p.origem, p.processo].filter(Boolean).join(" · ") : p.categoria === "equipamentos" ? "Equipamento" : "Acessório"}</p>
          <h1 className="titulo" style={{ marginTop: 12 }}>
            {p.nome}
          </h1>
          {p.subtitulo && cafe && <p className="lead" style={{ marginTop: 12 }}>{p.subtitulo}</p>}
        </div>

        <p>{p.descricao}</p>

        {ficha.length > 0 && (
          <dl className="ficha">
            {ficha.map(([rotulo, valor]) => (
              <div key={rotulo}>
                <dt>{rotulo}</dt>
                <span className="pontilhado" aria-hidden />
                <dd>{valor}</dd>
              </div>
            ))}
          </dl>
        )}

        {p.notasSensoriais && p.notasSensoriais.length > 0 && (
          <div>
            <h2 style={{ fontWeight: 800 }}>Na xícara</h2>
            <p className="lead">{p.notasSensoriais.join(", ")}</p>
          </div>
        )}

        <div className="picote" aria-hidden />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
          <span className="titulo">{formatarBRL(p.precoCentavos)}</span>
          <span className="suave">{p.estoque > 0 ? `${p.estoque} em estoque` : "Esgotado"}</span>
        </div>
        <Compra slug={p.slug} nome={p.nome} estoque={p.estoque} />
        {!p.pagamentoRealLiberado && (
          <p className="pequeno suave">Neste projeto acadêmico, só a Amostra de degustação é cobrada de verdade. Este produto vai até a tela de pagamento.</p>
        )}

        {p.metodos.length > 0 && (
          <div>
            <h2 style={{ fontWeight: 800 }}>Aparece nos guias</h2>
            <p style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", marginTop: 6 }}>
              {p.metodos.map((m) => (
                <Link key={m.slug} className="link" href={`/metodos/${m.slug}`}>
                  {m.nome}
                </Link>
              ))}
            </p>
          </div>
        )}
      </article>
    </div>
  );
}
