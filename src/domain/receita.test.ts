import { describe, expect, it } from "vitest";
import { cafePara, lerProporcao } from "./receita";

describe("lerProporcao", () => {
  it.each([
    ["15 g para 250 ml", { cafe: 15, liquido: 250, unidade: "ml" }],
    ["100 g para 1 l", { cafe: 100, liquido: 1000, unidade: "ml" }],
    ["18 g para 36 g de bebida", { cafe: 18, liquido: 36, unidade: "g" }],
  ])("%s", (texto, esperado) => {
    expect(lerProporcao(texto)).toMatchObject(esperado);
  });

  it("devolve null quando não entende", () => {
    expect(lerProporcao("a gosto")).toBeNull();
  });
});

describe("cafePara", () => {
  it("mantém a proporção do método", () => {
    expect(cafePara(500, 250 / 15)).toBe(30);
  });
});
