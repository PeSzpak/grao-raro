"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatarBRL } from "@/domain/dinheiro";
import { Adicionar } from "./sacola";

type Destaque = { slug: string; aba: string; nome: string; descricao: string; precoCentavos: number; peso: string | null; imagem: string; alt: string };

export function VitrineAbas({ destaques }: { destaques: Destaque[] }) {
  const [atual, setAtual] = useState(0);
  const d = destaques[atual];
  return (
    <section className="vitrine" aria-labelledby="titulo-vitrine">
      <div className="vitrine-prato aparece">
        <Image key={d.slug} src={d.imagem} alt={d.alt} width={900} height={900} sizes="(max-width: 860px) 100vw, 50vw" />
      </div>
      <div className="vitrine-texto">
        <div className="abas" role="tablist" aria-label="Cafés em destaque">
          {destaques.map((x, i) => (
            <button key={x.slug} role="tab" aria-selected={i === atual} aria-controls="painel-vitrine" onClick={() => setAtual(i)}>
              {x.aba}
            </button>
          ))}
        </div>
        <div id="painel-vitrine" role="tabpanel">
          <h2 id="titulo-vitrine" className="titulo">
            {d.nome}
          </h2>
          <p style={{ marginTop: 48, maxWidth: "34ch" }}>{d.descricao}</p>
          <p className="preco" style={{ marginTop: 24 }}>
            {formatarBRL(d.precoCentavos)} <span className="pequeno suave">{d.peso}</span>
          </p>
        </div>
        <div className="vitrine-acoes">
          <Adicionar slug={d.slug} className="botao botao-tinta" texto="Pôr na sacola" />
          <Link className="botao botao-tom" href={`/produto/${d.slug}`}>
            Ver a etiqueta completa
          </Link>
        </div>
      </div>
    </section>
  );
}
