import Image from "next/image";
import Link from "next/link";
import { formatarBRL } from "@/domain/dinheiro";
import { unsplash } from "@/lib/vitrine";
import type { Produto } from "@/repositories/catalogo";

export function GradeProdutos({ produtos }: { produtos: Produto[] }) {
  if (produtos.length === 0) return <p className="lead suave">Nenhum produto com esse filtro.</p>;
  return (
    <ul className="grade">
      {produtos.map((p) => (
        <li key={p.slug} className="aparece">
          <Link href={`/produto/${p.slug}`} className="cartao-produto" style={{ height: "100%" }}>
            <figure>
              <Image src={unsplash(p.imagem, 800, 600)} alt={p.nome} fill sizes="(max-width: 700px) 100vw, 33vw" />
            </figure>
            <div className="corpo">
              <p className="pequeno suave">{[p.origem, p.processo].filter(Boolean).join(" · ") || p.subtitulo}</p>
              <h2>{p.nome}</h2>
              {p.notasSensoriais && <p className="suave">{p.notasSensoriais.join(", ")}</p>}
              <div className="base">
                <span className="preco">{formatarBRL(p.precoCentavos)}</span>
                <span className="pequeno suave">{p.estoque > 0 ? p.peso : "Esgotado"}</span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
