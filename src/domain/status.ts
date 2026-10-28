import type { STATUS_PEDIDO } from "@/db/schema";

export type StatusPedido = (typeof STATUS_PEDIDO)[number];

const TRANSICOES: Record<StatusPedido, readonly StatusPedido[]> = {
  pendente: ["aprovado", "recusado", "expirado", "cancelado"],
  aprovado: ["estornado", "contestado"],
  contestado: ["aprovado", "estornado"],
  recusado: [],
  expirado: [],
  cancelado: [],
  estornado: [],
};

/** Devolve o novo status se a mudança for permitida, ou null se deve ser ignorada. */
export function transicionar(atual: StatusPedido, novo: StatusPedido): StatusPedido | null {
  return TRANSICOES[atual].includes(novo) ? novo : null;
}

export function statusFinal(status: StatusPedido) {
  return TRANSICOES[status].length === 0;
}

const DO_ASAAS: Record<string, StatusPedido> = {
  PENDING: "pendente",
  AWAITING_RISK_ANALYSIS: "pendente",
  RECEIVED: "aprovado",
  CONFIRMED: "aprovado",
  RECEIVED_IN_CASH: "aprovado",
  OVERDUE: "expirado",
  REFUNDED: "estornado",
  REFUND_REQUESTED: "estornado",
  REFUND_IN_PROGRESS: "estornado",
  CHARGEBACK_REQUESTED: "contestado",
  CHARGEBACK_DISPUTE: "contestado",
  AWAITING_CHARGEBACK_REVERSAL: "contestado",
  DUNNING_REQUESTED: "contestado",
  DUNNING_RECEIVED: "aprovado",
};

export function statusDoAsaas(status: string, removida = false): StatusPedido {
  if (removida) return "cancelado";
  const traduzido = DO_ASAAS[status];
  if (!traduzido) throw new Error(`Status do Asaas desconhecido: ${status}`);
  return traduzido;
}
