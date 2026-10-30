import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { metodosDaVitrine, unsplash } from "@/lib/vitrine";

export const metadata: Metadata = { title: "Métodos de preparo" };

const DIFICULDADE = { facil: "Fácil", media: "Média", dificil: "Difícil" } as const;

export default function Metodos() {
  return (
    <main className="pagina">
      <div className="pagina-cabeca">
        <div>
          <h1 className="titulo">Métodos de preparo</h1>
          <p className="lead suave" style={{ marginTop: 16, maxWidth: "44ch" }}>
            A receita em números, a moagem e a temperatura de cada método, com a calculadora para o tamanho do seu preparo.
          </p>
        </div>
      </div>
      <Suspense fallback={<p className="suave">Carregando</p>}>
        <Lista />
      </Suspense>
    </main>
  );
}

async function Lista() {
  await connection();
  const metodos = await metodosDaVitrine();
  return (
    <ul className="grade">
      {metodos.map((m) => (
        <li key={m.slug} className="aparece">
          <Link href={`/metodos/${m.slug}`} className="cartao-produto" style={{ height: "100%" }}>
            <figure>
              <Image src={unsplash(m.imagem, 800, 600)} alt={`Preparo em ${m.nome}`} fill sizes="(max-width: 700px) 100vw, 33vw" />
            </figure>
            <div className="corpo">
              <p className="pequeno suave">
                {DIFICULDADE[m.dificuldade]} · {m.tempoMin >= 60 ? `${m.tempoMin / 60} h` : `${m.tempoMin} min`}
              </p>
              <h2>{m.nome}</h2>
              <p className="suave">{m.resumo}</p>
              <div className="base">
                <span style={{ fontWeight: 600 }}>{m.proporcao}</span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
