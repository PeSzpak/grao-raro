const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarBRL(centavos: number) {
  return brl.format(centavos / 100);
}

// O Asaas recebe valores em reais com duas casas.
export function centavosParaReais(centavos: number) {
  return Math.round(centavos) / 100;
}

export function reaisParaCentavos(reais: number) {
  return Math.round(reais * 100);
}
