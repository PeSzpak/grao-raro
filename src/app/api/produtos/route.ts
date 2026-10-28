import type { NextRequest } from "next/server";
import { z } from "zod";
import { erroValidacao } from "@/lib/http";
import { listarProdutos } from "@/repositories/catalogo";

const filtroProdutosSchema = z.object({
  categoria: z.enum(["cafes", "equipamentos", "acessorios"]).optional(),
  origem: z.string().max(120).optional(),
  processo: z.string().max(80).optional(),
});

export async function GET(req: NextRequest) {
  const filtro = filtroProdutosSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!filtro.success) return erroValidacao(filtro.error);
  return Response.json(await listarProdutos(filtro.data));
}
