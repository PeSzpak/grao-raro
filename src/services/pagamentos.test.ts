import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, pool } from "@/db/client";
import { clientes, historicoStatus, itensPedido, pagamentos, pedidos, produtos, reservas } from "@/db/schema";
import { ErroAsaas, type CobrancaAsaas, type GatewayPagamentos, type NovaCobranca } from "@/gateways/asaas";
import { estornar, expirarPedidos, iniciarPagamento, sincronizar } from "./pagamentos";
import { criarPedido } from "./pedidos";

const AMOSTRA = "amostra-degustacao";
const comprador = { nome: "Ana Souza", email: "ana@example.com", cpf: "529.982.247-25" };
const cartao = {
  cartao: { nome: "ANA SOUZA", numero: "4111 1111 1111 1111", mes: "12", ano: "2030", cvv: "123" },
  titular: { ...comprador, cep: "80010-000", numeroEndereco: "100", telefone: "41999990000" },
  ip: "203.0.113.10",
};

function gatewayFalso() {
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

let gateway: ReturnType<typeof gatewayFalso>;

async function novoPedido(slug = AMOSTRA) {
  return criarPedido({ ...comprador, itens: [{ slug, quantidade: 1 }] }, gateway);
}
async function estoque(slug = AMOSTRA) {
  const [p] = await db.select({ estoque: produtos.estoque }).from(produtos).where(eq(produtos.slug, slug));
  return p.estoque;
}
async function statusPedido(id: string) {
  const [p] = await db.select({ status: pedidos.status }).from(pedidos).where(eq(pedidos.id, id));
  return p.status;
}

beforeEach(async () => {
  for (const t of [historicoStatus, pagamentos, reservas, itensPedido, pedidos, clientes]) await db.delete(t);
  await db.update(produtos).set({ estoque: 10 });
  gateway = gatewayFalso();
});

afterAll(() => pool.end());

describe("iniciarPagamento", () => {
  it("gera o Pix e devolve a mesma cobrança num segundo clique", async () => {
    const { id } = await novoPedido();
    const primeiro = await iniciarPagamento(id, { metodo: "pix" }, gateway);
    const segundo = await iniciarPagamento(id, { metodo: "pix" }, gateway);

    expect(primeiro.status).toBe("pendente");
    expect(primeiro.pix?.payload).toBe("00020101021226");
    expect(segundo.id).toBe(primeiro.id);
    expect(gateway.criadas).toHaveLength(1);
    expect(gateway.criadas[0].valorCentavos).toBe(500);
  });

  it("dois cliques ao mesmo tempo criam uma cobrança só", async () => {
    const { id } = await novoPedido();
    const resultados = await Promise.allSettled([
      iniciarPagamento(id, { metodo: "pix" }, gateway),
      iniciarPagamento(id, { metodo: "pix" }, gateway),
    ]);
    expect(gateway.criadas).toHaveLength(1);
    expect(resultados.some((r) => r.status === "fulfilled")).toBe(true);
  });

  it("crédito aprovado aprova o pedido na hora e mantém a baixa de estoque", async () => {
    const { id } = await novoPedido();
    const pagamento = await iniciarPagamento(id, { metodo: "credito", parcelas: 1, ...cartao }, gateway);

    expect(pagamento.status).toBe("aprovado");
    expect(await statusPedido(id)).toBe("aprovado");
    expect(await estoque()).toBe(9);
  });

  it("cartão recusado guarda o motivo e deixa o pedido aberto para outra tentativa", async () => {
    const { id } = await novoPedido();
    gateway.falhaNaCriacao = new ErroAsaas("Transação não autorizada.", 400, "invalid_creditCard");
    const recusado = await iniciarPagamento(id, { metodo: "credito", parcelas: 1, ...cartao }, gateway);

    expect(recusado.status).toBe("recusado");
    expect(recusado.motivoRecusa).toBe("Transação não autorizada.");
    expect(await statusPedido(id)).toBe("pendente");

    gateway.falhaNaCriacao = null;
    const pix = await iniciarPagamento(id, { metodo: "pix" }, gateway);
    expect(pix.status).toBe("pendente");
  });

  it("resposta perdida na rede: a nova tentativa acha a cobrança pela referência e não cria outra", async () => {
    const { id } = await novoPedido();
    gateway.perderResposta = true;
    await expect(iniciarPagamento(id, { metodo: "pix" }, gateway)).rejects.toMatchObject({ status: 503 });

    gateway.perderResposta = false;
    const pagamento = await iniciarPagamento(id, { metodo: "pix" }, gateway);
    expect(gateway.criadas).toHaveLength(1);
    expect(pagamento.pix?.payload).toBeTruthy();
  });

  it("trocar de Pix para débito apaga a cobrança Pix anterior", async () => {
    const { id } = await novoPedido();
    await iniciarPagamento(id, { metodo: "pix" }, gateway);
    const debito = await iniciarPagamento(id, { metodo: "debito" }, gateway);

    expect(gateway.removidas).toEqual(["pay_1"]);
    expect(debito.invoiceUrl).toBe("https://asaas.test/i/pay_2");
  });

  it("bloqueia pagamento real de produto que não é a amostra", async () => {
    const { id } = await novoPedido("hario-v60");
    await expect(iniciarPagamento(id, { metodo: "pix" }, gateway)).rejects.toMatchObject({ status: 403 });
    expect(gateway.criadas).toHaveLength(0);
  });
});

describe("sincronizar", () => {
  it("aplica o status do Asaas uma vez só, mesmo chegando repetido", async () => {
    const { id } = await novoPedido();
    await iniciarPagamento(id, { metodo: "pix" }, gateway);
    gateway.mudarStatus("pay_1", "RECEIVED");

    await sincronizar("pay_1", "webhook", gateway);
    await sincronizar("pay_1", "webhook", gateway);

    expect(await statusPedido(id)).toBe("aprovado");
    const historico = await db.select().from(historicoStatus).where(eq(historicoStatus.pedidoId, id));
    expect(historico.map((h) => h.para)).toEqual(["pendente", "aprovado"]);
  });
});

describe("expirarPedidos", () => {
  it("devolve o estoque uma vez, expira o pedido e apaga a cobrança", async () => {
    const { id } = await novoPedido();
    await iniciarPagamento(id, { metodo: "pix" }, gateway);
    await db.update(reservas).set({ expiraEm: new Date(Date.now() - 60_000) }).where(eq(reservas.pedidoId, id));

    await expirarPedidos(gateway);
    await expirarPedidos(gateway);

    expect(await statusPedido(id)).toBe("expirado");
    expect(await estoque()).toBe(10);
    expect(gateway.removidas).toEqual(["pay_1"]);
  });

  it("não expira um Pix que foi pago antes do prazo acabar", async () => {
    const { id } = await novoPedido();
    await iniciarPagamento(id, { metodo: "pix" }, gateway);
    gateway.mudarStatus("pay_1", "RECEIVED");
    await db.update(reservas).set({ expiraEm: new Date(Date.now() - 60_000) }).where(eq(reservas.pedidoId, id));

    await expirarPedidos(gateway);

    expect(await statusPedido(id)).toBe("aprovado");
    expect(await estoque()).toBe(9);
  });
});

describe("estornar", () => {
  it("estorna o pedido aprovado e devolve o estoque", async () => {
    const { id } = await novoPedido();
    await iniciarPagamento(id, { metodo: "credito", parcelas: 1, ...cartao }, gateway);

    await estornar(id, gateway);

    expect(await statusPedido(id)).toBe("estornado");
    expect(await estoque()).toBe(10);
  });
});
