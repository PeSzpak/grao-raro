# Plano: Grão Raro, e-commerce de cafés raros com pagamento real via Asaas

Projeto da disciplina "Construção e Integração de APIs RESTful com Padrões de Projeto" (Senac, Prof. Daniel Martins, Aula 06/07). O nome "Grão Raro" é provisório.

## 0. Critérios que mandam no projeto

1. **O checkout completo e funcionando é o principal critério de avaliação.** Todo o resto vem depois dele.
2. **Meios de pagamento.** Pix, cartão de crédito (à vista e parcelado) e cartão de débito, todos com dinheiro real.
3. **Material pronto pro professor.** Swagger e coleção do Postman com testes automáticos.
4. **Nenhuma cara de IA.** Vale pra interface, textos, imagens, código, README e commits (seção 15).

## 1. O que precisa ser entregue

Uma loja publicada em produção na Vercel. Ela vende os cafés mais caros e mais premiados do mundo, os equipamentos de preparo e o conteúdo de como preparar cada um.

- O pagamento é **real**, pela API de produção do Asaas, com Pix e cartão.
- A nossa API cria o cliente e a cobrança no Asaas.
- Ela descobre sozinha que a cobrança foi paga, por webhook e por consulta. A volta do navegador para a tela de sucesso nunca conta como prova.

Entregáveis da disciplina:
- código e instruções para rodar;
- diagrama da arquitetura e do fluxo;
- modelo lógico e script SQL;
- README com os endpoints;
- demonstração;
- relato das decisões, das limitações e dos testes.

## 2. Pagamento real: o que isso exige

| Exigência | Como o plano atende |
|---|---|
| **Conta Asaas de produção aprovada**, com documentos e dados bancários | Quem faz é você, no site do Asaas. Eu não crio contas nem preencho documentos. |
| **Chave Pix cadastrada na conta de produção** | Sem ela o Asaas não gera QR Code. Você cadastra no painel. |
| **Chave de API de produção nunca vista por ninguém** | Você cola direto na Vercel, com `vercel env add ASAAS_API_KEY production`. Ela não passa pelo chat nem pelo repositório. |
| **CPF do comprador** | O Asaas exige `name` e `cpfCnpj` pra criar o cliente (`CustomerSaveRequestDTO`). O checkout pede o CPF e valida os dígitos antes de enviar. |
| **Cartão de crédito no nosso próprio checkout** | O Asaas aceita os dados do cartão pela API (`POST /v3/payments` com `creditCard`, `creditCardHolderInfo` e `remoteIp`). Os dados passam pela nossa API só em memória, por HTTPS, e seguem direto pro Asaas. Nunca são gravados nem aparecem em log. |
| **Ninguém de fora pagar por um produto que não vai receber** | Veja a seção 3. |

**Teste com dinheiro de verdade.** O catálogo tem um produto real e barato, "Amostra de degustação", pra você pagar um valor pequeno. Depois do teste, o painel administrativo estorna o valor pela API (`POST /v3/payments/{id}/refund`).

O valor mínimo de cobrança e as tarifas do Asaas para Pix e cartão precisam ser conferidos na sua conta antes de definir o preço da amostra. Não confirmei se a tarifa volta no estorno.

**Ambiente: só produção.** A conta usada é a conta real do Asaas (`https://api.asaas.com/v3`), em todos os lugares: local, preview e produção. Não existe sandbox no projeto.

- **Criar uma cobrança não move dinheiro.** Os testes automatizados criam cliente, cobrança e QR Code reais e depois apagam a cobrança (`DELETE /v3/payments/{id}`). Nada é pago.
- **Clientes de teste não recebem nada.** Eles são criados com `notificationDisabled: true`, pra que o Asaas não mande e-mail nem SMS, que podem ter custo.
- **Pagamento confirmado só acontece pagando de verdade.** O Asaas não tem como simular uma confirmação em produção. O teste de "pagou e virou aprovado" é feito por você, com um Pix real da amostra, e termina com o estorno.
- **Cobranças de teste ficam identificáveis.** Toda cobrança criada fora da produção da Vercel leva `externalReference` com o prefixo `dev-`, e um script apaga as que ficarem pendentes.

