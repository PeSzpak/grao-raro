import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { GradeProdutos } from "@/components/grade-produtos";
import { produtosDaVitrine } from "@/lib/vitrine";

export const metadata: Metadata = { title: "Equipamentos" };

export default function Equipamentos() {
  return (
    <main className="pagina">
      <div className="pagina-cabeca">
        <div>
          <h1 className="titulo">Equipamentos</h1>
          <p className="lead suave" style={{ marginTop: 16, maxWidth: "40ch" }}>
            Os filtros, prensas e cafeteiras dos nossos guias, e o que mede e serve.
          </p>
        </div>
      </div>
      <Suspense fallback={<p className="suave">Carregando</p>}>
        <Listas />
      </Suspense>
    </main>
  );
}

async function Listas() {
  await connection();
  const [equipamentos, acessorios] = await Promise.all([
    produtosDaVitrine({ categoria: "equipamentos" }),
    produtosDaVitrine({ categoria: "acessorios" }),
  ]);
  return (
    <>
      <GradeProdutos produtos={equipamentos} />
      <h2 className="titulo" style={{ margin: "96px 0 32px" }}>
        Para medir e servir
      </h2>
      <GradeProdutos produtos={acessorios} />
    </>
  );
}
