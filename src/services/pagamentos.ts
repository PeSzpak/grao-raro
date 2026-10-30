import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, lt, min, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { clientes, historicoStatus, itensPedido, pagamentos, pedidos, produtos, reservas } from "@/db/schema";
import { ErroDeNegocio } from "@/domain/erros";
import { statusDoAsaas, transicionar, type StatusPedido } from "@/domain/status";
import { tudoLiberado } from "@/lib/liberacao";
import { ErroAsaas, type Cartao, type CobrancaAsaas, type GatewayPagamentos, type Titular } from "@/gateways/asaas";

type Transacao = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Origem = (typeof historicoStatus.$inferInsert)["origem"];
type Pagamento = typeof pagamentos.$inferSelect;

export type DadosPagamento =
  | { metodo: "pix" }
  | { metodo: "debito" }
  | { metodo: "credito"; parcelas: number; cartao: Cartao; titular: Titular; ip: string };

const DEVOLVEM_ESTOQUE: StatusPedido[] = ["expirado", "cancelado", "estornado"];

function urlDoSite() {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  const producao = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return producao ? `https://${producao}` : "http://localhost:3000";
}

// Cobranças criadas fora da produção ficam marcadas para o script de limpeza achar.
function referencia(pagamentoId: string) {
  return (process.env.VERCEL_ENV === "production" ? "" : "dev-") + pagamentoId;
}

async function devolverEstoque(tx: Transacao, pedidoId: string) {
  const abertas = await tx
    .select()
    .from(reservas)
    .where(and(eq(reservas.pedidoId, pedidoId), isNull(reservas.liberadaEm)))
    .for("update");
  for (const r of abertas) {
    await tx
      .update(produtos)
      .set({ estoque: sql`${produtos.estoque} + ${r.quantidade}` })
      .where(eq(produtos.id, r.produtoId));
  }
  await tx
    .update(reservas)
    .set({ liberadaEm: new Date() })
    .where(and(eq(reservas.pedidoId, pedidoId), isNull(reservas.liberadaEm)));
}

async function mudarPedido(tx: Transacao, pedidoId: string, novo: StatusPedido, origem: Origem) {
  const [pedido] = await tx.select({ status: pedidos.status }).from(pedidos).where(eq(pedidos.id, pedidoId)).for("update");
  const destino = pedido && transicionar(pedido.status, novo);
  if (!destino) return;
  await tx.update(pedidos).set({ status: destino }).where(eq(pedidos.id, pedidoId));
  await tx.insert(historicoStatus).values({ pedidoId, de: pedido.status, para: destino, origem });
  if (DEVOLVEM_ESTOQUE.includes(destino)) await devolverEstoque(tx, pedidoId);
}

// O pagamento passa pela mesma máquina de estados do pedido: uma cobrança já descartada nunca mexe nele.
async function aplicarStatus(tx: Transacao, pagamento: Pagamento, novo: StatusPedido, origem: Origem) {
  const destino = transicionar(pagamento.status, novo);
  if (!destino) return;
  await tx.update(pagamentos).set({ status: destino }).where(eq(pagamentos.id, pagamento.id));
  await mudarPedido(tx, pagamento.pedidoId, destino, origem);
}

async function descartar(tx: Transacao, pagamento: Pagamento, gateway: GatewayPagamentos) {
  const idExterno = pagamento.idExterno ?? (await gateway.buscarPorReferencia(referencia(pagamento.id)))?.id;
  if (idExterno) await gateway.remover(idExterno);
  await tx.update(pagamentos).set({ status: "cancelado" }).where(eq(pagamentos.id, pagamento.id));
}

