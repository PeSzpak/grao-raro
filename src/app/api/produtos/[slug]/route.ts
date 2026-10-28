import type { NextRequest } from "next/server";
import { erro } from "@/lib/http";
import { buscarProduto } from "@/repositories/catalogo";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/produtos/[slug]">) {
  const { slug } = await ctx.params;
  const produto = await buscarProduto(slug);
  return produto ? Response.json(produto) : erro(404, "Produto não encontrado");
}