## 3. Loja real com produtos raros: cuidado com quem compra

Os cafés do catálogo existem, mas a loja não tem estoque. Uma compra real de um estranho geraria uma obrigação de entrega.

**Proteções:**
- **Faixa fixa no topo:** "Projeto acadêmico do Senac. Os pedidos não são enviados."
- **Confirmação obrigatória no checkout:** "Entendo que este é um projeto acadêmico e que o valor será estornado."
- **Só a "Amostra de degustação" é paga de verdade.** Ela fica sempre disponível. Os demais produtos passam pelo fluxo completo, mas o pagamento real só é liberado se `ALLOW_REAL_CHECKOUT_ALL=true`. Esse valor fica desligado por padrão.
- **Painel administrativo protegido por senha**, com a lista de pedidos e o botão de estorno.

Se você quiser vender os cafés caros de verdade, basta ligar a variável. Mas aí entram nota fiscal, frete e o Código de Defesa do Consumidor, e isso sai do escopo do projeto.

## 3.1 Meios de pagamento: o que o Asaas permite

Verifiquei na referência oficial, pelo conector MCP.

| Meio | Onde o comprador paga | Como |
|---|---|---|
| **Pix** | No nosso checkout | Cobrança `PIX`. QR Code e copia e cola vêm de `GET /v3/payments/{id}/pixQrCode`. |
| **Crédito à vista e parcelado** | No nosso checkout | Cobrança `CREDIT_CARD` com os dados do cartão, do titular e o IP do comprador. Até 21 parcelas para Visa e Mastercard e até 12 para as demais bandeiras. A aprovação vem na própria resposta. |
| **Débito** | Na fatura do Asaas | A documentação diz que os dados de débito "não podem ser enviados diretamente pela API". O nosso checkout cria a cobrança e abre a `invoiceUrl`. O comprador paga no débito e volta pela `callback.successUrl`. O status chega pelo webhook. |
| **Apple Pay** | **Não disponível** | A busca por "Apple Pay" na documentação e na referência do Asaas não retorna nada. Não existe endpoint nem tipo de cobrança pra isso. Fica de fora e entra no relato como limitação do provedor. |

**O formulário do cartão:**
- detecta a bandeira pelo número e valida pelo algoritmo de Luhn;
- formata número, validade e CVV enquanto o comprador digita;
- mostra as parcelas com o valor de cada uma.

Uma recusa mostra o motivo devolvido pelo Asaas, sem apagar o que o comprador digitou.

## 4. Fluxo do pagamento no Asaas

```
1. POST /api/pedidos               total calculado no banco, pedido "pendente"
2. POST /api/pedidos/:id/pagamentos
     ├─ POST /v3/customers         {name, cpfCnpj, email}, reaproveita o cliente pelo CPF
     ├─ POST /v3/payments          {customer, billingType: PIX | CREDIT_CARD, value, dueDate,
     │                              externalReference: <id do nosso pagamento>,
     │                              callback: {successUrl: /pedido/:id, autoRedirect: true}}
     ├─ PIX     → GET /v3/payments/{id}/pixQrCode   → {encodedImage, payload, expirationDate}
     ├─ CRÉDITO → mesma chamada com creditCard + creditCardHolderInfo + remoteIp
     │            (+ installmentCount/installmentValue se parcelado). Aprovado ou recusado na resposta.
     └─ DÉBITO  → billingType CREDIT_CARD sem dados de cartão → abre a invoiceUrl → volta pela successUrl
3. Asaas → POST /api/webhooks/asaas
     header asaas-access-token == ASAAS_WEBHOOK_TOKEN   senão 401
     grava eventos_pagamento (UNIQUE no id do evento)   duplicata → 200 e nada muda
     GET /v3/payments/{id}  → status real               nunca confia no corpo
     aplica a transição e responde 200
4. Tela /pedido/:id consulta GET /api/pedidos/:id/status a cada 3 s
   (se ainda estiver pendente, esse endpoint também consulta o Asaas, servindo de reserva do webhook)
```

