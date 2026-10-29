import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { eventosPagamento } from "@/db/schema";
import { webhookSchema } from "@/domain/schemas";
import { asaas } from "@/gateways/asaas";
import { erro } from "@/lib/http";
import { sincronizar } from "@/services/pagamentos";

function tokenValido(recebido: string | null) {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!tokenValido(req.headers.get("asaas-access-token"))) return erro(401, "Token inválido");
  const evento = webhookSchema.safeParse(await req.json().catch(() => undefined));
  // Evento que não entendemos não pode travar a fila do Asaas.
  if (!evento.success || !evento.data.payment) return Response.json({ recebido: true });
  const { id, event, payment } = evento.data;

  const [repetido] = await db.select().from(eventosPagamento).where(eq(eventosPagamento.idEvento, id));
  if (repetido) return Response.json({ recebido: true, repetido: true });

  // O corpo só diz qual cobrança mudou; o status vem de uma consulta ao Asaas.
  await sincronizar(payment.id, "webhook", asaas);
  await db
    .insert(eventosPagamento)
    .values({ idEvento: id, provedor: "asaas", tipo: event, idExterno: payment.id, payloadSanitizado: { event, payment: payment.id } })
    .onDuplicateKeyUpdate({ set: { idEvento: id } });
  return Response.json({ recebido: true });
}