async function cobrar(
  tx: Transacao,
  pagamento: Pagamento,
  dados: DadosPagamento,
  pedido: { id: string; totalCentavos: number; cliente: string },
  gateway: GatewayPagamentos,
) {
  let cobranca: CobrancaAsaas | null = null;
  if (!pagamento.idExterno) {
    cobranca =
      (await gateway.buscarPorReferencia(referencia(pagamento.id))) ??
      (await gateway.criarCobranca({
        cliente: pedido.cliente,
        metodo: dados.metodo,
        valorCentavos: pedido.totalCentavos,
        referencia: referencia(pagamento.id),
        descricao: `Pedido ${pedido.id.slice(0, 8)} na Grão Raro`,
        urlRetorno: `${urlDoSite()}/pedido/${pedido.id}`,
        ...(dados.metodo === "credito" ? dados : {}),
      }));
    await tx
      .update(pagamentos)
      .set({ idExterno: cobranca.id, invoiceUrl: cobranca.threeDSecureChallengeUrl ?? cobranca.invoiceUrl })
      .where(eq(pagamentos.id, pagamento.id));
  }
  if (dados.metodo === "pix" && !pagamento.pixPayload) {
    const pix = await gateway.pixQrCode(cobranca?.id ?? pagamento.idExterno!);
    await tx
      .update(pagamentos)
      .set({ pixPayload: pix.payload, pixImagem: pix.encodedImage })
      .where(eq(pagamentos.id, pagamento.id));
  }
  if (cobranca && dados.metodo === "credito") {
    await aplicarStatus(tx, pagamento, statusDoAsaas(cobranca.status, cobranca.deleted), "criacao");
  }
}

export async function lerPagamento(id: string) {
  const [p] = await db.select().from(pagamentos).where(eq(pagamentos.id, id));
  return {
    id: p.id,
    pedidoId: p.pedidoId,
    metodo: p.metodo,
    status: p.status,
    parcelas: p.parcelas,
    pix: p.pixPayload ? { payload: p.pixPayload, imagem: p.pixImagem, expiraEm: p.expiraEm } : null,
    invoiceUrl: p.invoiceUrl,
    motivoRecusa: p.motivoRecusa,
  };
}

// O pagamento que vale para o pedido: o pendente ou o que decidiu o pedido, senão a última tentativa.
export async function pagamentoAtual(pedidoId: string) {
  const [p] = await db
    .select({ id: pagamentos.id })
    .from(pagamentos)
    .where(eq(pagamentos.pedidoId, pedidoId))
    .orderBy(desc(sql`${pagamentos.status} IN ('pendente', 'aprovado', 'estornado', 'contestado')`), desc(pagamentos.criadoEm))
    .limit(1);
  return p ? lerPagamento(p.id) : null;
}

// Reserva do webhook: se o pedido ainda está pendente, pergunta ao Asaas.
export async function atualizarPeloAsaas(pedidoId: string, gateway: GatewayPagamentos) {
  const [pendente] = await db.select().from(pagamentos).where(eq(pagamentos.pendenteDe, pedidoId));
  if (pendente?.idExterno) await sincronizar(pendente.idExterno, "consulta", gateway);
}

