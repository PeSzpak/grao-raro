# Grão Raro

Loja de cafés raros com checkout real pelo Asaas: Pix, cartão de crédito e cartão de débito, com estoque reservado e status atualizado por webhook. Trabalho da disciplina "Construção e Integração de APIs RESTful com Padrões de Projeto", Senac.

**No ar:** https://grao-raro.sinovaz.com · **API:** [Swagger em /docs](https://grao-raro.sinovaz.com/docs)

![Do catálogo ao pagamento: produto, dados do comprador, Pix, crédito, débito e o Swagger](docs/media/demo.gif)

Por ser um projeto acadêmico, só a "Amostra de degustação" (R$ 5,00) pode ser paga de verdade. Os outros produtos passam pelo checkout inteiro e param no pagamento com um 403. Todo valor recebido é estornado pelo painel `/admin`, e nenhum pedido é enviado.

## O que faz

- Catálogo de cafés, equipamentos e acessórios, com filtro por categoria, origem e processo, e 8 métodos de preparo com o kit de cada um.
- Carrinho com o total calculado no banco. Preço enviado pelo navegador é ignorado.
- Pedido que baixa o estoque e reserva as unidades por 30 minutos. Reserva vencida volta para o estoque.
- Pagamento por Pix (QR Code e copia e cola), crédito (aprovado ou recusado na hora) e débito (pago na fatura do Asaas).
- Status do pedido atualizado pelo webhook do Asaas ou, sem ele, por consulta direta ao Asaas a cada 3 segundos na tela do pedido.
- Painel `/admin` com senha: últimos 50 pedidos, histórico de status de cada um e estorno com um clique.
- API REST documentada em OpenAPI 3.1, gerada dos mesmos schemas Zod que validam as requisições.

| Vitrine | Produto |
|---|---|
| ![Página inicial da Grão Raro](docs/media/home.webp) | ![Página do café Geisha Hacienda La Esmeralda](docs/media/produto.webp) |
| **Dez compras da última unidade** | **Swagger em /docs** |
| ![Dez requisições simultâneas: um 201 e nove 409](docs/media/estoque-409.webp) | ![Swagger UI com as rotas da API](docs/media/swagger.webp) |

## Stack

| Camada | Escolha |
|---|---|
| Aplicação | Next.js 16 (App Router), React 19, TypeScript |
| Banco | MySQL 8.4 com Drizzle ORM. Docker no desenvolvimento, Aiven em produção, com SSL. |
| Validação | Zod 4, com as mensagens em português |
| Pagamento | API v3 do Asaas, em produção |
| Documentação da API | OpenAPI 3.1 gerado dos schemas Zod, Swagger UI em `/docs`, coleção do Postman |
| Testes | Vitest contra o MySQL real e o Asaas real, coleção do Postman rodada pelo Newman |
| Hospedagem | Vercel, com Cron para expirar reservas |

## Como o pagamento funciona

```mermaid
sequenceDiagram
    participant C as Comprador
    participant A as API Grão Raro
    participant D as MySQL
    participant S as Asaas

    C->>A: POST /api/pedidos
    A->>D: UPDATE produtos SET estoque = estoque - n WHERE estoque >= n
    alt sobrou estoque
        A->>D: grava pedido, itens e reserva de 30 min (mesma transação)
        A-->>C: 201, pedido pendente
    else outra compra levou a última unidade
        A-->>C: 409 Estoque insuficiente
    end

    C->>A: POST /api/pedidos/{id}/pagamentos
    A->>D: SELECT ... FOR UPDATE no pedido, grava o pagamento pendente
    A->>S: procura a cobrança pela externalReference, senão POST /v3/payments
    S-->>A: cobrança, QR Code ou resultado do cartão
    A-->>C: 201, QR Code / aprovado / recusado / link da fatura

    S->>A: POST /api/webhooks/asaas (asaas-access-token)
    alt evento já gravado
        A-->>S: 200, repetido: true, nada muda
    else evento novo
        A->>S: GET /v3/payments/{id}, o status vem daqui
        A->>D: aplica a transição na máquina de estados e grava o evento
        A-->>S: 200
    end

    loop a cada 3 s enquanto pendente
        C->>A: GET /api/pedidos/{id}/status
        A->>S: consulta a cobrança (funciona sem o webhook)
    end
```