**Idempotência na criação.** Não encontrei header de idempotência no `POST /v3/payments`. Antes de criar uma cobrança, a API procura no banco um pagamento `pendente` do mesmo pedido e o reaproveita. O `externalReference` permite localizar no Asaas uma cobrança criada logo antes de uma falha de rede.

**Tradução de status** (enum `PaymentGetResponsePaymentStatus`):

| Status no Asaas | Status interno |
|---|---|
| `PENDING`, `AWAITING_RISK_ANALYSIS` | `pendente` |
| `RECEIVED`, `CONFIRMED`, `RECEIVED_IN_CASH` | `aprovado` |
| `OVERDUE` | `expirado` |
| `REFUNDED`, `REFUND_REQUESTED`, `REFUND_IN_PROGRESS` | `estornado` |
| `CHARGEBACK_*`, `DUNNING_*` | `contestado` |
| Cobrança removida (`deleted: true`) | `cancelado` |

**Máquina de estados:**
- de `pendente` o pedido vai pra `aprovado`, `expirado` ou `cancelado`;
- de `aprovado` ele vai pra `estornado` ou `contestado`;
- qualquer outra transição é ignorada e registrada;
- a mesma transição chegando duas vezes não grava nada.

**Webhook de produção.** É criado uma vez pela API (`POST /v3/webhooks`) por um script versionado, `npm run asaas:webhook`. Os campos obrigatórios são `name`, `url`, `email`, `enabled`, `interrupted`, `events` e `sendType`, mais o `authToken`. O script se repete sem duplicar: se já existir um webhook com a mesma URL, ele atualiza esse.

Se o nosso endpoint falhar 15 vezes seguidas, o Asaas pausa a fila. Por isso o webhook responde 200 assim que grava o evento. O `/api/health` também mostra se a fila está pausada.

## 5. Stack

| Camada | Escolha |
|---|---|
| Framework | **Next.js** (App Router) com TypeScript estrito, na Vercel. As rotas `app/api/**/route.ts` são a API REST própria. |
| Interface | **Tailwind CSS**, **shadcn/ui** (Radix), **Motion**, **Lucide** e `next/font` |
| Formulários e validação | **React Hook Form** e **Zod**. O mesmo schema vale no navegador e na API. |
| Estado | **Zustand** com `persist` pro carrinho e **TanStack Query** pro status ao vivo |
| Banco | **MySQL 8** com **Drizzle ORM** (`mysql2`). Docker localmente, MySQL gerenciado em produção (seção 6). |
| Pagamento | `fetch` direto na API REST do Asaas, num cliente tipado com Zod. Nenhum SDK de terceiros. |
| Conteúdo | Guias de preparo em **MDX**, com receitas estruturadas: proporção, moagem, temperatura e tempo. |
| Documentação da API | **OpenAPI 3.1 gerado dos próprios schemas Zod** (`@asteasolutions/zod-to-openapi`) e servido em `/api/openapi.json`. A **Swagger UI** fica em `/docs`. Como a documentação sai do mesmo schema que valida as requisições, ela não fica desatualizada. |
| Testes | **Vitest**, com integração contra o MySQL do Docker e contra a conta real do Asaas. **Playwright** pro fluxo completo. Mais a coleção do **Postman**. |
| CI e deploy | GitHub Actions (lint, tipos e testes) e Vercel (preview por PR, produção no merge na `main`) |
| Observabilidade | Vercel Analytics, Speed Insights e logs JSON sem dados pessoais |

