import { loadEnvConfig } from "@next/env";
import { readFileSync } from "node:fs";

loadEnvConfig(process.cwd());

type Imagem = { url: string; credito: string };
const imagens: Record<string, Imagem> = JSON.parse(readFileSync("src/db/imagens.json", "utf8"));

function imagem(slug: string): Imagem {
  const img = imagens[slug];
  if (!img) throw new Error(`Sem imagem para "${slug}" em src/db/imagens.json`);
  return img;
}

async function main() {
  const { eq, sql } = await import("drizzle-orm");
  const { db, pool } = await import("../src/db/client");
  const { categorias, produtos, metodosPreparo, metodoProdutos } = await import("../src/db/schema");
  const { CATEGORIAS, PRODUTOS, METODOS_PREPARO } = await import("../src/db/catalogo");

  await db
    .insert(categorias)
    .values([...CATEGORIAS])
    .onDuplicateKeyUpdate({ set: { nome: sql`VALUES(nome)` } });
  const idCategoria = new Map((await db.select().from(categorias)).map((c) => [c.slug, c.id]));

  for (const { categoria, ...p } of PRODUTOS) {
    const img = imagem(p.slug);
    const valores = {
      ...p,
      categoriaId: idCategoria.get(categoria)!,
      imagem: img.url,
      creditoImagem: img.credito,
    };
    // Estoque só é definido na criação: rodar o seed de novo não repõe o que já foi vendido.
    const { estoque, ...atualizaveis } = valores;
    void estoque;
    await db.insert(produtos).values(valores).onDuplicateKeyUpdate({ set: atualizaveis });
  }
  const idProduto = new Map((await db.select({ id: produtos.id, slug: produtos.slug }).from(produtos)).map((p) => [p.slug, p.id]));

  for (const { kit, ...m } of METODOS_PREPARO) {
    const img = imagem(`metodo-${m.slug}`);
    const valores = { ...m, imagem: img.url, creditoImagem: img.credito };
    await db.insert(metodosPreparo).values(valores).onDuplicateKeyUpdate({ set: valores });
    const [{ id }] = await db.select({ id: metodosPreparo.id }).from(metodosPreparo).where(eq(metodosPreparo.slug, m.slug));
    await db.delete(metodoProdutos).where(eq(metodoProdutos.metodoId, id));
    await db.insert(metodoProdutos).values(
      kit.map((slug) => {
        const produtoId = idProduto.get(slug);
        if (!produtoId) throw new Error(`Kit de "${m.slug}" cita produto inexistente "${slug}"`);
        return { metodoId: id, produtoId };
      }),
    );
  }

  console.log(`Seed: ${CATEGORIAS.length} categorias, ${PRODUTOS.length} produtos, ${METODOS_PREPARO.length} métodos.`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
