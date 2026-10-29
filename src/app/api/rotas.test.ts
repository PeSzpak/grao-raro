import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db, pool } from "@/db/client";
import { clientes, eventosPagamento, historicoStatus, itensPedido, pagamentos, pedidos, produtos, reservas } from "@/db/schema";
import { gatewayFalso } from "@/gateways/falso";

const gateway = vi.hoisted(() => ({ atual: null as unknown }));
vi.mock("@/gateways/asaas", async (original) => ({
  ...(await original<typeof import("@/gateways/asaas")>()),
  get asaas() {
    return gateway.atual;
  },
}));
// after() só existe dentro de uma requisição do Next.
vi.mock("next/server", async (original) => ({ ...(await original<typeof import("next/server")>()), after: vi.fn() }));

const { POST: criarPedido } = await import("./pedidos/route");
const { POST: pagar } = await import("./pedidos/[id]/pagamentos/route");
const { GET: status } = await import("./pedidos/[id]/status/route");
const { POST: webhook } = await import("./webhooks/asaas/route");
const { GET: cron } = await import("./cron/expirar/route");

const TOKEN = "token-de-teste-do-webhook";
process.env.ASAAS_WEBHOOK_TOKEN = TOKEN;

const pedidoValido = {
  nome: "Ana Souza",
  email: "ana@example.com",
  cpf: "529.982.247-25",
  itens: [{ slug: "amostra-degustacao", quantidade: 2 }],
  aceiteAcademico: true,
};

const json = (corpo: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api", { method: "POST", body: JSON.stringify(corpo), headers });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

let falso: ReturnType<typeof gatewayFalso>;

beforeEach(async () => {
  for (const t of [historicoStatus, eventosPagamento, pagamentos, reservas, itensPedido, pedidos, clientes]) await db.delete(t);
  await db.update(produtos).set({ estoque: 10 });
  falso = gatewayFalso();
  gateway.atual = falso;
});

afterAll(() => pool.end());

describe("POST /api/pedidos", () => {
  it("ignora preço enviado pelo navegador e usa o do banco", async () => {
    const resposta = await criarPedido(json({ ...pedidoValido, totalCentavos: 1, itens: [{ ...pedidoValido.itens[0], precoCentavos: 1 }] }));
    expect(resposta.status).toBe(201);
    expect((await resposta.json()).totalCentavos).toBe(1000);
  });

  it.each([
    ["quantidade zero", { itens: [{ slug: "amostra-degustacao", quantidade: 0 }] }, "itens"],
    ["CPF inválido", { cpf: "111.111.111-11" }, "cpf"],
    ["sem o aceite acadêmico", { aceiteAcademico: false }, "aceiteAcademico"],
  ])("recusa %s com 400", async (_caso, mudanca, campo) => {
    const resposta = await criarPedido(json({ ...pedidoValido, ...mudanca }));
    expect(resposta.status).toBe(400);
    expect((await resposta.json()).detalhes).toHaveProperty(campo);
  });

  it("produto esgotado volta 409", async () => {
    const resposta = await criarPedido(json({ ...pedidoValido, itens: [{ slug: "amostra-degustacao", quantidade: 10 }, { slug: "chemex", quantidade: 10 }] }));
    expect(resposta.status).toBe(201);
    const esgotado = await criarPedido(json(pedidoValido));
    expect(esgotado.status).toBe(409);
  });
});

describe("pagamento, webhook e status", () => {
  async function pedidoComPix() {
    const { id } = await (await criarPedido(json(pedidoValido))).json();
    const resposta = await pagar(json({ metodo: "pix" }) as never, ctx(id) as never);
    expect(resposta.status).toBe(201);
    return { id, pagamento: await resposta.json() };
  }

  it("gera o Pix pela rota", async () => {
    const { pagamento } = await pedidoComPix();
    expect(pagamento.pix.payload).toBe("00020101021226");
  });

  it("cartão com dados faltando volta 400 antes de chegar ao Asaas", async () => {
    const { id } = await (await criarPedido(json(pedidoValido))).json();
    const resposta = await pagar(json({ metodo: "credito", parcelas: 1 }) as never, ctx(id) as never);
    expect(resposta.status).toBe(400);
    expect(falso.criadas).toHaveLength(0);
  });

  it("webhook com token errado volta 401 e não muda nada", async () => {
    const { id } = await pedidoComPix();
    falso.mudarStatus("pay_1", "RECEIVED");
    const resposta = await webhook(json({ id: "evt_1", event: "PAYMENT_RECEIVED", payment: { id: "pay_1" } }, { "asaas-access-token": "errado" }));
    expect(resposta.status).toBe(401);
    const [pedido] = await db.select({ status: pedidos.status }).from(pedidos).where(eq(pedidos.id, id));
    expect(pedido.status).toBe("pendente");
  });

  it("sem webhook, a consulta de status pergunta ao Asaas e aprova", async () => {
    const { id } = await pedidoComPix();
    falso.mudarStatus("pay_1", "RECEIVED");
    const resposta = await status({} as never, ctx(id) as never);
    expect(await resposta.json()).toMatchObject({ status: "aprovado", pagamento: { status: "aprovado", metodo: "pix" } });
  });

  it("webhook aprova o pedido e o mesmo evento repetido não grava de novo", async () => {
    const { id } = await pedidoComPix();
    falso.mudarStatus("pay_1", "RECEIVED");
    const evento = { id: "evt_1", event: "PAYMENT_RECEIVED", payment: { id: "pay_1" } };

    expect((await webhook(json(evento, { "asaas-access-token": TOKEN }))).status).toBe(200);
    const repetido = await webhook(json(evento, { "asaas-access-token": TOKEN }));
    expect(await repetido.json()).toMatchObject({ repetido: true });

    const historico = await db.select().from(historicoStatus).where(eq(historicoStatus.pedidoId, id));
    expect(historico.map((h) => [h.para, h.origem])).toEqual([
      ["pendente", "criacao"],
      ["aprovado", "webhook"],
    ]);
  });

  it("webhook de cobrança que não é nossa responde 200 sem consultar o Asaas", async () => {
    const resposta = await webhook(json({ id: "evt_9", event: "PAYMENT_CREATED", payment: { id: "pay_de_outro" } }, { "asaas-access-token": TOKEN }));
    expect(resposta.status).toBe(200);
  });
});

describe("GET /api/cron/expirar", () => {
  it("sem o segredo do Cron volta 401", async () => {
    delete process.env.CRON_SECRET;
    const resposta = await cron(new Request("http://localhost/api", { headers: { authorization: "Bearer undefined" } }));
    expect(resposta.status).toBe(401);
  });
});
