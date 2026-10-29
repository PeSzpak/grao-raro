import { loginAdminSchema } from "@/domain/schemas";
import { adminAutenticado, cookieDeSessao, naoAutorizado, senhaCorreta } from "@/lib/admin";
import { comErros, lerCorpo } from "@/lib/http";

export const POST = comErros(async (req: Request) => {
  const { senha } = await lerCorpo(req, loginAdminSchema);
  if (!senhaCorreta(senha)) return naoAutorizado();
  return Response.json({ autenticado: true }, { headers: { "Set-Cookie": cookieDeSessao() } });
});

export async function GET(req: Request) {
  return Response.json({ autenticado: adminAutenticado(req) });
}
