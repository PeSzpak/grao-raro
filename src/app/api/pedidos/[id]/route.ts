import type { NextRequest } from "next/server";
import { erro } from "@/lib/http";
import { pagamentoAtual } from "@/services/pagamentos";
import { buscarPedido } from "@/services/pedidos";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/pedidos/[id]">) {
  const { id } = await ctx.params;
  const pedido = await buscarPedido(id);
  if (!pedido) return erro(404, "Pedido não encontrado");
  return Response.json({ ...pedido, pagamento: await pagamentoAtual(id) });
}
