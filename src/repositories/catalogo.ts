import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { categorias, metodoProdutos, metodosPreparo, produtos } from "@/db/schema";
import { pagamentoReal } from "@/lib/liberacao";

export type FiltroProdutos = { categoria?: string; origem?: string; processo?: string };

const colunasProduto = {
  id: produtos.id,
  slug: produtos.slug,
  categoria: categorias.slug,
  nome: produtos.nome,
  subtitulo: produtos.subtitulo,
  descricao: produtos.descricao,
  origem: produtos.origem,
  produtor: produtos.produtor,
  variedade: produtos.variedade,
  processo: produtos.processo,
  altitudeM: produtos.altitudeM,
  notasSensoriais: produtos.notasSensoriais,
  peso: produtos.peso,
  imagem: produtos.imagem,
  creditoImagem: produtos.creditoImagem,
  precoCentavos: produtos.precoCentavos,
  estoque: produtos.estoque,
  pagamentoRealLiberado: produtos.pagamentoRealLiberado,
  destaque: produtos.destaque,
};

export type Produto = Awaited<ReturnType<typeof listarProdutos>>[number];

const comLiberacao = <T extends { pagamentoRealLiberado: boolean }>(p: T) => ({ ...p, pagamentoRealLiberado: pagamentoReal(p.pagamentoRealLiberado) });

export async function listarProdutos(filtro: FiltroProdutos = {}) {
  const lista = await db
    .select(colunasProduto)
    .from(produtos)
    .innerJoin(categorias, eq(categorias.id, produtos.categoriaId))
    .where(
      and(
        eq(produtos.ativo, true),
        filtro.categoria ? eq(categorias.slug, filtro.categoria) : undefined,
        filtro.origem ? eq(produtos.origem, filtro.origem) : undefined,
        filtro.processo ? eq(produtos.processo, filtro.processo) : undefined,
      ),
    )
    .orderBy(asc(categorias.id), asc(produtos.id));
  return lista.map(comLiberacao);
}

export async function buscarProduto(slug: string) {
  const [produto] = await db
    .select(colunasProduto)
    .from(produtos)
    .innerJoin(categorias, eq(categorias.id, produtos.categoriaId))
    .where(and(eq(produtos.slug, slug), eq(produtos.ativo, true)));
  if (!produto) return null;

  const metodos = await db
    .select({ slug: metodosPreparo.slug, nome: metodosPreparo.nome })
    .from(metodoProdutos)
    .innerJoin(metodosPreparo, eq(metodosPreparo.id, metodoProdutos.metodoId))
    .where(eq(metodoProdutos.produtoId, produto.id));
  return { ...comLiberacao(produto), metodos };
}

export async function listarMetodos() {
  return db.select().from(metodosPreparo).orderBy(asc(metodosPreparo.id));
}

export async function buscarMetodo(slug: string) {
  const [metodo] = await db.select().from(metodosPreparo).where(eq(metodosPreparo.slug, slug));
  if (!metodo) return null;

  const ids = await db
    .select({ id: metodoProdutos.produtoId })
    .from(metodoProdutos)
    .where(eq(metodoProdutos.metodoId, metodo.id));
  const kit = ids.length
    ? await db
        .select(colunasProduto)
        .from(produtos)
        .innerJoin(categorias, eq(categorias.id, produtos.categoriaId))
        .where(and(inArray(produtos.id, ids.map((r) => r.id)), eq(produtos.ativo, true)))
    : [];
  return { ...metodo, kit };
}
