import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { FileiraMetodos } from "@/components/fileira-metodos";
import { Rodape } from "@/components/rodape";
import { BotaoSacola } from "@/components/sacola";
import { VitrineAbas } from "@/components/vitrine-abas";
import { formatarBRL } from "@/domain/dinheiro";
import { foto, metodosDaVitrine, produtosDaVitrine, unsplash } from "@/lib/vitrine";

const RESPIROS = [96, 140, 80, 120, 104, 136, 88, 128];

export default function Inicio() {
  const hero = foto("hero");
  return (
    <main>
      <section className="hero" aria-labelledby="titulo-hero">
        <div className="hero-foto">
          <Image src={unsplash(hero.url, 2400, 1500)} alt="" fill priority sizes="100vw" />
        </div>
        <div className="hero-cartao etiqueta">
          <h1 id="titulo-hero" className="hero-titulo display">
            Grão Raro
          </h1>
          <dl className="ficha">
            {[
              ["Cafés", "10 lotes de 9 origens"],
              ["Altitude", "até 2.100 m"],
              ["Preparo", "8 métodos com receita"],
            ].map(([rotulo, valor]) => (
              <div key={rotulo}>
                <dt>{rotulo}</dt>
                <span className="pontilhado" aria-hidden />
                <dd>{valor}</dd>
              </div>
            ))}
          </dl>
          <p className="hero-frase">Cada café vem com a fazenda, o processo e as notas da xícara na etiqueta. E o que você precisa para prepará-lo.</p>
          <div className="picote" aria-hidden />
          <div className="hero-acoes">
            <Link className="botao" href="/cafes">
              Ver os cafés
            </Link>
            <Link className="link" href="/produto/amostra-degustacao">
              Provar por R$ 5
            </Link>
          </div>
        </div>
        <p className="hero-credito pequeno">{hero.credito}</p>
        <div style={{ position: "absolute", top: 20, right: "var(--margem)" }}>
          <BotaoSacola />
        </div>
      </section>

      <Suspense fallback={<div style={{ minHeight: "100svh", background: "var(--surface)" }} />}>
        <Conteudo />
      </Suspense>
      <Rodape />
    </main>
  );
}

async function Conteudo() {
  await connection();
  const [produtos, metodos] = await Promise.all([produtosDaVitrine(), metodosDaVitrine()]);
  const cafes = produtos.filter((p) => p.categoria === "cafes");
  const destaques = cafes.filter((p) => p.destaque);
  const equipamentos = produtos.filter((p) => p.categoria === "equipamentos");
  const acessorios = produtos.filter((p) => p.categoria === "acessorios");
  const bancada = foto("moedor-manual");

  return (
    <>
      <VitrineAbas
        destaques={destaques.map((p) => ({
          slug: p.slug,
          aba: p.origem ?? p.nome,
          nome: p.nome,
          descricao: p.descricao.split(". ").slice(0, 2).join(". ") + ".",
          precoCentavos: p.precoCentavos,
          peso: p.peso,
          imagem: unsplash(p.imagem, 1200, 1200),
          alt: `Paisagem de origem do ${p.nome}`,
        }))}
      />

      <section className="lotes" aria-labelledby="titulo-lotes">
        <div className="lotes-cabeca moldura">
          <h2 id="titulo-lotes" className="titulo">
            Os lotes da casa
          </h2>
          <Link className="link" href="/cafes">
            Ver os {cafes.length} cafés com filtro
          </Link>
        </div>
        <div className="deck" tabIndex={0} aria-label="Lotes, role para o lado">
          {cafes.map((p) => (
            <Link key={p.slug} href={`/produto/${p.slug}`} className="lote etiqueta">
              <figure>
                <Image src={unsplash(p.imagem, 840, 525)} alt={`Origem do ${p.nome}`} fill sizes="420px" />
              </figure>
              <p className="pequeno suave">
                {[p.origem, p.processo, p.altitudeM].filter(Boolean).join(" · ")}
              </p>
              <div>
                <h3 className="lote-nome">{p.nome}</h3>
                <p className="suave" style={{ marginTop: 10 }}>
                  {p.notasSensoriais?.join(", ")}
                </p>
              </div>
              <div className="lote-rodape">
                <span className="preco">{formatarBRL(p.precoCentavos)}</span>
                <span className="suave">{p.peso}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <FileiraMetodos
        titulo={
          <h2 id="titulo-metodos" className="titulo">
            Oito jeitos de preparar
          </h2>
        }
      >
        {metodos.map((m, i) => (
          <Link key={m.slug} href={`/metodos/${m.slug}`} className="momento" style={{ "--respiro": `${RESPIROS[i % RESPIROS.length]}px` } as React.CSSProperties}>
            <h3>{m.nome}</h3>
            <p>{m.resumo}</p>
            <span className="respiro" />
            <figure>
              <Image src={unsplash(m.imagem, 560, 700)} alt={`Preparo em ${m.nome}`} width={560} height={700} sizes="280px" />
            </figure>
          </Link>
        ))}
      </FileiraMetodos>

      <section className="bancada" aria-labelledby="titulo-bancada">
        <div className="bancada-foto aparece">
          <Image src={unsplash(bancada.url, 1000, 1250)} alt="Moedor manual de café" width={1000} height={1250} sizes="(max-width: 860px) 100vw, 45vw" />
        </div>
        <div className="cardapio aparece">
          <h2 id="titulo-bancada" className="titulo">
            O que vai na bancada
          </h2>
          {[
            ["Para passar", equipamentos],
            ["Para medir e servir", acessorios],
          ].map(([grupo, itens]) => (
            <div key={grupo as string}>
              <h3>{grupo as string}</h3>
              {(itens as typeof produtos).map((p) => (
                <Link key={p.slug} href={`/produto/${p.slug}`} className="item-cardapio">
                  <span className="linha">
                    <span>{p.nome}</span>
                    <span className="pontilhado" aria-hidden />
                    <span>{formatarBRL(p.precoCentavos)}</span>
                  </span>
                  {p.subtitulo && <p>{p.subtitulo}</p>}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="pergunta" aria-labelledby="titulo-pergunta">
        <h2 id="titulo-pergunta" className="display" aria-label="Provar por cinco reais?">
          Provar por
        </h2>
        <div className="pergunta-escolha">
          <div className="pergunta-botoes">
            <Link className="botao" href="/produto/amostra-degustacao">
              Comprar a amostra
            </Link>
            <span className="suave">ou</span>
            <Link className="botao botao-tom" href="/cafes">
              Ver os cafés
            </Link>
          </div>
          <p className="suave" style={{ maxWidth: "52ch" }}>
            A amostra é paga de verdade pelo Asaas, no Pix ou no cartão, e o valor é estornado depois. Os outros produtos vão até a tela de pagamento, mas só a amostra pode ser cobrada.
          </p>
        </div>
        <p className="display" aria-hidden>
          cinco reais?
        </p>
      </section>
    </>
  );
}
