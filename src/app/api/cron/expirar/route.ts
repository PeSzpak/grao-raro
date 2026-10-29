import { asaas } from "@/gateways/asaas";
import { erro } from "@/lib/http";
import { expirarPedidos } from "@/services/pagamentos";

export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || req.headers.get("authorization") !== `Bearer ${segredo}`) return erro(401, "Não autorizado");
  return Response.json({ expirados: await expirarPedidos(asaas) });
}
