import { asaas } from "@/gateways/asaas";
import { adminAutenticado, naoAutorizado } from "@/lib/admin";
import { comErros } from "@/lib/http";
import { estornar } from "@/services/pagamentos";

export const POST = comErros(async (req: Request, ctx: RouteContext<"/api/admin/pedidos/[id]/estorno">) => {
  if (!adminAutenticado(req)) return naoAutorizado();
  const { id } = await ctx.params;
  await estornar(id, asaas);
  return Response.json({ id, status: "estornado" });
});
