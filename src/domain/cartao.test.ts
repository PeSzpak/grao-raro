import { describe, expect, it } from "vitest";
import { bandeira, luhnValido, maximoDeParcelas } from "./cartao";

describe("luhnValido", () => {
  it("aceita números de teste conhecidos e recusa um dígito trocado", () => {
    expect(luhnValido("4111 1111 1111 1111")).toBe(true);
    expect(luhnValido("5555555555554444")).toBe(true);
    expect(luhnValido("4111 1111 1111 1112")).toBe(false);
    expect(luhnValido("123")).toBe(false);
  });
});

describe("bandeira", () => {
  it.each([
    ["4111111111111111", "Visa"],
    ["5555555555554444", "Mastercard"],
    ["2223000048400011", "Mastercard"],
    ["378282246310005", "Amex"],
    ["6362970000457013", "Elo"],
    ["6062825624254001", "Hipercard"],
    ["9999", null],
  ])("%s é %s", (numero, esperada) => {
    expect(bandeira(numero)).toBe(esperada);
  });
});

describe("maximoDeParcelas", () => {
  it("respeita a parcela mínima de R$ 5 do Asaas e o limite da bandeira", () => {
    expect(maximoDeParcelas(500, "Visa")).toBe(1);
    expect(maximoDeParcelas(129000, "Visa")).toBe(21);
    expect(maximoDeParcelas(129000, "Elo")).toBe(12);
    expect(maximoDeParcelas(2400, null)).toBe(4);
  });
});