O pedido só anda para a frente. A regra fica em `src/domain/status.ts`, e o pagamento passa pela mesma máquina:

```mermaid
stateDiagram-v2
    [*] --> pendente
    pendente --> aprovado
    pendente --> recusado
    pendente --> expirado: reserva de 30 min venceu
    pendente --> cancelado: cobrança removida
    aprovado --> estornado: estorno pelo /admin
    aprovado --> contestado: chargeback
    contestado --> aprovado
    contestado --> estornado
```

Expirado, cancelado e estornado devolvem o estoque reservado.

Algumas decisões que valem a explicação:

- **Estoque sem Redis.** A baixa é um `UPDATE ... WHERE estoque >= ?` dentro da transação do pedido. Dez compras simultâneas da última unidade criam um pedido só e devolvem nove respostas 409. O teste fica em `src/services/pedidos.test.ts`.
- **Clique duplo no "Pagar".** A linha do pedido fica travada (`SELECT ... FOR UPDATE`) durante a chamada ao Asaas. Uma coluna gerada (`pendente_de`) com índice único impede dois pagamentos pendentes no mesmo pedido.
- **Resposta perdida na rede.** O pagamento é gravado antes da chamada. Uma nova tentativa procura a cobrança pela `externalReference` antes de criar outra.
- **Webhook repetido.** O id de cada evento fica gravado em `eventos_pagamento`, e o mesmo evento chegando de novo não muda nada. O status nunca é lido do corpo do webhook: ele sempre vem de uma consulta ao Asaas. Se essa consulta falhar, o evento não é gravado e o Asaas reenvia.
- **Débito.** O Asaas não aceita dados de débito pela API. O checkout cria a cobrança e manda o comprador para a página do Asaas.
- **CPF.** O banco guarda só um HMAC do CPF, para achar o cliente do Asaas de novo sem guardar o número.
- **Apple Pay.** O Asaas não oferece.

## Modelo de dados

```mermaid
erDiagram
    categorias ||--o{ produtos : agrupa
    produtos }o--o{ metodos_preparo : "metodo_produtos"
    clientes ||--o{ pedidos : faz
    pedidos ||--|{ itens_pedido : contem
    produtos ||--o{ itens_pedido : "vendido em"
    pedidos ||--|{ reservas : segura
    produtos ||--o{ reservas : "reservado em"
    pedidos ||--o{ pagamentos : "tentativas"
    pedidos ||--|{ historico_status : registra
    pagamentos ||--o{ eventos_pagamento : "id_externo"

    produtos {
        int id PK
        varchar slug UK
        int preco_centavos
        int estoque
        bool pagamento_real_liberado
    }
    clientes {
        int id PK
        char cpf_hash UK "HMAC do CPF"
        varchar asaas_customer_id
    }
    pedidos {
        char id PK "UUID"
        int cliente_id FK
        int total_centavos
        enum status
    }
    reservas {
        char pedido_id PK
        int produto_id PK
        datetime expira_em
        datetime liberada_em
    }
    pagamentos {
        char id PK "UUID"
        char pedido_id FK
        varchar id_externo UK "cobrança no Asaas"
        enum metodo "pix, credito, debito"
        enum status
        char pendente_de UK "gerada: pedido_id se pendente"
    }
    eventos_pagamento {
        varchar id_evento PK "id do evento do Asaas"
        varchar tipo
        varchar id_externo
    }
    historico_status {
        int id PK
        char pedido_id FK
        enum de
        enum para
        enum origem "criacao, consulta, webhook, admin, expiracao"
    }
```

O schema fica em `src/db/schema.ts`, e a migração gerada pelo Drizzle em `db/migrations/`. Valores em dinheiro são sempre centavos inteiros.

## Padrões de projeto

