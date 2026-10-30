import { somenteDigitos } from "./cpf";

export function luhnValido(numero: string) {
  const digitos = somenteDigitos(numero);
  if (digitos.length < 13 || digitos.length > 19) return false;
  let soma = 0;
  for (let i = 0; i < digitos.length; i++) {
    let d = Number(digitos[digitos.length - 1 - i]);
    if (i % 2 === 1) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    soma += d;
  }
  return soma % 10 === 0;
}

export type Bandeira = "Visa" | "Mastercard" | "Elo" | "Amex" | "Hipercard";

// Elo e Hipercard antes: alguns prefixos deles começam com 4 e 5.
const PREFIXOS: [Bandeira, RegExp][] = [
  ["Elo", /^(4011(78|79)|43(1274|8935)|45(1416|7393|763[12])|50(4175|6699|67\d\d|90\d\d)|627780|63(6297|6368)|650\d\d\d|6516\d\d|6550\d\d)/],
  ["Hipercard", /^(606282|3841)/],
  ["Amex", /^3[47]/],
  ["Visa", /^4/],
  ["Mastercard", /^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/],
];

export function bandeira(numero: string): Bandeira | null {
  const digitos = somenteDigitos(numero);
  return PREFIXOS.find(([, regra]) => regra.test(digitos))?.[0] ?? null;
}

// shortcut: R$ 5 por parcela é o mínimo que assumimos para o Asaas; conferir na conta antes de vender parcelado.
const PARCELA_MINIMA_CENTAVOS = 500;

export function maximoDeParcelas(totalCentavos: number, marca: Bandeira | null) {
  const limiteDaBandeira = marca === "Visa" || marca === "Mastercard" ? 21 : 12;
  return Math.max(1, Math.min(limiteDaBandeira, Math.floor(totalCentavos / PARCELA_MINIMA_CENTAVOS)));
}
