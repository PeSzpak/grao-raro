import { z } from "zod";
import {
  cotacaoSchema,
  filtroProdutosSchema,
  loginAdminSchema,
  pagamentoSchema,
  pedidoSchema,
  webhookSchema,
} from "@/domain/schemas";
import { STATUS_PEDIDO } from "@/db/schema";

const schema = (s: z.ZodType) => z.toJSONSchema(s, { io: "input", unrepresentable: "any" });

const corpo = (s: z.ZodType, exemplo: unknown) => ({
  required: true,
  content: { "application/json": { schema: schema(s), example: exemplo } },
});

const ref = (nome: string) => ({ $ref: `#/components/schemas/${nome}` });
const json = (descricao: string, conteudo: object) => ({ description: descricao, content: { "application/json": { schema: conteudo } } });
const erro = (descricao: string) => json(descricao, ref("Erro"));
const id = { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } };
const slug = { name: "slug", in: "path", required: true, schema: { type: "string" }, example: "amostra-degustacao" };

const pedidoExemplo = {
  nome: "Ana Souza",
  email: "ana@example.com",
  cpf: "529.982.247-25",
  itens: [{ slug: "amostra-degustacao", quantidade: 1 }],
  aceiteAcademico: true,
};

const documento = {
  openapi: "3.1.0",
  info: {
    title: "Grão Raro",
    version: "1.0.0",
    description:
      "API do checkout da Grão Raro, loja de cafés raros. Os pagamentos passam pela conta de produção do Asaas, então um Pix gerado aqui é real. Por padrão só a Amostra de degustação (R$ 5,00) pode ser paga de verdade; a variável ALLOW_REAL_CHECKOUT_ALL libera o catálogo inteiro. Todo valor recebido é estornado pelo painel administrativo. Projeto acadêmico do Senac: nenhum pedido é enviado.",
  },
  servers: [{ url: "/", description: "Este mesmo site" }],
  security: [],
  tags: [
    { name: "Catálogo", description: "Cafés, equipamentos, acessórios e métodos de preparo" },
    { name: "Checkout", description: "Do carrinho ao pagamento no Asaas" },
    { name: "Asaas", description: "Chamadas feitas pelo próprio Asaas e pelo agendador da Vercel" },
    { name: "Admin", description: "Precisa da sessão aberta em POST /api/admin/sessao" },
  ],
  paths: {
    "/api/health": {
      get: { tags: ["Catálogo"], summary: "Banco respondendo", responses: { 200: json("Tudo certo", { type: "object" }), 503: erro("Banco fora do ar") } },
    },
    "/api/openapi.json": {
      get: { tags: ["Catálogo"], summary: "Esta especificação", responses: { 200: json("OpenAPI 3.1", { type: "object" }) } },
    },
    "/api/produtos": {
      get: {
        tags: ["Catálogo"],
        summary: "Lista os produtos",
        parameters: Object.entries(schema(filtroProdutosSchema).properties ?? {}).map(([name, s]) => ({ name, in: "query", schema: s })),
        responses: { 200: json("Produtos ativos", { type: "array", items: ref("Produto") }), 400: erro("Filtro inválido") },
      },
    },
    "/api/produtos/{slug}": {
      get: {
        tags: ["Catálogo"],
        summary: "Detalhe do produto e métodos de preparo",
        parameters: [slug],
        responses: { 200: json("Produto", ref("Produto")), 404: erro("Produto não encontrado") },
      },
    },
    "/api/metodos": {
      get: { tags: ["Catálogo"], summary: "Métodos de preparo", responses: { 200: json("Métodos", { type: "array", items: { type: "object" } }) } },
    },
    "/api/metodos/{slug}": {
      get: {
        tags: ["Catálogo"],
        summary: "Método de preparo e o kit para fazer",
        parameters: [{ ...slug, example: "v60" }],
        responses: { 200: json("Método", { type: "object" }), 404: erro("Método não encontrado") },
      },
    },
    "/api/carrinho/cotacao": {
      post: {
        tags: ["Checkout"],
        summary: "Calcula o total pelo preço do banco",
        requestBody: corpo(cotacaoSchema, { itens: pedidoExemplo.itens }),
        responses: { 200: json("Cotação", { type: "object" }), 400: erro("Carrinho inválido"), 404: erro("Produto não encontrado") },
      },
    },
    "/api/pedidos": {
      post: {
        tags: ["Checkout"],
        summary: "Cria o pedido e reserva o estoque por 30 minutos",
        description: "O total é calculado no banco. Qualquer preço enviado no corpo é ignorado.",
        requestBody: corpo(pedidoSchema, pedidoExemplo),
        responses: {
          201: json("Pedido criado", { type: "object", properties: { id: { type: "string" }, totalCentavos: { type: "integer" }, expiraEm: { type: "string" } } }),
          400: erro("Dados inválidos"),
          404: erro("Produto não encontrado"),
          409: erro("Estoque insuficiente"),
        },
      },
    },
    "/api/pedidos/{id}": {
      get: { tags: ["Checkout"], summary: "Pedido, itens e pagamento atual", parameters: [id], responses: { 200: json("Pedido", { type: "object" }), 404: erro("Pedido não encontrado") } },
    },
    "/api/pedidos/{id}/pagamentos": {
      post: {
        tags: ["Checkout"],
        summary: "Paga o pedido por Pix, crédito ou débito",
        description:
          "Pix devolve o QR Code e o copia e cola. Crédito é aprovado ou recusado na hora. Débito devolve a invoiceUrl do Asaas, onde o comprador paga. Repetir a chamada com o mesmo método devolve a mesma cobrança.",
        parameters: [id],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: schema(pagamentoSchema),
              examples: {
                pix: { value: { metodo: "pix" } },
                debito: { value: { metodo: "debito" } },
                credito: {
                  value: {
                    metodo: "credito",
                    parcelas: 1,
                    cartao: { nome: "ANA SOUZA", numero: "4111111111111111", mes: "12", ano: "2030", cvv: "123" },
                    titular: { nome: "Ana Souza", email: "ana@example.com", cpf: "52998224725", cep: "80010000", numeroEndereco: "100", telefone: "41999990000" },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: json("Pagamento", ref("Pagamento")),
          400: erro("Dados inválidos"),
          403: erro("Produto sem pagamento real liberado"),
          404: erro("Pedido não encontrado"),
          409: erro("Pedido não está mais aguardando pagamento"),
          503: erro("Asaas não respondeu, tente de novo"),
        },
      },
    },
    "/api/pedidos/{id}/status": {
      get: {
        tags: ["Checkout"],
        summary: "Status atual do pedido",
        description: "Se o pedido ainda estiver pendente, consulta o Asaas antes de responder. Funciona mesmo sem o webhook.",
        parameters: [id],
        responses: { 200: json("Status", { type: "object", properties: { status: { enum: [...STATUS_PEDIDO] } } }), 404: erro("Pedido não encontrado") },
      },
    },
    "/api/webhooks/asaas": {
      post: {
        tags: ["Asaas"],
        summary: "Recebe os eventos de cobrança do Asaas",
        description: "Exige o header asaas-access-token. Um evento repetido não muda nada. O status é lido do Asaas, nunca do corpo.",
        security: [{ asaas: [] }],
        requestBody: corpo(webhookSchema, { id: "evt_05b708f961d739ea7eba7e4db318f621", event: "PAYMENT_RECEIVED", payment: { id: "pay_080225913252" } }),
        responses: { 200: json("Recebido", { type: "object" }), 401: erro("Token inválido") },
      },
    },
    "/api/cron/expirar": {
      get: {
        tags: ["Asaas"],
        summary: "Expira pedidos vencidos e devolve o estoque",
        security: [{ cron: [] }],
        responses: { 200: json("Quantos expiraram", { type: "object" }), 401: erro("Sem o segredo do Cron") },
      },
    },
    "/api/admin/sessao": {
      get: { tags: ["Admin"], summary: "Diz se a sessão de admin está aberta", responses: { 200: json("Sessão", { type: "object" }) } },
      post: {
        tags: ["Admin"],
        summary: "Abre a sessão de admin",
        requestBody: corpo(loginAdminSchema, { senha: "..." }),
        responses: { 200: json("Sessão aberta, cookie admin gravado", { type: "object" }), 401: erro("Senha errada") },
      },
    },
    "/api/admin/pedidos": {
      get: {
        tags: ["Admin"],
        summary: "Últimos 50 pedidos, com pagamento e histórico de status",
        security: [{ admin: [] }],
        responses: { 200: json("Pedidos", { type: "array", items: { type: "object" } }), 401: erro("Sem sessão") },
      },
    },
    "/api/admin/pedidos/{id}/estorno": {
      post: {
        tags: ["Admin"],
        summary: "Estorna o pagamento aprovado pelo Asaas",
        security: [{ admin: [] }],
        parameters: [id],
        responses: { 200: json("Estornado", { type: "object" }), 401: erro("Sem sessão"), 409: erro("Nada aprovado para estornar") },
      },
    },
  },
  components: {
    securitySchemes: {
      admin: { type: "apiKey", in: "cookie", name: "admin" },
      asaas: { type: "apiKey", in: "header", name: "asaas-access-token" },
      cron: { type: "http", scheme: "bearer" },
    },
    schemas: {
      Erro: {
        type: "object",
        required: ["erro"],
        properties: { erro: { type: "string" }, detalhes: { description: "Campos inválidos e as mensagens de cada um" } },
      },
      Produto: {
        type: "object",
        properties: {
          slug: { type: "string" },
          nome: { type: "string" },
          categoria: { type: "string" },
          precoCentavos: { type: "integer" },
          estoque: { type: "integer" },
          pagamentoRealLiberado: { type: "boolean" },
        },
      },
      Pagamento: {
        type: "object",
        properties: {
          id: { type: "string" },
          metodo: { enum: ["pix", "credito", "debito"] },
          status: { enum: [...STATUS_PEDIDO] },
          pix: { type: ["object", "null"], properties: { payload: { type: "string" }, imagem: { type: "string", description: "PNG em base64" } } },
          invoiceUrl: { type: ["string", "null"] },
          motivoRecusa: { type: ["string", "null"] },
        },
      },
    },
  },
};

// operationId vira o nome de cada requisição na coleção do Postman: GET /api/pedidos/{id} → getPedidosId.
function operationId(metodo: string, caminho: string) {
  const partes = caminho.replace(/^\/api\//, "").split(/[/.{}-]+/).filter(Boolean);
  return metodo + partes.map((p) => p[0].toUpperCase() + p.slice(1)).join("");
}

export const especificacao = {
  ...documento,
  paths: Object.fromEntries(
    Object.entries(documento.paths).map(([caminho, metodos]) => [
      caminho,
      Object.fromEntries(Object.entries(metodos).map(([m, op]) => [m, { operationId: operationId(m, caminho), ...op }])),
    ]),
  ),
};
