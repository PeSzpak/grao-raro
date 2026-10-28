import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  datetime,
  index,
  int,
  json,
  mediumtext,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const STATUS_PEDIDO = [
  "pendente",
  "aprovado",
  "recusado",
  "expirado",
  "cancelado",
  "estornado",
  "contestado",
] as const;

export const METODOS = ["pix", "credito", "debito"] as const;

export const categorias = mysqlTable("categorias", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 40 }).notNull().unique(),
  nome: varchar("nome", { length: 80 }).notNull(),
});

export const produtos = mysqlTable(
  "produtos",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    categoriaId: int("categoria_id", { unsigned: true }).notNull(),
    nome: varchar("nome", { length: 160 }).notNull(),
    subtitulo: varchar("subtitulo", { length: 200 }),
    descricao: text("descricao").notNull(),
    origem: varchar("origem", { length: 120 }),
    produtor: varchar("produtor", { length: 160 }),
    variedade: varchar("variedade", { length: 120 }),
    processo: varchar("processo", { length: 80 }),
    altitudeM: varchar("altitude_m", { length: 40 }),
    notasSensoriais: json("notas_sensoriais").$type<string[]>(),
    peso: varchar("peso", { length: 40 }),
    imagem: varchar("imagem", { length: 255 }).notNull(),
    creditoImagem: varchar("credito_imagem", { length: 160 }),
    precoCentavos: int("preco_centavos", { unsigned: true }).notNull(),
    estoque: int("estoque", { unsigned: true }).notNull().default(0),
    pagamentoRealLiberado: boolean("pagamento_real_liberado").notNull().default(false),
    destaque: boolean("destaque").notNull().default(false),
    ativo: boolean("ativo").notNull().default(true),
  },
  (t) => [index("produtos_categoria_idx").on(t.categoriaId)],
);

export const metodosPreparo = mysqlTable("metodos_preparo", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  nome: varchar("nome", { length: 80 }).notNull(),
  resumo: varchar("resumo", { length: 300 }).notNull(),
  dificuldade: mysqlEnum("dificuldade", ["facil", "media", "dificil"]).notNull(),
  tempoMin: smallint("tempo_min").notNull(),
  proporcao: varchar("proporcao", { length: 40 }).notNull(),
  moagem: varchar("moagem", { length: 60 }).notNull(),
  temperaturaC: varchar("temperatura_c", { length: 60 }).notNull(),
  imagem: varchar("imagem", { length: 255 }).notNull(),
  creditoImagem: varchar("credito_imagem", { length: 160 }),
});

export const metodoProdutos = mysqlTable(
  "metodo_produtos",
  {
    metodoId: int("metodo_id", { unsigned: true }).notNull(),
    produtoId: int("produto_id", { unsigned: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.metodoId, t.produtoId] })],
);

export const clientes = mysqlTable("clientes", {
  id: serial("id").primaryKey(),
  cpfHash: char("cpf_hash", { length: 64 }).notNull().unique(),
  asaasCustomerId: varchar("asaas_customer_id", { length: 40 }).notNull(),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const pedidos = mysqlTable("pedidos", {
  id: char("id", { length: 36 }).primaryKey(),
  clienteId: int("cliente_id", { unsigned: true }),
  nome: varchar("nome", { length: 160 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  totalCentavos: int("total_centavos", { unsigned: true }).notNull(),
  status: mysqlEnum("status", STATUS_PEDIDO).notNull().default("pendente"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em").notNull().defaultNow().onUpdateNow(),
});

export const itensPedido = mysqlTable(
  "itens_pedido",
  {
    pedidoId: char("pedido_id", { length: 36 }).notNull(),
    produtoId: int("produto_id", { unsigned: true }).notNull(),
    quantidade: smallint("quantidade", { unsigned: true }).notNull(),
    precoUnitarioCentavos: int("preco_unitario_centavos", { unsigned: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.pedidoId, t.produtoId] })],
);

export const reservas = mysqlTable(
  "reservas",
  {
    pedidoId: char("pedido_id", { length: 36 }).notNull(),
    produtoId: int("produto_id", { unsigned: true }).notNull(),
    quantidade: smallint("quantidade", { unsigned: true }).notNull(),
    expiraEm: datetime("expira_em").notNull(),
    liberadaEm: datetime("liberada_em"),
  },
  (t) => [primaryKey({ columns: [t.pedidoId, t.produtoId] }), index("reservas_expira_idx").on(t.expiraEm)],
);

export const pagamentos = mysqlTable(
  "pagamentos",
  {
    id: char("id", { length: 36 }).primaryKey(),
    pedidoId: char("pedido_id", { length: 36 }).notNull(),
    provedor: varchar("provedor", { length: 20 }).notNull(),
    idExterno: varchar("id_externo", { length: 60 }).unique(),
    metodo: mysqlEnum("metodo", METODOS).notNull(),
    status: mysqlEnum("status", STATUS_PEDIDO).notNull().default("pendente"),
    parcelas: smallint("parcelas", { unsigned: true }).notNull().default(1),
    pixPayload: text("pix_payload"),
    pixImagem: mediumtext("pix_imagem"),
    invoiceUrl: varchar("invoice_url", { length: 255 }),
    motivoRecusa: varchar("motivo_recusa", { length: 255 }),
    expiraEm: datetime("expira_em"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    // MySQL não tem índice parcial: a coluna só tem valor enquanto o pagamento está pendente.
    pendenteDe: char("pendente_de", { length: 36 }).generatedAlwaysAs(
      sql`IF(status = 'pendente', pedido_id, NULL)`,
      { mode: "stored" },
    ),
  },
  (t) => [uniqueIndex("pagamentos_um_pendente_por_pedido").on(t.pendenteDe), index("pagamentos_pedido_idx").on(t.pedidoId)],
);

export const eventosPagamento = mysqlTable("eventos_pagamento", {
  idEvento: varchar("id_evento", { length: 80 }).primaryKey(),
  provedor: varchar("provedor", { length: 20 }).notNull(),
  tipo: varchar("tipo", { length: 60 }).notNull(),
  idExterno: varchar("id_externo", { length: 60 }),
  payloadSanitizado: json("payload_sanitizado"),
  recebidoEm: timestamp("recebido_em").notNull().defaultNow(),
});

export const historicoStatus = mysqlTable(
  "historico_status",
  {
    id: serial("id").primaryKey(),
    pedidoId: char("pedido_id", { length: 36 }).notNull(),
    de: mysqlEnum("de", STATUS_PEDIDO),
    para: mysqlEnum("para", STATUS_PEDIDO).notNull(),
    origem: mysqlEnum("origem", ["criacao", "consulta", "webhook", "admin", "expiracao"]).notNull(),
    em: timestamp("em").notNull().defaultNow(),
  },
  (t) => [index("historico_pedido_idx").on(t.pedidoId)],
);