export async function iniciarPagamento(pedidoId: string, dados: DadosPagamento, gateway: GatewayPagamentos) {
  let erroTemporario: ErroAsaas | null = null;

  // A trava na linha do pedido enfileira cliques repetidos: o segundo só entra quando o primeiro terminou.
  const pagamentoId = await db.transaction(async (tx) => {
    const [pedido] = await tx
      .select({ id: pedidos.id, status: pedidos.status, totalCentavos: pedidos.totalCentavos, cliente: clientes.asaasCustomerId })
      .from(pedidos)
      .innerJoin(clientes, eq(clientes.id, pedidos.clienteId))
      .where(eq(pedidos.id, pedidoId))
      .for("update");
    if (!pedido) throw new ErroDeNegocio(404, "Pedido não encontrado");
    if (pedido.status !== "pendente") throw new ErroDeNegocio(409, "Este pedido não está mais aguardando pagamento");

    const [{ bloqueados }] = await tx
      .select({ bloqueados: sql<number>`count(*)` })
      .from(itensPedido)
      .innerJoin(produtos, eq(produtos.id, itensPedido.produtoId))
      .where(and(eq(itensPedido.pedidoId, pedidoId), eq(produtos.pagamentoRealLiberado, false)));
    if (Number(bloqueados) > 0 && !tudoLiberado()) {
      throw new ErroDeNegocio(403, "Neste projeto acadêmico só a Amostra de degustação pode ser paga de verdade");
    }

    let atual: Pagamento | undefined = (await tx.select().from(pagamentos).where(eq(pagamentos.pendenteDe, pedidoId)))[0];
    if (atual && (atual.metodo !== dados.metodo || (dados.metodo === "credito" && atual.idExterno))) {
      await descartar(tx, atual, gateway);
      atual = undefined;
    }
    if (!atual) {
      const [{ expiraEm }] = await tx
        .select({ expiraEm: min(reservas.expiraEm) })
        .from(reservas)
        .where(eq(reservas.pedidoId, pedidoId));
      const id = randomUUID();
      await tx.insert(pagamentos).values({
        id,
        pedidoId,
        provedor: "asaas",
        metodo: dados.metodo,
        parcelas: dados.metodo === "credito" ? dados.parcelas : 1,
        expiraEm,
      });
      [atual] = await tx.select().from(pagamentos).where(eq(pagamentos.id, id));
    }

    try {
      await cobrar(tx, atual, dados, pedido, gateway);
    } catch (e) {
      if (!(e instanceof ErroAsaas)) throw e;
      // A linha pendente fica gravada: a próxima tentativa procura a cobrança pela referência antes de criar outra.
      if (e.temporario) erroTemporario = e;
      else await tx.update(pagamentos).set({ status: "recusado", motivoRecusa: e.message.slice(0, 255) }).where(eq(pagamentos.id, atual.id));
    }
    return atual.id;
  });

  if (erroTemporario) throw new ErroDeNegocio(503, "O Asaas não respondeu. Tente de novo em instantes.");
  return lerPagamento(pagamentoId);
}

export async function sincronizar(idExterno: string, origem: Origem, gateway: GatewayPagamentos) {
  const [nossa] = await db.select({ id: pagamentos.id }).from(pagamentos).where(eq(pagamentos.idExterno, idExterno));
  if (!nossa) return;
  const cobranca = await gateway.consultar(idExterno);
  await db.transaction(async (tx) => {
    const [pagamento] = await tx.select().from(pagamentos).where(eq(pagamentos.idExterno, idExterno)).for("update");
    if (pagamento) await aplicarStatus(tx, pagamento, statusDoAsaas(cobranca.status, cobranca.deleted), origem);
  });
}

export async function expirarPedidos(gateway: GatewayPagamentos) {
  const vencidos = await db
    .selectDistinct({ id: reservas.pedidoId })
    .from(reservas)
    .innerJoin(pedidos, eq(pedidos.id, reservas.pedidoId))
    .where(and(lt(reservas.expiraEm, new Date()), isNull(reservas.liberadaEm), eq(pedidos.status, "pendente")));

  for (const { id } of vencidos) {
    const [pendente] = await db.select().from(pagamentos).where(eq(pagamentos.pendenteDe, id));
    if (pendente?.idExterno) {
      const cobranca = await gateway.consultar(pendente.idExterno);
      // Pago no último minuto: vale o pagamento, não a expiração.
      if (statusDoAsaas(cobranca.status, cobranca.deleted) !== "pendente") {
        await sincronizar(pendente.idExterno, "expiracao", gateway);
        continue;
      }
      await gateway.remover(pendente.idExterno);
    }
    await db.transaction(async (tx) => {
      if (pendente) await tx.update(pagamentos).set({ status: "expirado" }).where(eq(pagamentos.id, pendente.id));
      await mudarPedido(tx, id, "expirado", "expiracao");
    });
  }
  return vencidos.length;
}

export async function estornar(pedidoId: string, gateway: GatewayPagamentos) {
  const [pagamento] = await db
    .select()
    .from(pagamentos)
    .where(and(eq(pagamentos.pedidoId, pedidoId), eq(pagamentos.status, "aprovado")));
  if (!pagamento?.idExterno) throw new ErroDeNegocio(409, "Este pedido não tem pagamento aprovado para estornar");
  await gateway.estornar(pagamento.idExterno);
  await db.transaction((tx) => aplicarStatus(tx, pagamento, "estornado", "admin"));
}