## 6. Banco

| Ambiente | Banco |
|---|---|
| Local e CI | `mysql:8.4` no `docker compose` (localmente) e como serviço no GitHub Actions |
| Produção | MySQL gerenciado: **Railway**, que roda a imagem Docker oficial, ou **Aiven**, que tem plano gratuito |

Os valores ficam em centavos, `INT`. O schema fica em `src/db/schema.ts`, e as migrations geradas pelo Drizzle são o script SQL entregue.

```sql
categorias        (id, slug, nome)                           -- cafes, equipamentos, acessorios
produtos          (id, slug UNIQUE, categoria_id, nome, subtitulo, descricao, origem, produtor,
                   processo, altitude_m, notas_sensoriais JSON, imagem, preco_centavos,
                   pagamento_real_liberado BOOL, estoque INT UNSIGNED, ativo)
reservas          (pedido_id, produto_id, quantidade, expira_em, liberada_em NULL)
metodos_preparo   (id, slug, nome, resumo, dificuldade, tempo_min, proporcao, moagem,
                   temperatura_c)                            -- o texto longo fica em MDX
metodo_produtos   (metodo_id, produto_id)                    -- "o que você precisa" pra cada método
clientes          (id, cpf_hash UNIQUE, asaas_customer_id, criado_em)   -- não guarda o CPF em claro
pedidos           (id UUID, cliente_id, nome, email, total_centavos, status, criado_em, atualizado_em)
itens_pedido      (pedido_id, produto_id, quantidade, preco_unitario_centavos)
pagamentos        (id UUID, pedido_id, provedor, id_externo UNIQUE, metodo, status,
                   pix_payload TEXT, pix_imagem MEDIUMTEXT, invoice_url, expira_em, criado_em)
eventos_pagamento (id_evento UNIQUE, provedor, tipo, payload_sanitizado JSON, recebido_em)
historico_status  (pedido_id, de, para, origem, em)
```

## 6.1 Estoque e pagamento duplicado, sem Redis

**Estoque esgotado.** O estoque é baixado dentro da mesma transação que cria o pedido:

```sql
UPDATE produtos SET estoque = estoque - ? WHERE id = ? AND estoque >= ?
```

Se a atualização afetar 0 linhas, o item acabou. A transação inteira volta, e a API responde **409** com o item que faltou.

- **Disputa pela última unidade.** O MySQL trava a linha durante o `UPDATE`. Se duas pessoas tentarem comprar a última unidade ao mesmo tempo, uma leva e a outra recebe o 409.
- **Reserva com prazo.** O pedido guarda uma reserva que expira junto com o Pix, em 30 minutos.
- **Devolução ao estoque.** A reserva volta ao estoque quando:
  - o webhook avisa `OVERDUE` ou cobrança removida;
  - o cartão é recusado;
  - um Vercel Cron, a cada 10 minutos, encontra uma reserva vencida.

  A devolução marca `liberada_em`, então nunca devolve duas vezes.
- **Teste.** Dez pedidos simultâneos pela última unidade resultam em exatamente um pedido criado e nove 409.

**Pagamento duplicado.** Três travas no banco:

| Situação | Trava |
|---|---|
| Dois cliques em "Pagar" | Uma coluna gerada `pendente_de = IF(status='pendente', pedido_id, NULL)` com `UNIQUE`, porque o MySQL não tem índice parcial. Um pedido não pode ter duas cobranças pendentes. O segundo clique recebe a mesma cobrança. |
| Webhook repetido | `UNIQUE (id_evento)` em `eventos_pagamento` |
| Pedido já pago | A máquina de estados não sai de `aprovado` |

**Por que não usar Redis.** O Redis seria uma segunda fonte de verdade pro estoque. Ela teria que ser sincronizada com o MySQL, e qualquer falha entre os dois vende um item que não existe. As travas do MySQL resolvem os dois problemas numa transação só, que é o que a banca vai querer ver.

