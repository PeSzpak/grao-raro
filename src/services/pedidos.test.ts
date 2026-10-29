import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, pool } from "@/db/client";
import { clientes, historicoStatus, itensPedido, pedidos, produtos, reservas } from "@/db/schema";
import { cotar, criarPedido, EstoqueInsuficiente, ProdutoInexistente, type GatewayClientes } from "./pedidos";

const SLUG = "hario-v60";
const comprador = { nome: "Ana Souza", email: "ana@example.com", cpf: "529.982.247-25" };

let criados = 0;
const gateway: GatewayClientes = {
  async criarCliente() {
    criados++;
    return `cus_teste_${criados}`;
  },
};

async function estoque(slug: string) {
  const [p] = await db.select({ estoque: produtos.estoque }).from(produtos).where(eq(produtos.slug, slug));
  return p.estoque;
}

beforeEach(async () => {
  for (const t of [historicoStatus, reservas, itensPedido, pedidos, clientes]) await db.delete(t);
  await db.update(produtos).set({ estoque: 5 }).where(eq(produtos.slug, SLUG));
  criados = 0;
});

afterAll(() => pool.end());

describe("cotar", () => {
  it("calcula o total pelo preço do banco e junta itens repetidos", async () => {
    const [p] = await db.select().from(produtos).where(eq(produtos.slug, SLUG));
    const cotacao = await cotar([
      { slug: SLUG, quantidade: 1 },
      { slug: SLUG, quantidade: 2 },
    ]);
    expect(cotacao.itens).toHaveLength(1);
    expect(cotacao.itens[0].quantidade).toBe(3);
    expect(cotacao.totalCentavos).toBe(p.precoCentavos * 3);
  });

  it("recusa produto que não existe", async () => {
    await expect(cotar([{ slug: "nao-existe", quantidade: 1 }])).rejects.toBeInstanceOf(ProdutoInexistente);
  });
});

describe("criarPedido", () => {
  it("baixa o estoque, reserva por 30 minutos e registra a criação", async () => {
    const { id, totalCentavos } = await criarPedido({ ...comprador, itens: [{ slug: SLUG, quantidade: 2 }] }, gateway);

    expect(await estoque(SLUG)).toBe(3);
    const [pedido] = await db.select().from(pedidos).where(eq(pedidos.id, id));
    expect(pedido.status).toBe("pendente");
    expect(pedido.totalCentavos).toBe(totalCentavos);
    const [reserva] = await db.select().from(reservas).where(eq(reservas.pedidoId, id));
    expect(reserva.quantidade).toBe(2);
    const minutos = (reserva.expiraEm.getTime() - Date.now()) / 60_000;
    expect(minutos).toBeGreaterThan(29);
    // DATETIME arredonda para o segundo mais próximo.
    expect(minutos).toBeLessThanOrEqual(30 + 1 / 60);
    const historico = await db.select().from(historicoStatus).where(eq(historicoStatus.pedidoId, id));
    expect(historico).toMatchObject([{ de: null, para: "pendente", origem: "criacao" }]);
  });

  it("reaproveita o cliente do Asaas pelo CPF e não guarda o CPF em claro", async () => {
    await criarPedido({ ...comprador, itens: [{ slug: SLUG, quantidade: 1 }] }, gateway);
    await criarPedido({ ...comprador, cpf: "52998224725", itens: [{ slug: SLUG, quantidade: 1 }] }, gateway);

    expect(criados).toBe(1);
    const linhas = await db.select().from(clientes);
    expect(linhas).toHaveLength(1);
    expect(linhas[0].cpfHash).not.toContain("52998224725");
  });

  it("responde estoque insuficiente sem baixar nada", async () => {
    const pedido = criarPedido({ ...comprador, itens: [{ slug: SLUG, quantidade: 6 }] }, gateway);
    await expect(pedido).rejects.toMatchObject(new EstoqueInsuficiente(SLUG));
    expect(await estoque(SLUG)).toBe(5);
    expect(await db.select().from(pedidos)).toHaveLength(0);
  });

  it("dez compras simultâneas da última unidade criam um pedido só", async () => {
    await db.update(produtos).set({ estoque: 1 }).where(eq(produtos.slug, SLUG));

    const resultados = await Promise.allSettled(
      Array.from({ length: 10 }, () => criarPedido({ ...comprador, itens: [{ slug: SLUG, quantidade: 1 }] }, gateway)),
    );

    expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const recusas = resultados.filter((r) => r.status === "rejected");
    expect(recusas).toHaveLength(9);
    for (const r of recusas) expect(r.reason).toBeInstanceOf(EstoqueInsuficiente);
    expect(await estoque(SLUG)).toBe(0);
    const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(pedidos);
    expect(Number(total)).toBe(1);
    expect(await db.select().from(clientes)).toHaveLength(1);
  });
});
