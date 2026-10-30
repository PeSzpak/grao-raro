import { loadEnvConfig } from "@next/env";

// Cria ou atualiza o webhook de cobranças no Asaas. Uso: npm run asaas:webhook -- https://seu-site.vercel.app
loadEnvConfig(process.cwd(), true);

const EVENTOS = [
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  "PAYMENT_RESTORED",
  "PAYMENT_REFUNDED",
  "PAYMENT_REFUND_IN_PROGRESS",
  "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED",
  "PAYMENT_REPROVED_BY_RISK_ANALYSIS",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "PAYMENT_CHARGEBACK_DISPUTE",
  "PAYMENT_AWAITING_CHARGEBACK_REVERSAL",
];

async function main() {
  const site = process.argv[2];
  const { ASAAS_API_KEY: chave, ASAAS_WEBHOOK_TOKEN: token, ASAAS_WEBHOOK_EMAIL: email } = process.env;
  const base = process.env.ASAAS_BASE_URL ?? "https://api.asaas.com/v3";
  if (!site?.startsWith("https://")) throw new Error("Informe a URL pública do site, com https://");
  if (!chave || !token || !email) throw new Error("Defina ASAAS_API_KEY, ASAAS_WEBHOOK_TOKEN e ASAAS_WEBHOOK_EMAIL");

  const url = new URL("/api/webhooks/asaas", site).toString();
  const headers = { access_token: chave, "User-Agent": "grao-raro", "Content-Type": "application/json" };
  const corpo = { name: "Grão Raro", url, email, enabled: true, interrupted: false, authToken: token, sendType: "SEQUENTIALLY", events: EVENTOS };

  const lista = await (await fetch(`${base}/webhooks`, { headers })).json();
  const existente = (lista.data ?? []).find((w: { url: string }) => w.url === url);
  const resposta = await fetch(existente ? `${base}/webhooks/${existente.id}` : `${base}/webhooks`, {
    method: existente ? "PUT" : "POST",
    headers,
    body: JSON.stringify(corpo),
  });
  const resultado = await resposta.json();
  if (!resposta.ok) throw new Error(JSON.stringify(resultado.errors ?? resultado));
  console.log(`${existente ? "Atualizado" : "Criado"}: ${resultado.id} → ${url} (fila pausada: ${resultado.interrupted})`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
