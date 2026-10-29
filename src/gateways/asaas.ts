import { z } from "zod";
import { centavosParaReais } from "@/domain/dinheiro";
import { somenteDigitos } from "@/domain/cpf";
import type { METODOS } from "@/db/schema";

export class ErroAsaas extends Error {
  override name = "ErroAsaas";
  constructor(
    message: string,
    readonly status: number,
    readonly codigo?: string,
  ) {
    super(message);
  }
  // Rede, limite de requisições e erro do Asaas: dá pra tentar de novo.
  get temporario() {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
}

const erroSchema = z.object({ errors: z.array(z.object({ code: z.string().optional(), description: z.string() })) });

const cobrancaSchema = z.object({
  id: z.string(),
  status: z.string(),
  invoiceUrl: z.string().nullish(),
  deleted: z.boolean().optional(),
  externalReference: z.string().nullish(),
  threeDSecureChallengeUrl: z.string().nullish(),
});
export type CobrancaAsaas = z.infer<typeof cobrancaSchema>;

const pixSchema = z.object({ encodedImage: z.string(), payload: z.string(), expirationDate: z.string() });

export type Cartao = { nome: string; numero: string; mes: string; ano: string; cvv: string };
export type Titular = { nome: string; email: string; cpf: string; cep: string; numeroEndereco: string; telefone: string };

export type NovaCobranca = {
  cliente: string;
  metodo: (typeof METODOS)[number];
  valorCentavos: number;
  referencia: string;
  descricao: string;
  urlRetorno: string;
  parcelas?: number;
  cartao?: Cartao;
  titular?: Titular;
  ip?: string;
};

function configuracao() {
  const chave = process.env.ASAAS_API_KEY;
  if (!chave) throw new Error("ASAAS_API_KEY não definida");
  return { chave, base: process.env.ASAAS_BASE_URL ?? "https://api.asaas.com/v3" };
}

async function chamar<T>(caminho: string, schema: z.ZodType<T>, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const { chave, base } = configuracao();
  let resposta: Response;
  try {
    resposta = await fetch(base + caminho, {
      method: init.method ?? "GET",
      headers: { access_token: chave, "User-Agent": "grao-raro", "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    throw new ErroAsaas(`Sem resposta do Asaas: ${(e as Error).message}`, 0);
  }

  const corpo: unknown = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const erro = erroSchema.safeParse(corpo);
    const primeiro = erro.success ? erro.data.errors[0] : undefined;
    throw new ErroAsaas(primeiro?.description ?? `Asaas respondeu ${resposta.status}`, resposta.status, primeiro?.code);
  }
  const lido = schema.safeParse(corpo);
  if (!lido.success) throw new ErroAsaas(`Resposta inesperada do Asaas em ${caminho}`, 502);
  return lido.data;
}

// O Pix vence no dia, no horário de Brasília.
function hojeEmBrasilia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

const TIPO: Record<NovaCobranca["metodo"], string> = { pix: "PIX", credito: "CREDIT_CARD", debito: "UNDEFINED" };

export const asaas = {
  async criarCliente(dados: { nome: string; email: string; cpf: string }) {
    const cliente = await chamar("/customers", z.object({ id: z.string() }), {
      method: "POST",
      body: { name: dados.nome, email: dados.email, cpfCnpj: somenteDigitos(dados.cpf), notificationDisabled: true },
    });
    return cliente.id;
  },

  async removerCliente(id: string) {
    await chamar(`/customers/${id}`, z.unknown(), { method: "DELETE" });
  },

  criarCobranca(c: NovaCobranca) {
    const valor = centavosParaReais(c.valorCentavos);
    const parcelado = c.metodo === "credito" && c.parcelas && c.parcelas > 1;
    return chamar("/payments", cobrancaSchema, {
      method: "POST",
      body: {
        customer: c.cliente,
        billingType: TIPO[c.metodo],
        dueDate: hojeEmBrasilia(),
        description: c.descricao,
        externalReference: c.referencia,
        // O Asaas só aceita successUrl de domínio cadastrado na conta, e só o débito sai do nosso site.
        ...(c.metodo === "debito" ? { callback: { successUrl: c.urlRetorno, autoRedirect: true } } : {}),
        ...(parcelado ? { installmentCount: c.parcelas, totalValue: valor } : { value: valor }),
        ...(c.metodo === "credito" && c.cartao && c.titular
          ? {
              creditCard: {
                holderName: c.cartao.nome,
                number: somenteDigitos(c.cartao.numero),
                expiryMonth: c.cartao.mes,
                expiryYear: c.cartao.ano,
                ccv: c.cartao.cvv,
              },
              creditCardHolderInfo: {
                name: c.titular.nome,
                email: c.titular.email,
                cpfCnpj: somenteDigitos(c.titular.cpf),
                postalCode: somenteDigitos(c.titular.cep),
                addressNumber: c.titular.numeroEndereco,
                phone: somenteDigitos(c.titular.telefone),
              },
              remoteIp: c.ip,
            }
          : {}),
      },
    });
  },

  pixQrCode(id: string) {
    return chamar(`/payments/${id}/pixQrCode`, pixSchema);
  },

  consultar(id: string) {
    return chamar(`/payments/${id}`, cobrancaSchema);
  },

  async buscarPorReferencia(referencia: string): Promise<CobrancaAsaas | null> {
    const lista = await chamar(
      `/payments?externalReference=${encodeURIComponent(referencia)}&limit=1`,
      z.object({ data: z.array(cobrancaSchema) }),
    );
    return lista.data[0] ?? null;
  },

  async remover(id: string) {
    await chamar(`/payments/${id}`, z.unknown(), { method: "DELETE" });
  },

  estornar(id: string) {
    return chamar(`/payments/${id}/refund`, cobrancaSchema, { method: "POST", body: {} });
  },
};

export type GatewayPagamentos = typeof asaas;
