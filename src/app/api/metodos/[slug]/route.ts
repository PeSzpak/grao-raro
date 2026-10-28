import type { NextRequest } from "next/server";
import { erro } from "@/lib/http";
import { buscarMetodo } from "@/repositories/catalogo";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/metodos/[slug]">) {
  const { slug } = await ctx.params;
  const metodo = await buscarMetodo(slug);
  return metodo ? Response.json(metodo) : erro(404, "Método não encontrado");
}
