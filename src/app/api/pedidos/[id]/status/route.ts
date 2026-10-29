import { after, type NextRequest } from "next/server";
import { asaas } from "@/gateways/asaas";
import { comErros, erro } from "@/lib/http";
import { atualizarPeloAsaas, expirarPedidos, pagamentoAtual } from "@/services/pagamentos";
import { buscarPedido } from "@/services/pedidos";

export const GET = comErros(async (_req: NextRequest, ctx: RouteContext<"/api/pedidos/[id]/status">) => {
  const { id } = await ctx.params;
  await atualizarPeloAsaas(id, asaas);
  const pedido = await buscarPedido(id);
  if (!pedido) return erro(404, "Pedido não encontrado");
  if (pedido.status === "pendente") after(() => expirarPedidos(asaas));
  const pagamento = await pagamentoAtual(id);
  return Response.json({
    status: pedido.status,
    expiraEm: pedido.expiraEm,
    pagamento: pagamento && { status: pagamento.status, metodo: pagamento.metodo, motivoRecusa: pagamento.motivoRecusa },
  });
});
