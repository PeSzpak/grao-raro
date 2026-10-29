import { loadEnvConfig } from "@next/env";
import { describe, expect, it } from "vitest";

// Com NODE_ENV=test o @next/env ignora o .env.local, onde fica a chave do Asaas.
const modo = process.env.NODE_ENV;
Object.assign(process.env, { NODE_ENV: "development" });
loadEnvConfig(process.cwd(), true, undefined, true);
Object.assign(process.env, { NODE_ENV: modo });
const { asaas } = await import("./asaas");

// Conta real de produção: o teste cria e apaga tudo, nada é pago.
describe.skipIf(!process.env.ASAAS_API_KEY)("Asaas real", () => {
  it("cria cliente e cobrança Pix, lê o QR Code, encontra pela referência e apaga", async () => {
    const referencia = `dev-teste-${Date.now()}`;
    const cliente = await asaas.criarCliente({ nome: "Teste Grão Raro", email: "teste@example.com", cpf: "52998224725" });
    try {
      const cobranca = await asaas.criarCobranca({
        cliente,
        metodo: "pix",
        valorCentavos: 500,
        referencia,
        descricao: "Teste automatizado",
        urlRetorno: "https://example.com/pedido/teste",
      });
      expect(cobranca.status).toBe("PENDING");

      const pix = await asaas.pixQrCode(cobranca.id);
      expect(pix.payload).toMatch(/^000201/);
      expect(pix.encodedImage.length).toBeGreaterThan(100);

      expect((await asaas.buscarPorReferencia(referencia))?.id).toBe(cobranca.id);

      await asaas.remover(cobranca.id);
      expect((await asaas.consultar(cobranca.id)).deleted).toBe(true);
    } finally {
      await asaas.removerCliente(cliente);
    }
  }, 30_000);

  it("traduz o erro do Asaas com a mensagem dele", async () => {
    await expect(asaas.consultar("pay_nao_existe")).rejects.toMatchObject({ name: "ErroAsaas", temporario: false });
  });
});
