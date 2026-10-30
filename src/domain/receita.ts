// "15 g para 250 ml", "100 g para 1 l", "18 g para 36 g de bebida"
export function lerProporcao(texto: string) {
  const m = texto.match(/(\d+)\s*g\s+para\s+(\d+(?:[.,]\d+)?)\s*(ml|l|g)/i);
  if (!m) return null;
  const cafe = Number(m[1]);
  const liquido = Number(m[2].replace(",", ".")) * (m[3].toLowerCase() === "l" ? 1000 : 1);
  return { cafe, liquido, unidade: m[3].toLowerCase() === "g" ? "g" : "ml", razao: liquido / cafe };
}

export function cafePara(liquido: number, razao: number) {
  return Math.round((liquido / razao) * 10) / 10;
}
