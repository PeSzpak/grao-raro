import { mkdirSync, writeFileSync } from "node:fs";

// Gera a coleção e os ambientes do Postman. Rodar com `npm run postman` depois de mudar a API.

type Requisicao = {
  nome: string;
  metodo: "GET" | "POST";
  caminho: string;
  corpo?: unknown;
  headers?: Record<string, string>;
  testes: string[];
  antes?: string[];
};

const json = (status: number) => [
  `pm.test("status ${status}", () => pm.response.to.have.status(${status}));`,
  `pm.test("responde JSON", () => pm.response.to.be.json);`,
];

const pedido = (mudanca: object = {}) => ({
  nome: "Ana Souza",
  email: "ana@example.com",
  cpf: "529.982.247-25",
  itens: [{ slug: "amostra-degustacao", quantidade: 1 }],
  aceiteAcademico: true,
  ...mudanca,
});

const pastas: Record<string, Requisicao[]> = {
  "1. Catálogo": [
    {
      nome: "Saúde do banco",
      metodo: "GET",
      caminho: "/api/health",
      testes: [...json(200), `pm.test("banco ok", () => pm.expect(pm.response.json().banco).to.eql("ok"));`],
    },
    {
      nome: "Listar produtos",
      metodo: "GET",
      caminho: "/api/produtos",
      testes: [
        ...json(200),
        `const produtos = pm.response.json();`,
        `pm.test("tem cafés, equipamentos e acessórios", () => pm.expect(new Set(produtos.map((p) => p.categoria))).to.have.all.keys("cafes", "equipamentos", "acessorios"));`,
        `pm.test("a amostra é a única com pagamento real", () => pm.expect(produtos.filter((p) => p.pagamentoRealLiberado).map((p) => p.slug)).to.eql(["amostra-degustacao"]));`,
        `pm.test("preço em centavos inteiros", () => produtos.forEach((p) => pm.expect(Number.isInteger(p.precoCentavos)).to.be.true));`,
      ],
    },
    {
      nome: "Filtrar só cafés",
      metodo: "GET",
      caminho: "/api/produtos?categoria=cafes",
      testes: [...json(200), `pm.test("só cafés", () => pm.response.json().forEach((p) => pm.expect(p.categoria).to.eql("cafes")));`],
    },
    {
      nome: "Filtro com categoria inválida",
      metodo: "GET",
      caminho: "/api/produtos?categoria=bebidas",
      testes: [...json(400), `pm.test("aponta o campo", () => pm.expect(pm.response.json().detalhes).to.have.property("categoria"));`],
    },
    {
      nome: "Detalhe da amostra",
      metodo: "GET",
      caminho: "/api/produtos/amostra-degustacao",
      testes: [
        ...json(200),
        `const amostra = pm.response.json();`,
        `pm.test("custa R$ 5,00", () => pm.expect(amostra.precoCentavos).to.eql(500));`,
        `pm.collectionVariables.set("precoAmostra", amostra.precoCentavos);`,
      ],
    },
    {
      nome: "Produto que não existe",
      metodo: "GET",
      caminho: "/api/produtos/cafe-que-nao-existe",
      testes: [...json(404), `pm.test("mensagem de erro", () => pm.expect(pm.response.json().erro).to.be.a("string"));`],
    },
    {
      nome: "Métodos de preparo",
      metodo: "GET",
      caminho: "/api/metodos",
      testes: [...json(200), `pm.test("oito métodos", () => pm.expect(pm.response.json()).to.have.lengthOf(8));`],
    },
    {
      nome: "V60 e o kit para fazer",
      metodo: "GET",
      caminho: "/api/metodos/v60",
      testes: [...json(200), `pm.test("tem kit", () => pm.expect(pm.response.json().kit).to.be.an("array").that.is.not.empty);`],
    },
  ],
  "2. Checkout": [
    {
      nome: "Cotação do carrinho",
      metodo: "POST",
      caminho: "/api/carrinho/cotacao",
      corpo: { itens: [{ slug: "amostra-degustacao", quantidade: 2 }] },
      testes: [
        ...json(200),
        `pm.test("total calculado no banco", () => pm.expect(pm.response.json().totalCentavos).to.eql(2 * pm.collectionVariables.get("precoAmostra")));`,
      ],
    },
    {
      nome: "Criar pedido com preço adulterado",
      metodo: "POST",
      caminho: "/api/pedidos",
      corpo: pedido({ totalCentavos: 1, itens: [{ slug: "amostra-degustacao", quantidade: 1, precoCentavos: 1 }] }),
      testes: [
        ...json(201),
        `const criado = pm.response.json();`,
        `pm.test("ignora o preço enviado", () => pm.expect(criado.totalCentavos).to.eql(pm.collectionVariables.get("precoAmostra")));`,
        `pm.test("reserva expira em até 30 minutos", () => pm.expect(new Date(criado.expiraEm) - Date.now()).to.be.within(25 * 60000, 31 * 60000));`,
        `pm.test("Location aponta para o pedido", () => pm.expect(pm.response.headers.get("Location")).to.eql("/api/pedidos/" + criado.id));`,
        `pm.collectionVariables.set("pedidoId", criado.id);`,
      ],
    },
    {
      nome: "Pedido com CPF inválido",
      metodo: "POST",
      caminho: "/api/pedidos",
      corpo: pedido({ cpf: "111.111.111-11" }),
      testes: [...json(400), `pm.test("aponta o CPF", () => pm.expect(pm.response.json().detalhes.cpf[0]).to.eql("CPF inválido"));`],
    },
    {
      nome: "Pedido sem o aceite acadêmico",
      metodo: "POST",
      caminho: "/api/pedidos",
      corpo: pedido({ aceiteAcademico: false }),
      testes: [...json(400), `pm.test("aponta o aceite", () => pm.expect(pm.response.json().detalhes).to.have.property("aceiteAcademico"));`],
    },
    {
      nome: "Pedido com quantidade zero",
      metodo: "POST",
      caminho: "/api/pedidos",
      corpo: pedido({ itens: [{ slug: "amostra-degustacao", quantidade: 0 }] }),
      testes: [...json(400)],
    },
    {
      nome: "Pedido de produto que não existe",
      metodo: "POST",
      caminho: "/api/pedidos",
      corpo: pedido({ itens: [{ slug: "cafe-que-nao-existe", quantidade: 1 }] }),
      testes: [...json(404)],
    },
    {
      nome: "Ver o pedido",
      metodo: "GET",
      caminho: "/api/pedidos/{{pedidoId}}",
      testes: [
        ...json(200),
        `const p = pm.response.json();`,
        `pm.test("pendente e sem pagamento", () => { pm.expect(p.status).to.eql("pendente"); pm.expect(p.pagamento).to.be.null; });`,
        `pm.test("um item, a amostra", () => pm.expect(p.itens.map((i) => i.slug)).to.eql(["amostra-degustacao"]));`,
      ],
    },
    {
      nome: "Pagar com Pix (cobrança real no Asaas)",
      metodo: "POST",
      caminho: "/api/pedidos/{{pedidoId}}/pagamentos",
      corpo: { metodo: "pix" },
      testes: [
        ...json(201),
        `const pg = pm.response.json();`,
        `pm.test("Pix pendente", () => { pm.expect(pg.metodo).to.eql("pix"); pm.expect(pg.status).to.eql("pendente"); });`,
        `pm.test("copia e cola no padrão do Banco Central", () => pm.expect(pg.pix.payload).to.match(/^000201/));`,
        `pm.test("QR Code em PNG", () => pm.expect(pg.pix.imagem).to.match(/^iVBORw0KGgo/));`,
        `pm.collectionVariables.set("pagamentoId", pg.id);`,
      ],
    },
    {
      nome: "Clicar em pagar de novo devolve a mesma cobrança",
      metodo: "POST",
      caminho: "/api/pedidos/{{pedidoId}}/pagamentos",
      corpo: { metodo: "pix" },
      testes: [...json(201), `pm.test("mesmo pagamento", () => pm.expect(pm.response.json().id).to.eql(pm.collectionVariables.get("pagamentoId")));`],
    },
    {
      nome: "Cartão sem os dados",
      metodo: "POST",
      caminho: "/api/pedidos/{{pedidoId}}/pagamentos",
      corpo: { metodo: "credito", parcelas: 1 },
      testes: [...json(400), `pm.test("pede cartão e titular", () => pm.expect(pm.response.json().detalhes).to.include.keys("cartao", "titular"));`],
    },
    {
      nome: "Método de pagamento que não existe",
      metodo: "POST",
      caminho: "/api/pedidos/{{pedidoId}}/pagamentos",
      corpo: { metodo: "boleto" },
      testes: [...json(400)],
    },
    {
      nome: "Status do pedido",
      metodo: "GET",
      caminho: "/api/pedidos/{{pedidoId}}/status",
      testes: [
        ...json(200),
        `const s = pm.response.json();`,
        `pm.test("aguardando o Pix", () => { pm.expect(s.status).to.eql("pendente"); pm.expect(s.pagamento.metodo).to.eql("pix"); });`,
      ],
    },
    {
      nome: "Criar pedido de um café caro",
      metodo: "POST",
      caminho: "/api/pedidos",
      corpo: pedido({ itens: [{ slug: "chemex", quantidade: 1 }] }),
      testes: [...json(201), `pm.collectionVariables.set("pedidoBloqueadoId", pm.response.json().id);`],
    },
    {
      nome: "Pagamento real bloqueado fora da amostra",
      metodo: "POST",
      caminho: "/api/pedidos/{{pedidoBloqueadoId}}/pagamentos",
      corpo: { metodo: "pix" },
      testes: [...json(403), `pm.test("explica o motivo", () => pm.expect(pm.response.json().erro).to.include("Amostra"));`],
    },
    {
      nome: "Pedido que não existe",
      metodo: "GET",
      caminho: "/api/pedidos/00000000-0000-0000-0000-000000000000",
      testes: [...json(404)],
    },
  ],
  "3. Asaas": [
    {
      nome: "Webhook sem o token do Asaas",
      metodo: "POST",
      caminho: "/api/webhooks/asaas",
      corpo: { id: "evt_teste", event: "PAYMENT_RECEIVED", payment: { id: "pay_teste" } },
      testes: [...json(401)],
    },
    {
      nome: "Webhook com token errado",
      metodo: "POST",
      caminho: "/api/webhooks/asaas",
      headers: { "asaas-access-token": "token-errado" },
      corpo: { id: "evt_teste", event: "PAYMENT_RECEIVED", payment: { id: "pay_teste" } },
      testes: [...json(401)],
    },
    {
      nome: "Cron sem o segredo",
      metodo: "GET",
      caminho: "/api/cron/expirar",
      testes: [...json(401)],
    },
  ],
  "4. Admin": [
    {
      nome: "Lista de pedidos sem sessão",
      metodo: "GET",
      caminho: "/api/admin/pedidos",
      testes: [...json(401)],
    },
    {
      nome: "Login com senha errada",
      metodo: "POST",
      caminho: "/api/admin/sessao",
      corpo: { senha: "senha-errada" },
      testes: [...json(401), `pm.test("não abre sessão", () => pm.expect(pm.response.headers.has("Set-Cookie")).to.be.false);`],
    },
    {
      nome: "Login de admin",
      metodo: "POST",
      caminho: "/api/admin/sessao",
      corpo: { senha: "{{adminSenha}}" },
      antes: [`if (!pm.environment.get("adminSenha")) pm.execution.skipRequest();`],
      testes: [...json(200), `pm.test("cookie de sessão", () => pm.expect(pm.cookies.has("admin")).to.be.true);`],
    },
    {
      nome: "Lista de pedidos",
      metodo: "GET",
      caminho: "/api/admin/pedidos",
      antes: [`if (!pm.environment.get("adminSenha")) pm.execution.skipRequest();`],
      testes: [
        ...json(200),
        `const pedido = pm.response.json().find((p) => p.id === pm.collectionVariables.get("pedidoId"));`,
        `pm.test("mostra o pedido criado com o histórico", () => pm.expect(pedido.historico[0].origem).to.eql("criacao"));`,
      ],
    },
    {
      nome: "Estornar pedido que não foi pago",
      metodo: "POST",
      caminho: "/api/admin/pedidos/{{pedidoId}}/estorno",
      antes: [`if (!pm.environment.get("adminSenha")) pm.execution.skipRequest();`],
      testes: [...json(409)],
    },
  ],
};

