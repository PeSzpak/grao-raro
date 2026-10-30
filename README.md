# Grão Raro

Loja de cafés raros com checkout real pelo Asaas. Trabalho da disciplina "Construção e Integração de APIs RESTful com Padrões de Projeto", Senac.

O comprador escolhe um café ou um equipamento e paga por Pix, cartão de crédito ou cartão de débito. A cobrança é criada na conta de produção do Asaas. O pedido muda de status sozinho, pelo webhook do Asaas ou por consulta direta à API dele.

Por ser um projeto acadêmico, só a "Amostra de degustação" (R$ 5,00) pode ser paga de verdade. Os outros produtos passam pelo checkout inteiro e param no pagamento. Todo valor recebido é estornado pelo painel `/admin`.

## Stack

| Camada | Escolha |
|---|---|
| Aplicação | Next.js 16 (App Router), React 19, TypeScript |
| Banco | MySQL 8.4 com Drizzle ORM. Docker no desenvolvimento, Railway em produção. |
| Validação | Zod 4, com as mensagens em português |
| Pagamento | API v3 do Asaas, em produção |
| Documentação da API | OpenAPI 3.1 gerado dos schemas Zod, Swagger UI em `/docs` |
| Testes | Vitest contra o MySQL real e o Asaas real, coleção do Postman rodada pelo Newman |
| Hospedagem | Vercel |

## Como o pagamento funciona

```mermaid
sequenceDiagram
    participant C as Comprador
    participant A as API Grão Raro
    participant D as MySQL
    participant S as Asaas

    C->>A: POST /api/pedidos
    A->>D: baixa o estoque e reserva por 30 min (uma transação)
    A-->>C: 201, pedido pendente
    C->>A: POST /api/pedidos/{id}/pagamentos
    A->>D: trava o pedido e grava o pagamento pendente
    A->>S: POST /v3/payments (Pix, crédito ou débito)
    S-->>A: cobrança, QR Code ou resultado do cartão
    A-->>C: 201, QR Code / aprovado / link da fatura
    S->>A: POST /api/webhooks/asaas (token no header)
    A->>S: GET /v3/payments/{id}, o status vem daqui
    A->>D: aplica a transição na máquina de estados
    C->>A: GET /api/pedidos/{id}/status a cada 3 s
```

Algumas decisões que valem a explicação:

- **Estoque sem Redis.** A baixa é um `UPDATE ... WHERE estoque >= ?` dentro da transação do pedido. Dez compras simultâneas da última unidade criam um pedido só e devolvem nove respostas 409. O teste fica em `src/services/pedidos.test.ts`.
- **Clique duplo no "Pagar".** A linha do pedido fica travada (`SELECT ... FOR UPDATE`) durante a chamada ao Asaas. Uma coluna gerada com índice único impede dois pagamentos pendentes no mesmo pedido.
- **Resposta perdida na rede.** O pagamento é gravado antes da chamada. Uma nova tentativa procura a cobrança pela `externalReference` antes de criar outra.
- **Webhook repetido.** O id de cada evento fica gravado, e o mesmo evento chegando de novo não muda nada. O status nunca é lido do corpo do webhook: ele sempre vem de uma consulta ao Asaas.
- **Máquina de estados.** O pedido só sai de `pendente` para `aprovado`, `expirado`, `cancelado` ou `recusado`. De `aprovado`, só sai para `estornado` ou `contestado`. A regra fica em `src/domain/status.ts`.
- **Débito.** O Asaas não aceita dados de débito pela API. O checkout cria a cobrança e manda o comprador para a página do Asaas.
- **Apple Pay.** O Asaas não oferece.

## Padrões de projeto

| Padrão | Onde |
|---|---|
| Adapter | `src/gateways/asaas.ts` traduz a API do Asaas para os termos da loja |
| Strategy | O serviço de pagamento recebe o gateway como parâmetro. Os testes usam `src/gateways/falso.ts` |
| Repository | `src/repositories/catalogo.ts` |
| State | `transicionar(atual, novo)` em `src/domain/status.ts` |
| Service | `src/services/pedidos.ts` e `src/services/pagamentos.ts` |

## Rodar na sua máquina

Precisa de Node 22 ou mais novo e de Docker. No Mac, o Docker funciona pelo Colima, sem o Docker Desktop.

```bash
npm install
cp .env.example .env.local      # preencha a chave do Asaas e os segredos
docker compose up -d            # MySQL na porta 3307
npm run db:migrate
npm run seed
npm run dev                     # http://localhost:3000
```

Uma chave da API com `$` no `.env.local` precisa ser escrita como `\$`, porque o Next expande variáveis nesse arquivo.

## Testes

```bash
npm test              # Vitest: domínio, serviços, rotas, admin e Asaas real
npm run test:postman  # coleção do Postman contra o servidor local
```

Os testes usam um banco separado, `graoraro_teste`, para não mexer no estoque do banco de desenvolvimento. Crie esse banco uma vez:

```bash
docker compose exec mysql mysql -uroot -proot -e "CREATE DATABASE graoraro_teste; GRANT ALL ON graoraro_teste.* TO 'graoraro'@'%';"
DATABASE_URL=mysql://graoraro:graoraro@127.0.0.1:3307/graoraro_teste npm run db:migrate
DATABASE_URL=mysql://graoraro:graoraro@127.0.0.1:3307/graoraro_teste npm run seed
```

O teste do Asaas cria um cliente e uma cobrança Pix reais e apaga os dois no fim. Nada é cobrado.

## API

- Swagger: `/docs`
- Especificação: `/api/openapi.json`
- Postman: importe `postman/grao-raro.postman_collection.json` e `postman/local.postman_environment.json`. Para testar o admin, preencha `adminSenha` no ambiente. O script `npm run postman` gera a coleção de novo.

## Produção

1. Crie o MySQL no Railway e rode `npm run db:migrate` e `npm run seed` apontando o `DATABASE_URL` para ele.
2. Cadastre as variáveis do `.env.example` na Vercel, com `vercel env add`.
3. Faça o deploy e cadastre o domínio do site no Asaas, em Minha Conta, aba Informações. Sem isso, o Asaas recusa a URL de retorno do débito.
4. Crie o webhook: `npm run asaas:webhook -- https://seu-site.vercel.app`.

## Limitações

- O plano gratuito da Vercel roda o Cron uma vez por dia. Para compensar, a devolução de reservas vencidas também roda a cada pedido novo e a cada consulta de status.
- Os dados do cartão passam pelo servidor, só em memória, a caminho do Asaas. Uma loja de verdade usaria a tokenização do Asaas, que depende de liberação na conta.
- As fotos são do Unsplash, com crédito de cada uma na página do produto. Os preços são ilustrativos.
