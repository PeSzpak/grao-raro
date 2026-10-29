import type { NextRequest } from "next/server";
import { filtroProdutosSchema } from "@/domain/schemas";
import { erroValidacao } from "@/lib/http";
import { listarProdutos } from "@/repositories/catalogo";

export async function GET(req: NextRequest) {
  const filtro = filtroProdutosSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!filtro.success) return erroValidacao(filtro.error);
  return Response.json(await listarProdutos(filtro.data));
}