| Padrão | Onde |
|---|---|
| Adapter | `src/gateways/asaas.ts` traduz a API do Asaas para os termos da loja |
| Strategy | O serviço de pagamento recebe o gateway como parâmetro. Os testes usam `src/gateways/falso.ts` |
| Repository | `src/repositories/catalogo.ts` |
| State | `transicionar(atual, novo)` em `src/domain/status.ts` |
| Service | `src/services/pedidos.ts` e `src/services/pagamentos.ts` |

## Rodar na sua máquina

Precisa de Node 22 ou mais novo e de Docker. No Mac, o Docker funciona pelo Colima, sem o Docker Desktop. O `docker-compose.yml` sobe só o MySQL 8.4, na porta 3307, com usuário e senha `graoraro`.

```bash
npm install
cp .env.example .env.local      # preencha a chave do Asaas e os segredos
docker compose up -d            # MySQL na porta 3307
npm run db:migrate
npm run seed                    # catálogo e métodos de preparo
npm run dev                     # http://localhost:3000
```

Uma chave da API com `$` no `.env.local` precisa ser escrita como `\$`, porque o Next expande variáveis nesse arquivo.

| Variável | Para que serve |
|---|---|
| `DATABASE_URL` | Conexão com o MySQL. O padrão aponta para o container do `docker-compose.yml`. |
| `DATABASE_CA` | Certificado CA do Aiven, em PEM. Só em produção. |
| `ASAAS_API_KEY` | Chave da conta do Asaas. |
| `ASAAS_BASE_URL` | `https://api.asaas.com/v3` |
| `ASAAS_WEBHOOK_TOKEN` | Token que o Asaas manda no header `asaas-access-token` do webhook. |
| `ASAAS_WEBHOOK_EMAIL` | E-mail que o Asaas avisa se o webhook falhar. Usado pelo `npm run asaas:webhook`. |
| `ADMIN_PASSWORD` | Senha do painel `/admin`. |
| `SESSION_SECRET` | Assina o cookie do admin e o HMAC do CPF. |
| `CRON_SECRET` | O Cron da Vercel manda `Authorization: Bearer <CRON_SECRET>`. |
| `SITE_URL` | Endereço público, usado no retorno da fatura do débito. |
| `ALLOW_REAL_CHECKOUT_ALL` | `true` libera pagamento real do catálogo inteiro. Desligado por padrão. |

## API

