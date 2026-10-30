import { cacheLife } from "next/cache";
import imagens from "@/db/imagens.json";
import { buscarMetodo, buscarProduto, listarMetodos, listarProdutos, type FiltroProdutos } from "@/repositories/catalogo";

// O estoque mostrado pode atrasar alguns minutos; quem garante a baixa é a transação do pedido.
export async function produtosDaVitrine(filtro: FiltroProdutos = {}) {
  "use cache";
  cacheLife("minutes");
  return listarProdutos(filtro);
}

export async function produtoDaVitrine(slug: string) {
  "use cache";
  cacheLife("minutes");
  return buscarProduto(slug);
}

export async function metodosDaVitrine() {
  "use cache";
  cacheLife("hours");
  return listarMetodos();
}

export async function metodoDaVitrine(slug: string) {
  "use cache";
  cacheLife("minutes");
  return buscarMetodo(slug);
}

type Foto = { url: string; credito: string; pagina: string };
const fotos = imagens as Record<string, Foto>;

export function foto(chave: string) {
  return fotos[chave] ?? fotos.hero;
}

export function unsplash(url: string, largura: number, altura: number) {
  return `${url}?auto=format&fit=crop&w=${largura}&h=${altura}&q=75`;
}
