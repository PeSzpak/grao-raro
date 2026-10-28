CREATE TABLE `categorias` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`slug` varchar(40) NOT NULL,
	`nome` varchar(80) NOT NULL,
	CONSTRAINT `categorias_id` PRIMARY KEY(`id`),
	CONSTRAINT `categorias_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`cpf_hash` char(64) NOT NULL,
	`asaas_customer_id` varchar(40) NOT NULL,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clientes_id` PRIMARY KEY(`id`),
	CONSTRAINT `clientes_cpf_hash_unique` UNIQUE(`cpf_hash`)
);
--> statement-breakpoint
CREATE TABLE `eventos_pagamento` (
	`id_evento` varchar(80) NOT NULL,
	`provedor` varchar(20) NOT NULL,
	`tipo` varchar(60) NOT NULL,
	`id_externo` varchar(60),
	`payload_sanitizado` json,
	`recebido_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `eventos_pagamento_id_evento` PRIMARY KEY(`id_evento`)
);
--> statement-breakpoint
CREATE TABLE `historico_status` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`pedido_id` char(36) NOT NULL,
	`de` enum('pendente','aprovado','recusado','expirado','cancelado','estornado','contestado'),
	`para` enum('pendente','aprovado','recusado','expirado','cancelado','estornado','contestado') NOT NULL,
	`origem` enum('criacao','consulta','webhook','admin','expiracao') NOT NULL,
	`em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `historico_status_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `itens_pedido` (
	`pedido_id` char(36) NOT NULL,
	`produto_id` int unsigned NOT NULL,
	`quantidade` smallint unsigned NOT NULL,
	`preco_unitario_centavos` int unsigned NOT NULL,
	CONSTRAINT `itens_pedido_pedido_id_produto_id_pk` PRIMARY KEY(`pedido_id`,`produto_id`)
);
--> statement-breakpoint
CREATE TABLE `metodo_produtos` (
	`metodo_id` int unsigned NOT NULL,
	`produto_id` int unsigned NOT NULL,
	CONSTRAINT `metodo_produtos_metodo_id_produto_id_pk` PRIMARY KEY(`metodo_id`,`produto_id`)
);
--> statement-breakpoint
CREATE TABLE `metodos_preparo` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`slug` varchar(60) NOT NULL,
	`nome` varchar(80) NOT NULL,
	`resumo` varchar(300) NOT NULL,
	`dificuldade` enum('facil','media','dificil') NOT NULL,
	`tempo_min` smallint NOT NULL,
	`proporcao` varchar(40) NOT NULL,
	`moagem` varchar(60) NOT NULL,
	`temperatura_c` varchar(20) NOT NULL,
	`imagem` varchar(255) NOT NULL,
	`credito_imagem` varchar(160),
	CONSTRAINT `metodos_preparo_id` PRIMARY KEY(`id`),
	CONSTRAINT `metodos_preparo_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `pagamentos` (
	`id` char(36) NOT NULL,
	`pedido_id` char(36) NOT NULL,
	`provedor` varchar(20) NOT NULL,
	`id_externo` varchar(60),
	`metodo` enum('pix','credito','debito') NOT NULL,
	`status` enum('pendente','aprovado','recusado','expirado','cancelado','estornado','contestado') NOT NULL DEFAULT 'pendente',
	`parcelas` smallint unsigned NOT NULL DEFAULT 1,
	`pix_payload` text,
	`pix_imagem` mediumtext,
	`invoice_url` varchar(255),
	`motivo_recusa` varchar(255),
	`expira_em` datetime,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`pendente_de` char(36) GENERATED ALWAYS AS (IF(status = 'pendente', pedido_id, NULL)) STORED,
	CONSTRAINT `pagamentos_id` PRIMARY KEY(`id`),
	CONSTRAINT `pagamentos_id_externo_unique` UNIQUE(`id_externo`),
	CONSTRAINT `pagamentos_um_pendente_por_pedido` UNIQUE(`pendente_de`)
);
--> statement-breakpoint
CREATE TABLE `pedidos` (
	`id` char(36) NOT NULL,
	`cliente_id` int unsigned,
	`nome` varchar(160) NOT NULL,
	`email` varchar(200) NOT NULL,
	`total_centavos` int unsigned NOT NULL,
	`status` enum('pendente','aprovado','recusado','expirado','cancelado','estornado','contestado') NOT NULL DEFAULT 'pendente',
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pedidos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `produtos` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`categoria_id` int unsigned NOT NULL,
	`nome` varchar(160) NOT NULL,
	`subtitulo` varchar(200),
	`descricao` text NOT NULL,
	`origem` varchar(120),
	`produtor` varchar(160),
	`variedade` varchar(120),
	`processo` varchar(80),
	`altitude_m` varchar(40),
	`notas_sensoriais` json,
	`peso` varchar(40),
	`imagem` varchar(255) NOT NULL,
	`credito_imagem` varchar(160),
	`preco_centavos` int unsigned NOT NULL,
	`estoque` int unsigned NOT NULL DEFAULT 0,
	`pagamento_real_liberado` boolean NOT NULL DEFAULT false,
	`destaque` boolean NOT NULL DEFAULT false,
	`ativo` boolean NOT NULL DEFAULT true,
	CONSTRAINT `produtos_id` PRIMARY KEY(`id`),
	CONSTRAINT `produtos_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `reservas` (
	`pedido_id` char(36) NOT NULL,
	`produto_id` int unsigned NOT NULL,
	`quantidade` smallint unsigned NOT NULL,
	`expira_em` datetime NOT NULL,
	`liberada_em` datetime,
	CONSTRAINT `reservas_pedido_id_produto_id_pk` PRIMARY KEY(`pedido_id`,`produto_id`)
);
--> statement-breakpoint
CREATE INDEX `historico_pedido_idx` ON `historico_status` (`pedido_id`);--> statement-breakpoint
CREATE INDEX `pagamentos_pedido_idx` ON `pagamentos` (`pedido_id`);--> statement-breakpoint
CREATE INDEX `produtos_categoria_idx` ON `produtos` (`categoria_id`);--> statement-breakpoint
CREATE INDEX `reservas_expira_idx` ON `reservas` (`expira_em`);