O Redis só valeria a pena com milhares de compras simultâneas no mesmo item, como em pré-venda de ingresso. Não é o caso de uma loja de cafés raros.

## 7. Catálogo e conteúdo

**Cafés.** Cada café tem origem, produtor, processo, altitude, notas sensoriais e o método recomendado.
- Geisha da Hacienda La Esmeralda, do Panamá;
- Jamaica Blue Mountain;
- Kona Extra Fancy, do Havaí;
- Santa Helena;
- Black Ivory Coffee, da Tailândia;
- Yirgacheffe e Gesha da Etiópia;
- vencedores brasileiros do Cup of Excellence.

**Kopi Luwak fica fora.** A produção comercial dele é associada a maus-tratos de civetas, e isso pesaria contra a marca.

**Equipamentos e acessórios:**
- Hario V60, Chemex, Kalita Wave, AeroPress, prensa francesa, moka, sifão e Clever;
- moedor manual premium;
- chaleira de bico de ganso;
- balança com timer;
- filtros;
- xícaras.

**Métodos de preparo.** São 8 guias, um para cada método: V60, Chemex, AeroPress, prensa francesa, moka, espresso, cold brew e sifão. Cada guia tem:
- a receita em números;
- os passos ilustrados;
- os erros comuns;
- a lista "o que você precisa", que liga aos produtos e adiciona tudo ao carrinho com um clique.

**Fotos.** Vêm do Unsplash, que permite uso livre, com o crédito no rodapé de cada página. Os preços são inspirados nos de mercado e marcados como ilustrativos.

## 8. Telas

| Rota | Conteúdo |
|---|---|
| `/` | Hero editorial, cafés em destaque, faixa de métodos e equipamentos |
| `/cafes` | Grade com filtro por origem, processo e faixa de preço |
| `/equipamentos` | Grade de equipamentos e acessórios |
| `/produto/[slug]` | Foto grande, ficha técnica, notas sensoriais, quantidade, métodos recomendados |
| `/metodos` e `/metodos/[slug]` | Guias de preparo com o kit do método |
| Carrinho | Gaveta lateral com o total vindo da API |
| `/checkout` | Três etapas, com o resumo do pedido fixo ao lado: <br>**1. Seus dados.** Nome, e-mail, CPF, telefone, CEP com endereço preenchido pelo ViaCEP, e número. Máscaras e validação na hora. <br>**2. Pagamento.** Abas Pix, Crédito e Débito. O crédito tem o cartão desenhado que vira pra mostrar o CVV e o seletor de parcelas. <br>**3. Confirmação.** Revisão e o botão "Pagar R$ X". <br>Navegação só por teclado, erros anunciados ao leitor de tela, nada se perde ao voltar uma etapa. |
| `/pedido/[id]` | QR Code, botão de copiar, contagem regressiva e status ao vivo, que vira "Pagamento aprovado" sozinho |
| `/admin` | Pedidos, pagamentos, histórico de status e botão de estorno. Protegido por senha com cookie assinado. |

**Direção visual.** Estética de loja de luxo editorial:
- fundo creme e tinta escura;
- uma serifada nos títulos;
- fotos grandes e bastante espaço.

Funciona no celular primeiro, tem tema escuro e cumpre contraste AA. A meta é Lighthouse acima de 90 na vitrine. Na fase de interface entram as skills `design-taste-frontend`, `frontend-design` e `web-design-guidelines`.

## 9. Endpoints

