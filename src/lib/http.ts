import { z } from "zod";

export type ErroApi = { erro: string; detalhes?: unknown };

export function erro(status: number, mensagem: string, detalhes?: unknown) {
  return Response.json({ erro: mensagem, ...(detalhes === undefined ? {} : { detalhes }) } satisfies ErroApi, {
    status,
  });
}

export function erroValidacao(e: z.ZodError) {
  return erro(400, "Dados inválidos", z.flattenError(e).fieldErrors);
}
