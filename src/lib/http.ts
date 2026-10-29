import { z } from "zod";
import { ErroDeNegocio } from "@/domain/erros";
import { ErroAsaas } from "@/gateways/asaas";

export type ErroApi = { erro: string; detalhes?: unknown };

export function erro(status: number, mensagem: string, detalhes?: unknown) {
  return Response.json({ erro: mensagem, ...(detalhes === undefined ? {} : { detalhes }) } satisfies ErroApi, {
    status,
  });
}

export function erroValidacao(e: z.ZodError) {
  return erro(400, "Dados inválidos", z.flattenError(e).fieldErrors);
}

class CorpoInvalido extends Error {
  constructor(readonly zod: z.ZodError) {
    super("Dados inválidos");
  }
}

export async function lerCorpo<T>(req: Request, schema: z.ZodType<T>) {
  const resultado = schema.safeParse(await req.json().catch(() => undefined));
  if (!resultado.success) throw new CorpoInvalido(resultado.error);
  return resultado.data;
}

export function comErros<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (e) {
      if (e instanceof CorpoInvalido) return erroValidacao(e.zod);
      if (e instanceof ErroDeNegocio) return erro(e.status, e.message);
      if (e instanceof ErroAsaas) return erro(502, "O Asaas recusou a operação", e.message);
      throw e;
    }
  };
}