| Método | Rota | Faz |
|---|---|---|
| GET | `/api/produtos` | Lista com filtros `categoria`, `origem` e `processo` |
| GET | `/api/produtos/:slug` | Detalhe do produto |
| GET | `/api/metodos`, `/api/metodos/:slug` | Métodos de preparo e o kit de cada um |
| POST | `/api/carrinho/cotacao` | `{itens}` → subtotal e total calculados no banco |
| POST | `/api/pedidos` | `{nome, email, cpf, itens}` → pedido com total do banco. Qualquer preço enviado é ignorado. |
| GET | `/api/pedidos/:id` | Pedido, itens e pagamento atual |
| POST | `/api/pedidos/:id/pagamentos` | `{metodo: "pix"}`, `{metodo: "credito", parcelas, cartao, titular}` ou `{metodo: "debito"}`. Devolve o QR Code, o resultado do cartão ou a `invoiceUrl`. |
| GET | `/api/pedidos/:id/status` | Status atual. Consulta o Asaas se ainda estiver pendente. |
| POST | `/api/webhooks/asaas` | Valida o token, grava o evento de forma idempotente, consulta o Asaas e aplica a transição |
| POST | `/api/admin/pedidos/:id/estorno` | Estorna pelo Asaas. Só com sessão de admin. |
| GET | `/api/openapi.json` | Especificação OpenAPI 3.1 |
| GET | `/docs` | Swagger UI, com "Try it out" apontando pra produção |
| GET | `/api/health` | Banco e conta real do Asaas respondendo |

## 10. Arquitetura e padrões

```
src/
  app/            páginas e rotas da API (finas, só HTTP)
  domain/         tipos, schemas Zod, máquina de estados, validação de CPF, dinheiro em centavos
  services/       PedidoService, PagamentoService (criar, sincronizar, estornar)
  repositories/   SQL via Drizzle
  gateways/       PaymentGateway (interface), AsaasGateway, FakeGateway, factory
  db/             schema, pool com attachDatabasePool, migrations, seed
  content/        guias de preparo em MDX
  components/     UI
```

| Padrão | Onde |
|---|---|
| **Strategy / Adapter** | `PaymentGateway` com `criarCobranca`, `consultar`, `estornar` e `validarWebhook`. O `AsaasGateway` é o real. O `FakeGateway` serve aos testes de falha e ao plano B. |
| **Factory** | `gatewayPara(env)` escolhe a implementação e a URL base a partir da chave |
| **Repository** | Um por agregado: produtos, pedidos, pagamentos e eventos |
| **State** | `transicionar(atual, novo)`, uma função pura testada por tabela |

## 11. Segurança