| Onde | O quê |
|---|---|
| [`/docs`](https://grao-raro.sinovaz.com/docs) | Swagger UI, com "Try it out" |
| [`/api/openapi.json`](https://grao-raro.sinovaz.com/api/openapi.json) | Especificação OpenAPI 3.1 servida pelo app |
| [`docs/openapi.json`](docs/openapi.json) | A mesma especificação, exportada no repositório |
| [`postman/`](postman) | Coleção com 36 requisições e testes, e o ambiente local |

A especificação sai de `src/lib/openapi.ts`, que reaproveita os schemas Zod de `src/domain/schemas.ts`. Um teste confere que toda rota em `src/app/api` está documentada e que `docs/openapi.json` está em dia. Depois de mudar a API:

```bash
npm run openapi   # regrava docs/openapi.json, sem banco
npm run postman   # regrava a coleção e o ambiente do Postman
```

Rotas principais:

| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/produtos` | Catálogo, com filtro por `categoria`, `origem` e `processo` |
| GET | `/api/produtos/{slug}` | Produto e métodos de preparo |
| GET | `/api/metodos`, `/api/metodos/{slug}` | Métodos de preparo e o kit de cada um |
| POST | `/api/carrinho/cotacao` | Total do carrinho pelo preço do banco |
| POST | `/api/pedidos` | Cria o pedido e reserva o estoque. 409 se acabou. |
| GET | `/api/pedidos/{id}` | Pedido, itens e pagamento atual |
| POST | `/api/pedidos/{id}/pagamentos` | Pix, crédito ou débito no Asaas. Repetir devolve a mesma cobrança. |
| GET | `/api/pedidos/{id}/status` | Status, consultando o Asaas se ainda estiver pendente |
| POST | `/api/webhooks/asaas` | Eventos do Asaas, idempotente |
| GET | `/api/cron/expirar` | Expira reservas vencidas (Cron da Vercel) |
| GET, POST | `/api/admin/sessao` | Sessão do painel |
| GET | `/api/admin/pedidos` | Últimos 50 pedidos com histórico |
| POST | `/api/admin/pedidos/{id}/estorno` | Estorno pelo Asaas |

Erros sempre vêm como `{ "erro": "mensagem", "detalhes": ... }`. Em 400, `detalhes` traz cada campo inválido com a mensagem em português.

**Postman:** importe `postman/grao-raro.postman_collection.json` e `postman/local.postman_environment.json`, e rode a coleção inteira, na ordem. A requisição de Pix cria uma cobrança real que expira sozinha em 30 minutos. Para os testes de admin, preencha `adminSenha` no ambiente. Para o webhook idempotente, preencha `asaasWebhookToken` com o mesmo `ASAAS_WEBHOOK_TOKEN` do servidor. Sem essas variáveis, essas requisições são puladas.

## Testes

```bash
npm test              # Vitest: domínio, serviços, rotas, admin, OpenAPI e Asaas real
npm run test:postman  # coleção do Postman contra o servidor local, pelo Newman
npm run typecheck
npm run lint
```

Os testes usam um banco separado, `graoraro_teste`, para não mexer no estoque do banco de desenvolvimento. Crie esse banco uma vez:

```bash
docker compose exec mysql mysql -uroot -proot -e "CREATE DATABASE graoraro_teste; GRANT ALL ON graoraro_teste.* TO 'graoraro'@'%';"
DATABASE_URL=mysql://graoraro:graoraro@127.0.0.1:3307/graoraro_teste npm run db:migrate
DATABASE_URL=mysql://graoraro:graoraro@127.0.0.1:3307/graoraro_teste npm run seed
```

O teste do Asaas cria um cliente e uma cobrança Pix reais e apaga os dois no fim. Nada é cobrado.

## Estrutura

```
src/
  app/            páginas da loja, /admin, /docs e as rotas em app/api
  domain/         schemas Zod, máquina de estados, CPF, dinheiro
  services/       pedidos e pagamentos, com as transações
  gateways/       Asaas (real) e um gateway falso para os testes
  repositories/   leitura do catálogo
  db/             schema Drizzle, conexão e o catálogo do seed
  lib/            OpenAPI, sessão do admin, respostas HTTP
db/migrations/    SQL gerado pelo Drizzle
scripts/          seed, webhook do Asaas, teste do banco, Postman e OpenAPI
postman/          coleção e ambiente
docs/             especificação exportada, imagens e o plano do projeto
```

O plano original, com requisitos, decisões e riscos, está em [`docs/PLANO.md`](docs/PLANO.md).

## Produção

O site está em https://grao-raro.sinovaz.com, na Vercel, com o banco MySQL no Aiven.

1. Crie o MySQL no Aiven. Com a Service URI no `DATABASE_URL` (ela traz `ssl-mode=REQUIRED`), rode `npm run db:testar`, `npm run db:migrate` e `npm run seed`. O certificado CA do Aiven vai em `DATABASE_CA` para a conexão conferir o servidor.
2. Cadastre as variáveis do `.env.example` na Vercel, com `vercel env add`.
3. Faça o deploy e cadastre o domínio do site no Asaas, em Minha Conta, aba Informações. Sem isso, o Asaas recusa a URL de retorno do débito.
4. Crie o webhook: `npm run asaas:webhook -- https://seu-site.vercel.app`.

## Limitações

- O plano gratuito da Vercel roda o Cron uma vez por dia (`vercel.json`). Para compensar, a devolução de reservas vencidas também roda a cada pedido novo e a cada consulta de status.
- Os dados do cartão passam pelo servidor, só em memória, a caminho do Asaas. Uma loja de verdade usaria a tokenização do Asaas, que depende de liberação na conta.
- As fotos são do Unsplash, com crédito de cada uma na página do produto. Os preços são ilustrativos.