const colecao = {
  info: {
    name: "Grão Raro",
    description:
      "Testes da API do checkout. Rode a coleção inteira, na ordem. A requisição de Pix cria uma cobrança real na conta de produção do Asaas, que expira sozinha em 30 minutos sem cobrar nada. As requisições de admin só rodam se a variável adminSenha estiver preenchida no ambiente.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "pedidoId", value: "" },
    { key: "pedidoBloqueadoId", value: "" },
    { key: "pagamentoId", value: "" },
    { key: "precoAmostra", value: "" },
  ],
  item: Object.entries(pastas).map(([pasta, requisicoes]) => ({
    name: pasta,
    item: requisicoes.map((r) => ({
      name: r.nome,
      event: [
        ...(r.antes ? [{ listen: "prerequest", script: { type: "text/javascript", exec: r.antes } }] : []),
        { listen: "test", script: { type: "text/javascript", exec: r.testes } },
      ],
      request: {
        method: r.metodo,
        header: [
          ...(r.corpo === undefined ? [] : [{ key: "Content-Type", value: "application/json" }]),
          ...Object.entries(r.headers ?? {}).map(([key, value]) => ({ key, value })),
        ],
        url: `{{baseUrl}}${r.caminho}`,
        ...(r.corpo === undefined ? {} : { body: { mode: "raw", raw: JSON.stringify(r.corpo, null, 2) } }),
      },
    })),
  })),
};

const ambiente = (nome: string, baseUrl: string) => ({
  name: nome,
  values: [
    { key: "baseUrl", value: baseUrl, enabled: true },
    { key: "adminSenha", value: "", type: "secret", enabled: true },
  ],
});

mkdirSync("postman", { recursive: true });
writeFileSync("postman/grao-raro.postman_collection.json", JSON.stringify(colecao, null, 2) + "\n");
writeFileSync("postman/local.postman_environment.json", JSON.stringify(ambiente("Grão Raro local", "http://localhost:3000"), null, 2) + "\n");
const total = Object.values(pastas).flat().length;
console.log(`Coleção com ${total} requisições em postman/`);