- **Segredos.** `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `DATABASE_URL`, `ADMIN_PASSWORD` e `SESSION_SECRET` ficam nas variáveis da Vercel por ambiente e no `.env.local`, que está no `.gitignore` desde o primeiro commit. O repositório só leva o `.env.example`.
- **Webhook.** O token chega no header `asaas-access-token` e é comparado com `timingSafeEqual`. O corpo nunca é usado como verdade.
- **CPF.**
  - Validado nos dígitos verificadores.
  - Enviado ao Asaas uma vez.
  - Guardado no banco só como hash, pra reaproveitar o cliente.
  - Os logs mostram só os 3 últimos dígitos.
- **Chamadas ao Asaas.**
  - Timeout de 10 segundos.
  - Erros de rede, 5xx e 429 viram "tente de novo", e o pedido fica `pendente`.
  - A nova tentativa reaproveita a cobrança que já existe.
  - Toda resposta é validada com Zod.
- **Abuso.** Rate limit no Vercel Firewall pra criação de pedido, de pagamento e pro login do admin.
- **Cabeçalhos.** CSP, HSTS e `X-Content-Type-Options` configurados no `next.config`.

## 12. Testes, todos rodando de verdade

| Nível | O que roda | Contra o quê |
|---|---|---|
| Unidade | Máquina de estados, tradução de status, CPF, cálculo de total, validação do token | Código puro |
| Integração da API | Rotas com o banco real: preço adulterado ignorado, quantidade inválida volta 400, webhook duplicado não duplica, token errado volta 401 | MySQL do Docker e `FakeGateway` |
| Integração Asaas | Cria cliente (sem notificação), cria cobrança Pix, busca o QR Code real, consulta o status e apaga a cobrança | **Asaas real** |
| Webhook | Uma requisição com o token certo e um evento real gravado vira transição. Token errado dá 401, duplicata não muda nada. | Preview da Vercel, com URL pública |
| Falhas | Timeout, 429, 5xx e resposta inválida | `FakeGateway` configurado pra falhar |
| Ponta a ponta | Playwright do catálogo até a tela com o QR Code real, no navegador | Deploy de preview com o Asaas real |
| Pagamento real | Você paga a amostra com Pix real. O pedido vira aprovado pelo webhook, e o estorno pelo admin devolve o valor. Repetido com cartão. | **Asaas real** |

O webhook precisa de URL pública. Por isso o teste dele roda contra o deploy da Vercel, e não na máquina local.

## 12.1 Material para o professor

- **Swagger.** Fica em `https://<domínio>/docs`. Cada endpoint tem exemplos de requisição e de resposta, inclusive os de erro (400, 401, 404, 409, 502), e o "Try it out" funciona contra produção.
- **Postman.** Os arquivos ficam em `postman/`:
  - `GraoRaro.postman_collection.json`, com pastas na ordem do fluxo: Catálogo, Carrinho, Pedido, Pagamento Pix, Webhook (segurança), Erros;
  - `GraoRaro-producao.postman_environment.json`, com a URL de produção.

  Cada requisição tem testes `pm.test`: status esperado, formato da resposta e regra de negócio. Por exemplo, "total ignora o preço enviado", "webhook com token errado responde 401" e "evento repetido não duplica". As variáveis passam de uma requisição pra outra (`pedidoId`, `pagamentoId`), então o professor roda tudo com "Run collection".
- **Testes da coleção não cobram ninguém.** Eles geram um Pix real e param ali, sem pagar. O pedido de teste é marcado com `dev-` e apagado pelo próprio fim da coleção.
- **CI.** A coleção roda no GitHub Actions com **Newman** contra o preview, então ela nunca é entregue quebrada.

## 13. Fases

| # | Fase | Pronto quando |
|---|---|---|
| 0 | **Base.** Repositório, Next.js, Docker local, banco de produção, projeto na Vercel com domínio, variáveis por ambiente e CI. | `/api/health` em produção mostra o banco conectado e a conta real do Asaas respondendo. |
| 1 | **Catálogo e conteúdo.** Schema, seed com cafés, equipamentos e métodos, fotos, vitrine, páginas de produto e guias. | A vitrine em produção mostra os produtos do MySQL, e cada guia liga ao seu kit. |
| 2 | **Carrinho e pedido.** Gaveta, cotação, checkout com CPF, `POST /api/pedidos`. | Os testes de preço adulterado, CPF inválido e quantidade inválida passam. |
| 3 | **Asaas Pix.** Gateway, cliente, cobrança, QR Code e tela do pedido. | O teste de integração contra o Asaas real passa, e um QR Code real aparece no preview. |
| 4 | **Status confiável.** Webhook com token, idempotência, consulta de reserva, máquina de estados e script do webhook. | Um Pix real seu vira "aprovado" sozinho pelo webhook. Reenviar o evento não duplica, token errado dá 401, e sem webhook a consulta resolve. |
| 5 | **Crédito e débito.** Formulário do cartão com parcelas no nosso checkout. Débito pela `invoiceUrl` com volta pela `successUrl`. | Um crédito real seu aprova na hora. Um débito real seu volta pro site e vira aprovado pelo webhook. Um cartão recusado mostra o motivo sem perder o formulário. |
| 5.1 | **Swagger e Postman.** OpenAPI dos schemas Zod, `/docs`, coleção com testes e environment, Newman no CI. | "Run collection" passa inteiro contra produção, e `/docs` mostra todos os endpoints com exemplos. |
| 6 | **Admin e estorno.** | O estorno do seu pagamento real leva o pedido a `estornado`, e o valor volta. |
| 7 | **Acabamento e falhas.** Visual, animações, tema escuro, acessibilidade, testes de falha, Playwright no CI. | Lighthouse acima de 90, checkout só com teclado, CI verde. |
| 8 | **Fechamento em produção.** Webhook de produção criado pelo script, faixa acadêmica, script de limpeza das cobranças `dev-`, ensaio com dinheiro real e estorno. | Um Pix real seu aparece como aprovado e depois como estornado, e o valor volta pra sua conta. |
| 9 | **Entrega.** README, diagrama em Mermaid, script SQL, relato e roteiro da apresentação. | Alguém de fora clona, sobe com Docker e gera um QR Code real seguindo o README. |

