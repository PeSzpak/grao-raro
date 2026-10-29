import { createHmac, randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { clientes, historicoStatus, itensPedido, pedidos, produtos, reservas } from "@/db/schema";
import { somenteDigitos } from "@/domain/cpf";
import { ErroDeNegocio } from "@/domain/erros";

export const MINUTOS_RESERVA = 30;

export type ItemCarrinho = { slug: string; quantidade: number };
export type DadosComprador = { nome: string; email: string; cpf: string };
export type GatewayClientes = { criarCliente(dados: DadosComprador): Promise<string> };

export class ProdutoInexistente extends ErroDeNegocio {
  constructor(readonly slug: string) {
    super(404, `Produto não encontrado: ${slug}`);
  }
}

export class EstoqueInsuficiente extends ErroDeNegocio {
  constructor(readonly slug: string) {
    super(409, `Estoque insuficiente: ${slug}`);
  }
}

export async function cotar(itens: ItemCarrinho[]) {
  const quantidades = new Map<string, number>();
  for (const { slug, quantidade } of itens) quantidades.set(slug, (quantidades.get(slug) ?? 0) + quantidade);

  const encontrados = await db
    .select({ id: produtos.id, slug: produtos.slug, nome: produtos.nome, precoCentavos: produtos.precoCentavos })
    .from(produtos)
    .where(inArray(produtos.slug, [...quantidades.keys()]));
  const porSlug = new Map(encontrados.map((p) => [p.slug, p]));

  const linhas = [...quantidades].map(([slug, quantidade]) => {
    const p = porSlug.get(slug);
    if (!p) throw new ProdutoInexistente(slug);
    return { ...p, quantidade, subtotalCentavos: p.precoCentavos * quantidade };
  });
  return { itens: linhas, totalCentavos: linhas.reduce((t, l) => t + l.subtotalCentavos, 0) };
}

// HMAC e não hash puro: CPF tem poucos dígitos e um SHA-256 simples se quebra por força bruta.
function hashCpf(cpf: string) {
  const segredo = process.env.SESSION_SECRET;
  if (!segredo) throw new Error("SESSION_SECRET não definida");
  return createHmac("sha256", segredo).update(somenteDigitos(cpf)).digest("hex");
}

async function garantirCliente(comprador: DadosComprador, gateway: GatewayClientes) {
  const cpfHash = hashCpf(comprador.cpf);
  const buscar = () => db.select().from(clientes).where(eq(clientes.cpfHash, cpfHash));

  const [existente] = await buscar();
  if (existente) return existente.id;
  const asaasCustomerId = await gateway.criarCliente(comprador);
  // Duas compras do mesmo CPF ao mesmo tempo: a segunda fica com o cliente gravado pela primeira.
  await db.insert(clientes).values({ cpfHash, asaasCustomerId }).onDuplicateKeyUpdate({ set: { id: sql`id` } });
  const [gravado] = await buscar();
  return gravado.id;
}

export async function criarPedido(dados: DadosComprador & { itens: ItemCarrinho[] }, gateway: GatewayClientes) {
  const cotacao = await cotar(dados.itens);
  const clienteId = await garantirCliente(dados, gateway);
  const id = randomUUID();
  const expiraEm = new Date(Date.now() + MINUTOS_RESERVA * 60_000);
  // Ordem fixa de travamento das linhas evita deadlock entre pedidos com os mesmos produtos.
  const itens = [...cotacao.itens].sort((a, b) => a.id - b.id);

  await db.transaction(async (tx) => {
    for (const item of itens) {
      const [resultado] = await tx
        .update(produtos)
        .set({ estoque: sql`${produtos.estoque} - ${item.quantidade}` })
        .where(sql`${produtos.id} = ${item.id} AND ${produtos.ativo} AND ${produtos.estoque} >= ${item.quantidade}`);
      if (resultado.affectedRows === 0) throw new EstoqueInsuficiente(item.slug);
    }
    await tx.insert(pedidos).values({ id, clienteId, nome: dados.nome, email: dados.email, totalCentavos: cotacao.totalCentavos });
    await tx.insert(itensPedido).values(
      itens.map((i) => ({ pedidoId: id, produtoId: i.id, quantidade: i.quantidade, precoUnitarioCentavos: i.precoCentavos })),
    );
    await tx.insert(reservas).values(itens.map((i) => ({ pedidoId: id, produtoId: i.id, quantidade: i.quantidade, expiraEm })));
    await tx.insert(historicoStatus).values({ pedidoId: id, de: null, para: "pendente", origem: "criacao" });
  });

  return { id, totalCentavos: cotacao.totalCentavos, expiraEm };
}
