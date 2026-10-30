"use client";

import { useState } from "react";
import { Quantidade, useSacola } from "./sacola";

export function Compra({ slug, nome, estoque }: { slug: string; nome: string; estoque: number }) {
  const { adicionar } = useSacola();
  const [quantidade, setQuantidade] = useState(1);
  if (estoque === 0) return <p className="lead">Esgotado. Volta no próximo lote.</p>;
  return (
    <div className="compra">
      <Quantidade valor={quantidade} mudar={(q) => setQuantidade(Math.max(1, Math.min(q, estoque)))} nome={nome} />
      <button type="button" className="botao" onClick={() => adicionar(slug, quantidade)}>
        Pôr na sacola
      </button>
    </div>
  );
}