## 14. Roteiro da apresentação

1. Vitrine e um guia de preparo, com "adicionar kit ao carrinho".
2. Checkout com Pix real da amostra, pago no celular ao vivo. A tela vira "aprovado" pelo webhook.
3. O admin mostra o histórico (criação, depois webhook) e faz o estorno na frente da turma.
4. No Postman:
   - reenviar o webhook e mostrar que não duplica;
   - mandar um token falso e mostrar o 401;
   - mandar um preço adulterado e mostrar que o total não muda.

**Plano B.** Se o Asaas estiver fora do ar, uma variável troca pro `FakeGateway`.

## 15. Sem cara de IA

**Interface:**
- Nada de gradiente roxo e azul, glassmorphism genérico, emoji em botão ou título, ícone de faísca ou cards todos iguais em grade de três.
- A direção é editorial: fotos reais grandes, tipografia serifada nos títulos, grid assimétrico, preço e ficha técnica com cara de rótulo de café especial.
- Cada tela passa pela revisão das skills `design-taste-frontend` e `web-design-guidelines` antes de entrar.

**Textos:**
- Escritos como uma torrefação escreveria. Sem "eleve sua experiência", "descubra o mundo de", "jornada" ou frases com três adjetivos.
- As descrições dos cafés usam fatos: fazenda, altitude, variedade, processo, notas da xícara.
- A skill `copywriting` revisa tudo, porque ela proíbe exatamente esses vícios.

**Imagens.** Fotos reais do Unsplash, com crédito. Nenhuma imagem gerada por IA.

**Código e repositório:**
- Comentários só onde o porquê não é óbvio.
- Nomes em português no domínio (`pedido`, `pagamento`), como a disciplina usa.
- README direto, sem emoji, no formato de projeto de equipe.
- Commits pequenos, com mensagens normais e sem nenhuma assinatura de ferramenta.

## 16. Riscos e pendências

- **Aprovação da conta de produção do Asaas pode demorar.** Precisa começar já, porque é a dependência mais lenta do projeto.
- **Valor mínimo, tarifas e estorno da tarifa no Asaas.** Ainda não verifiquei. Conferir na conta antes de definir o preço da amostra.
- **Crédito transmitido pelo nosso servidor.** Mesmo sem gravar nada, passar o cartão pela nossa API coloca o projeto no escopo PCI de quem recebe dados de cartão. Para uma loja comercial, o caminho seria pagar na fatura do Asaas ou pedir a tokenização. Fica registrado no relato.
- **Apple Pay.** Não existe no Asaas. Só entraria trocando de provedor.
- **Chave Pix na conta real.** Sem ela o Asaas não gera QR Code. Precisa estar cadastrada antes da fase 3.
- **Custo de cobranças criadas e apagadas nos testes.** Conferir na conta se criar ou apagar cobrança tem tarifa. Pelo que li, a tarifa incide sobre o valor recebido, mas isso não está confirmado.
- **Conexões do MySQL esgotadas pelas funções da Vercel.** Mitigação: pool pequeno com `attachDatabasePool`.
