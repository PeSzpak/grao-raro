import { z } from "zod";
import { adminAutenticado, cookieDeSessao, naoAutorizado, senhaCorreta } from "@/lib/admin";
import { comErros, lerCorpo } from "@/lib/http";

export const POST = comErros(async (req: Request) => {
  const { senha } = await lerCorpo(req, z.object({ senha: z.string().min(1).max(200) }));
  if (!senhaCorreta(senha)) return naoAutorizado();
  return Response.json({ autenticado: true }, { headers: { "Set-Cookie": cookieDeSessao() } });
});

export async function GET(req: Request) {
  return Response.json({ autenticado: adminAutenticado(req) });
}
