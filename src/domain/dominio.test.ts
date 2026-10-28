import { describe, expect, it } from "vitest";
import { cpfValido } from "./cpf";
import { centavosParaReais, formatarBRL } from "./dinheiro";
import { statusDoAsaas, transicionar, type StatusPedido } from "./status";

describe("transicionar", () => {
  const casos: [StatusPedido, StatusPedido, StatusPedido | null][] = [
    ["pendente", "aprovado", "aprovado"],
    ["pendente", "expirado", "expirado"],
    ["pendente", "pendente", null],
    ["aprovado", "aprovado", null],
    ["aprovado", "pendente", null],
    ["aprovado", "expirado", null],
    ["aprovado", "estornado", "estornado"],
    ["expirado", "aprovado", null],
    ["estornado", "aprovado", null],
  ];
  it.each(casos)("%s -> %s = %s", (de, para, esperado) => {
    expect(transicionar(de, para)).toBe(esperado);
  });
});

describe("statusDoAsaas", () => {
  it("traduz pagamento recebido e confirmado como aprovado", () => {
    expect(statusDoAsaas("RECEIVED")).toBe("aprovado");
    expect(statusDoAsaas("CONFIRMED")).toBe("aprovado");
  });
  it("cobrança removida vira cancelado", () => {
    expect(statusDoAsaas("PENDING", true)).toBe("cancelado");
  });
  it("recusa status desconhecido em vez de adivinhar", () => {
    expect(() => statusDoAsaas("QUALQUER")).toThrow();
  });
});

describe("cpfValido", () => {
  it("aceita CPF com dígitos corretos, com ou sem máscara", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("52998224725")).toBe(true);
  });
  it("recusa dígito verificador errado, repetidos e tamanho errado", () => {
    expect(cpfValido("529.982.247-24")).toBe(false);
    expect(cpfValido("111.111.111-11")).toBe(false);
    expect(cpfValido("1234")).toBe(false);
  });
});

describe("dinheiro", () => {
  it("converte centavos para o valor em reais do Asaas sem erro de ponto flutuante", () => {
    expect(centavosParaReais(129000)).toBe(1290);
    expect(centavosParaReais(1999)).toBe(19.99);
  });
  it("formata em reais", () => {
    expect(formatarBRL(129000).replace(/\s/g, " ")).toBe("R$ 1.290,00");
  });
});
