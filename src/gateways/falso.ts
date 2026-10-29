import { ErroAsaas, type CobrancaAsaas, type GatewayPagamentos, type NovaCobranca } from "./asaas";

// Asaas em memória para os testes de falha, que a conta real não consegue provocar.
export function gatewayFalso() {
  const cobrancas = new Map<string, CobrancaAsaas & { referencia: string }>();
  const g = {
    criadas: [] as NovaCobranca[],
    removidas: [] as string[],
    falhaNaCriacao: null as ErroAsaas | null,
    // Simula a cobrança criada no Asaas cuja resposta se perdeu na rede.
    perderResposta: false,
    statusCartao: "CONFIRMED",
    async criarCliente() {
      return "cus_falso";
    },
    async removerCliente() {},
    async criarCobranca(c: NovaCobranca) {
      if (g.falhaNaCriacao) throw g.falhaNaCriacao;
      g.criadas.push(c);
      const id = `pay_${g.criadas.length}`;
      const status = c.metodo === "credito" ? g.statusCartao : "PENDING";
      const cobranca = { id, status, invoiceUrl: `https://asaas.test/i/${id}`, referencia: c.referencia, deleted: false };
      cobrancas.set(id, cobranca);
      if (g.perderResposta) throw new ErroAsaas("timeout", 0);
      return cobranca;
    },
    async pixQrCode() {
      return { encodedImage: "iVBORw0KGgo", payload: "00020101021226", expirationDate: "2026-10-30 23:59:59" };
    },
    async consultar(id: string) {
      const c = cobrancas.get(id);
      if (!c) throw new ErroAsaas("não existe", 404);
      return c;
    },
    async buscarPorReferencia(referencia: string) {
      return [...cobrancas.values()].find((c) => c.referencia === referencia) ?? null;
    },
    async remover(id: string) {
      g.removidas.push(id);
      cobrancas.get(id)!.deleted = true;
    },
    async estornar(id: string) {
      const c = cobrancas.get(id)!;
      c.status = "REFUNDED";
      return c;
    },
    mudarStatus(id: string, status: string) {
      cobrancas.get(id)!.status = status;
    },
  };
  return g satisfies GatewayPagamentos;
}
