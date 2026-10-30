// Só a amostra é cobrada de verdade, a não ser que ALLOW_REAL_CHECKOUT_ALL libere o catálogo inteiro.
export function tudoLiberado() {
  return process.env.ALLOW_REAL_CHECKOUT_ALL === "true";
}

export function pagamentoReal(liberadoNoCatalogo: boolean) {
  return liberadoNoCatalogo || tudoLiberado();
}
