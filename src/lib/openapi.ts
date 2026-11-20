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
      get: {
        tags: ["Catálogo"],
        summary: "Banco respondendo",
        responses: {
          200: json("Tudo certo", { type: "object", properties: { status: { const: "ok" }, banco: { const: "ok" } } }),
          503: json("Banco fora do ar", { type: "object", properties: { status: { const: "erro" }, banco: { const: "indisponivel" } } }),
        },
      },
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
        responses: {
          200: json("Produto", {
            allOf: [
              ref("Produto"),
              { type: "object", properties: { metodos: { type: "array", items: { type: "object", properties: { slug: { type: "string" }, nome: { type: "string" } } } } } },
            ],
          }),
          404: erro("Produto não encontrado"),
        },
      },
    },
    "/api/metodos": {
      get: { tags: ["Catálogo"], summary: "Métodos de preparo", responses: { 200: json("Métodos", { type: "array", items: ref("Metodo") }) } },
    },
    "/api/metodos/{slug}": {
      get: {
        tags: ["Catálogo"],
        summary: "Método de preparo e o kit para fazer",
        parameters: [{ ...slug, example: "v60" }],
        responses: {
          200: json("Método", { allOf: [ref("Metodo"), { type: "object", properties: { kit: { type: "array", items: ref("Produto") } } }] }),
          404: erro("Método não encontrado"),
        },
      },
    },
    "/api/carrinho/cotacao": {
      post: {
        tags: ["Checkout"],
        summary: "Calcula o total pelo preço do banco",
        description: "Itens com o mesmo slug são somados. Não reserva estoque.",
        requestBody: corpo(cotacaoSchema, { itens: pedidoExemplo.itens }),
        responses: {
          200: json("Cotação", {
            type: "object",
            properties: {
              itens: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    slug: { type: "string" },
                    nome: { type: "string" },
                    precoCentavos: { type: "integer" },
                    pagamentoRealLiberado: { type: "boolean" },
                    quantidade: { type: "integer" },
                    subtotalCentavos: { type: "integer" },
                  },
                },
              },
              totalCentavos: { type: "integer" },
            },
          }),
          400: erro("Carrinho inválido"),
          404: erro("Produto não encontrado"),
        },
      },
    },
    "/api/pedidos": {
      post: {
        tags: ["Checkout"],
        summary: "Cria o pedido e reserva o estoque por 30 minutos",
        description:
          "O total é calculado no banco. Qualquer preço enviado no corpo é ignorado. A baixa de estoque é um `UPDATE produtos SET estoque = estoque - ? WHERE id = ? AND estoque >= ?` dentro da transação do pedido: quando várias compras disputam a última unidade, uma recebe 201 e as outras 409, sem estoque negativo. O cliente é criado no Asaas na primeira compra de cada CPF.",
        requestBody: corpo(pedidoSchema, pedidoExemplo),
        responses: {
          201: {
            ...json("Pedido criado, pendente", ref("PedidoCriado")),
            headers: { Location: { description: "/api/pedidos/{id}", schema: { type: "string" } } },
          },
          400: erro("Dados inválidos"),
          404: erro("Produto não encontrado"),
          409: erro("Estoque insuficiente, inclusive quando outra compra levou a última unidade no mesmo instante"),
          502: erro("O Asaas recusou o cadastro do cliente"),
        },
      },
    },
    "/api/pedidos/{id}": {
      get: {
        tags: ["Checkout"],
        summary: "Pedido, itens e pagamento atual",
        parameters: [id],
        responses: { 200: json("Pedido", ref("Pedido")), 404: erro("Pedido não encontrado") },
      },
    },
    "/api/pedidos/{id}/pagamentos": {
      post: {
        tags: ["Checkout"],
        summary: "Paga o pedido por Pix, crédito ou débito",
        description:
          "Pix devolve o QR Code e o copia e cola. Crédito é aprovado ou recusado na hora: a recusa também volta como 201, com status `recusado` e o motivo em `motivoRecusa`. Débito devolve a invoiceUrl do Asaas, onde o comprador paga. Repetir a chamada com o mesmo método devolve a mesma cobrança: a linha do pedido fica travada durante a chamada ao Asaas e um índice único impede dois pagamentos pendentes no mesmo pedido. Trocar de método cancela a cobrança anterior.",
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
          201: json("Pagamento criado ou o mesmo pagamento pendente", ref("Pagamento")),
          400: erro("Dados inválidos"),
          403: erro("Produto sem pagamento real liberado"),
          404: erro("Pedido não encontrado"),
          409: erro("Pedido não está mais aguardando pagamento"),
          502: erro("O Asaas recusou cancelar a cobrança anterior"),
          503: erro("Asaas não respondeu, tente de novo"),
        },
      },
    },
    "/api/pedidos/{id}/status": {
      get: {
        tags: ["Checkout"],
        summary: "Status atual do pedido",
        description: "Se o pedido ainda estiver pendente, consulta o Asaas antes de responder. Funciona mesmo sem o webhook. A tela do pedido chama esta rota a cada 3 segundos.",
        parameters: [id],
        responses: {
          200: json("Status", {
            type: "object",
            properties: {
              status: ref("StatusPedido"),
              expiraEm: { type: ["string", "null"], format: "date-time" },
              pagamento: {
                type: ["object", "null"],
                properties: { status: ref("StatusPedido"), metodo: { enum: ["pix", "credito", "debito"] }, motivoRecusa: { type: ["string", "null"] } },
              },
            },
          }),
          404: erro("Pedido não encontrado"),
          502: erro("O Asaas recusou a consulta"),
        },
      },
    },
    "/api/webhooks/asaas": {
      post: {
        tags: ["Asaas"],
        summary: "Recebe os eventos de cobrança do Asaas",
        description:
          "Exige o header asaas-access-token. O id de cada evento é gravado depois de processado: o mesmo evento chegando de novo devolve `repetido: true` e não muda nada. O status é lido do Asaas (GET /v3/payments/{id}), nunca do corpo, e passa pela máquina de estados, então um evento fora de ordem não faz o pedido voltar atrás. Evento sem `payment` ou de cobrança que não é desta loja responde 200 para não travar a fila do Asaas.",
        security: [{ asaas: [] }],
        requestBody: corpo(webhookSchema, { id: "evt_05b708f961d739ea7eba7e4db318f621", event: "PAYMENT_RECEIVED", payment: { id: "pay_080225913252" } }),
        responses: {
          200: json("Recebido", { type: "object", properties: { recebido: { const: true }, repetido: { type: "boolean", description: "Só aparece quando o evento já tinha sido processado" } } }),
          401: erro("Token inválido"),
          500: { description: "Falha ao consultar o Asaas. O evento não é gravado, e o Asaas reenvia." },
        },
      },
    },
    "/api/cron/expirar": {
      get: {
        tags: ["Asaas"],
        summary: "Expira pedidos vencidos e devolve o estoque",
        description: "Chamado pelo Cron da Vercel. Um pedido pago no último minuto vale como pago, não expira.",
        security: [{ cron: [] }],
        responses: {
          200: json("Quantos pedidos vencidos foram tratados", { type: "object", properties: { expirados: { type: "integer" } } }),
          401: erro("Sem o segredo do Cron"),
        },
      },
    },
    "/api/admin/sessao": {
      get: {
        tags: ["Admin"],
        summary: "Diz se a sessão de admin está aberta",
        responses: { 200: json("Sessão", { type: "object", properties: { autenticado: { type: "boolean" } } }) },
      },
      post: {
        tags: ["Admin"],
        summary: "Abre a sessão de admin",
        description: "Grava o cookie `admin` (HttpOnly, SameSite=Strict, 8 horas), assinado com HMAC.",
        requestBody: corpo(loginAdminSchema, { senha: "..." }),
        responses: {
          200: {
            ...json("Sessão aberta", { type: "object", properties: { autenticado: { const: true } } }),
            headers: { "Set-Cookie": { description: "Cookie admin da sessão", schema: { type: "string" } } },
          },
          400: erro("Senha ausente"),
          401: erro("Senha errada"),
        },
      },
    },
    "/api/admin/pedidos": {
      get: {
        tags: ["Admin"],
        summary: "Últimos 50 pedidos, com pagamento e histórico de status",
        security: [{ admin: [] }],
        responses: { 200: json("Pedidos", { type: "array", items: ref("PedidoAdmin") }), 401: erro("Sem sessão") },
      },
    },
    "/api/admin/pedidos/{id}/estorno": {
      post: {
        tags: ["Admin"],
        summary: "Estorna o pagamento aprovado pelo Asaas",
        description: "Pede o estorno ao Asaas e leva o pedido a `estornado`, o que devolve o estoque.",
        security: [{ admin: [] }],
        parameters: [id],
        responses: {
          200: json("Estornado", { type: "object", properties: { id: { type: "string" }, status: { const: "estornado" } } }),
          401: erro("Sem sessão"),
          409: erro("Nada aprovado para estornar"),
          502: erro("O Asaas recusou o estorno; o motivo vem em detalhes"),
        },
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
        properties: {
          erro: { type: "string" },
          detalhes: { description: "Em 400, os campos inválidos e as mensagens de cada um. Em 502, a mensagem do Asaas." },
        },
      },
      StatusPedido: { enum: [...STATUS_PEDIDO] },
      Produto: {
        type: "object",
        properties: {
          id: { type: "integer" },
          slug: { type: "string" },
          categoria: { enum: ["cafes", "equipamentos", "acessorios"] },
          nome: { type: "string" },
          subtitulo: { type: ["string", "null"] },
          descricao: { type: "string" },
          origem: { type: ["string", "null"] },
          produtor: { type: ["string", "null"] },
          variedade: { type: ["string", "null"] },
          processo: { type: ["string", "null"] },
          altitudeM: { type: ["string", "null"] },
          notasSensoriais: { type: ["array", "null"], items: { type: "string" } },
          peso: { type: ["string", "null"] },
          imagem: { type: "string" },
          creditoImagem: { type: ["string", "null"] },
          precoCentavos: { type: "integer" },
          estoque: { type: "integer" },
          pagamentoRealLiberado: { type: "boolean" },
          destaque: { type: "boolean" },
        },
      },
      Metodo: {
        type: "object",
        properties: {
          id: { type: "integer" },
          slug: { type: "string" },
          nome: { type: "string" },
          resumo: { type: "string" },
          dificuldade: { enum: ["facil", "media", "dificil"] },
          tempoMin: { type: "integer" },
          proporcao: { type: "string" },
          moagem: { type: "string" },
          temperaturaC: { type: "string" },
          imagem: { type: "string" },
          creditoImagem: { type: ["string", "null"] },
        },
      },
      PedidoCriado: {
        type: "object",
        properties: { id: { type: "string", format: "uuid" }, totalCentavos: { type: "integer" }, expiraEm: { type: "string", format: "date-time" } },
      },
      Pedido: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          status: ref("StatusPedido"),
          nome: { type: "string" },
          totalCentavos: { type: "integer" },
          criadoEm: { type: "string", format: "date-time" },
          expiraEm: { type: ["string", "null"], format: "date-time" },
          itens: {
            type: "array",
            items: {
              type: "object",
              properties: {
                slug: { type: "string" },
                nome: { type: "string" },
                imagem: { type: "string" },
                quantidade: { type: "integer" },
                precoUnitarioCentavos: { type: "integer" },
              },
            },
          },
          pagamento: { oneOf: [ref("Pagamento"), { type: "null" }] },
        },
      },
      PedidoAdmin: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          status: ref("StatusPedido"),
          nome: { type: "string" },
          email: { type: "string" },
          totalCentavos: { type: "integer" },
          criadoEm: { type: "string", format: "date-time" },
          pagamento: { oneOf: [ref("Pagamento"), { type: "null" }] },
          historico: {
            type: "array",
            items: {
              type: "object",
              properties: {
                de: { oneOf: [ref("StatusPedido"), { type: "null" }] },
                para: ref("StatusPedido"),
                origem: { enum: ["criacao", "consulta", "webhook", "admin", "expiracao"] },
                em: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
      Pagamento: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          pedidoId: { type: "string", format: "uuid" },
          metodo: { enum: ["pix", "credito", "debito"] },
          status: ref("StatusPedido"),
          parcelas: { type: "integer" },
          pix: {
            type: ["object", "null"],
            properties: {
              payload: { type: "string", description: "Pix copia e cola" },
              imagem: { type: "string", description: "QR Code em PNG, base64" },
              expiraEm: { type: ["string", "null"], format: "date-time" },
            },
          },
          invoiceUrl: { type: ["string", "null"], description: "Fatura do Asaas, usada no débito e no desafio 3DS" },
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
