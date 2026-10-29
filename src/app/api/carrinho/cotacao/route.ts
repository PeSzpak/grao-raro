import { cotacaoSchema } from "@/domain/schemas";
import { comErros, lerCorpo } from "@/lib/http";
import { cotar } from "@/services/pedidos";

export const POST = comErros(async (req: Request) => {
  const { itens } = await lerCorpo(req, cotacaoSchema);
  return Response.json(await cotar(itens));
});
