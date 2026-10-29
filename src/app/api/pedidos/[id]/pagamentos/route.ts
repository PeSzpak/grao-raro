import type { NextRequest } from "next/server";
import { pagamentoSchema } from "@/domain/schemas";
import { asaas } from "@/gateways/asaas";
import { comErros, lerCorpo } from "@/lib/http";
import { iniciarPagamento } from "@/services/pagamentos";

// O Asaas pede o IP de quem compra no cartão, não o do servidor.
function ipDoComprador(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
}

export const POST = comErros(async (req: NextRequest, ctx: RouteContext<"/api/pedidos/[id]/pagamentos">) => {
  const { id } = await ctx.params;
  const dados = await lerCorpo(req, pagamentoSchema);
  const pagamento = await iniciarPagamento(id, dados.metodo === "credito" ? { ...dados, ip: ipDoComprador(req) } : dados, asaas);
  return Response.json(pagamento, { status: 201 });
});
