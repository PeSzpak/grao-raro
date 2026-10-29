import { adminAutenticado, naoAutorizado } from "@/lib/admin";
import { listarPedidos } from "@/services/pedidos";

export async function GET(req: Request) {
  if (!adminAutenticado(req)) return naoAutorizado();
  return Response.json(await listarPedidos());
}
