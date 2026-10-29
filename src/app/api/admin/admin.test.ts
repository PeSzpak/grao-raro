import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db, pool } from "@/db/client";
import { clientes, historicoStatus, itensPedido, pagamentos, pedidos, produtos, reservas } from "@/db/schema";
import { gatewayFalso } from "@/gateways/falso";
import { iniciarPagamento, sincronizar } from "@/services/pagamentos";
import { criarPedido } from "@/services/pedidos";

const gateway = vi.hoisted(() => ({ atual: null as unknown }));
vi.mock("@/gateways/asaas", async (original) => ({
  ...(await original<typeof import("@/gateways/asaas")>()),
  get asaas() {
    return gateway.atual;
  },
}));

const { POST: entrar } = await import("./sessao/route");
const { GET: listar } = await import("./pedidos/route");
const { POST: estornar } = await import("./pedidos/[id]/estorno/route");

process.env.ADMIN_PASSWORD = "senha-do-admin";

let falso: ReturnType<typeof gatewayFalso>;
const ctx = (id: string) => ({ params: Promise.resolve({ id }) }) as never;
const req = (cookie?: string) => new Request("http://localhost/api", { method: "POST", headers: cookie ? { cookie } : {} });
const compra = { nome: "Ana", email: "ana@example.com", cpf: "52998224725", itens: [{ slug: "amostra-degustacao", quantidade: 1 }] };

async function login(senha = "senha-do-admin") {
  return entrar(new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ senha }) }));
}
async function cookieDeAdmin() {
  return (await login()).headers.get("set-cookie")!.split(";")[0];
}

beforeEach(async () => {
  for (const t of [historicoStatus, pagamentos, reservas, itensPedido, pedidos, clientes]) await db.delete(t);
  await db.update(produtos).set({ estoque: 10 });
  falso = gatewayFalso();
  gateway.atual = falso;
});

afterAll(() => pool.end());

describe("admin", () => {
  it("senha errada volta 401 e não cria sessão", async () => {
    const resposta = await login("errada");
    expect(resposta.status).toBe(401);
    expect(resposta.headers.get("set-cookie")).toBeNull();
  });

  it("a sessão sai em cookie httpOnly que não vai para outros sites", async () => {
    const cookie = (await login()).headers.get("set-cookie")!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
  });

  it("sem sessão, ou com cookie forjado, a lista e o estorno voltam 401", async () => {
    expect((await listar(req())).status).toBe(401);
    expect((await listar(req("admin=9999999999999.forjado"))).status).toBe(401);
    expect((await estornar(req(), ctx("qualquer"))).status).toBe(401);
  });

  it("lista os pedidos e estorna o aprovado", async () => {
    const { id } = await criarPedido(compra, falso);
    await iniciarPagamento(id, { metodo: "pix" }, falso);
    const cookie = await cookieDeAdmin();

    const lista = await (await listar(req(cookie))).json();
    expect(lista[0]).toMatchObject({ id, status: "pendente", pagamento: { metodo: "pix" } });

    falso.mudarStatus("pay_1", "RECEIVED");
    await sincronizar("pay_1", "webhook", falso);
    expect((await estornar(req(cookie), ctx(id))).status).toBe(200);
    const [pedido] = await db.select().from(pedidos).where(eq(pedidos.id, id));
    expect(pedido.status).toBe("estornado");
  });

  it("estornar pedido sem pagamento aprovado volta 409", async () => {
    const { id } = await criarPedido(compra, falso);
    expect((await estornar(req(await cookieDeAdmin()), ctx(id))).status).toBe(409);
  });
});
