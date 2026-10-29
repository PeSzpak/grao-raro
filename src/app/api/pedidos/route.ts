import { after } from "next/server";
import { pedidoSchema } from "@/domain/schemas";
import { asaas } from "@/gateways/asaas";
import { comErros, lerCorpo } from "@/lib/http";
import { expirarPedidos } from "@/services/pagamentos";
import { criarPedido } from "@/services/pedidos";

export const POST = comErros(async (req: Request) => {
  const dados = await lerCorpo(req, pedidoSchema);
  const pedido = await criarPedido(dados, asaas);
  // O Cron do plano gratuito roda uma vez por dia; cada pedido novo também devolve as reservas vencidas.
  after(() => expirarPedidos(asaas));
  return Response.json(pedido, { status: 201, headers: { Location: `/api/pedidos/${pedido.id}` } });
});
