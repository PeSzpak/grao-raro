"use client";

import Link from "next/link";
import { createContext, use, useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { formatarBRL } from "@/domain/dinheiro";

type Item = { slug: string; quantidade: number };
type Linha = { slug: string; nome: string; quantidade: number; precoCentavos: number; subtotalCentavos: number };
type Cotacao = { itens: Linha[]; totalCentavos: number };

type ContextoSacola = {
  itens: Item[];
  quantidadeTotal: number;
  adicionar: (slug: string, quantidade?: number) => void;
  definir: (slug: string, quantidade: number) => void;
  limpar: () => void;
  abrir: () => void;
};

const Contexto = createContext<ContextoSacola | null>(null);
const CHAVE = "grao-raro:sacola";
const MAXIMO_POR_ITEM = 10;

export function useSacola() {
  const contexto = use(Contexto);
  if (!contexto) throw new Error("useSacola fora de <Sacola>");
  return contexto;
}

export function useCotacao(itens: Item[]) {
  const [cotacao, setCotacao] = useState<Cotacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const chave = JSON.stringify(itens);

  useEffect(() => {
    const lista: Item[] = JSON.parse(chave);
    if (lista.length === 0) return;
    const controle = new AbortController();
    fetch("/api/carrinho/cotacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itens: lista }),
      signal: controle.signal,
    })
      .then(async (r) => {
        const corpo = await r.json();
        if (!r.ok) throw new Error(corpo.erro);
        setCotacao(corpo);
        setErro(null);
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setErro(e.message);
      });
    return () => controle.abort();
  }, [chave]);

  return itens.length === 0 ? { cotacao: null, erro: null } : { cotacao, erro };
}

// A sacola mora no localStorage; o cache evita um array novo a cada leitura do React.
const VAZIA: Item[] = [];
let cache: { bruto: string | null; itens: Item[] } = { bruto: null, itens: VAZIA };
const ouvintes = new Set<() => void>();

function ler(): Item[] {
  let bruto: string | null = null;
  try {
    bruto = localStorage.getItem(CHAVE);
  } catch {}
  if (bruto === cache.bruto) return cache.itens;
  let itens = VAZIA;
  try {
    const salvo = JSON.parse(bruto ?? "[]");
    if (Array.isArray(salvo)) itens = salvo.filter((i) => typeof i?.slug === "string" && i.quantidade > 0);
  } catch {}
  cache = { bruto, itens };
  return itens;
}

function gravar(itens: Item[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(itens));
  } catch {}
  ouvintes.forEach((avisar) => avisar());
}

function assinar(avisar: () => void) {
  ouvintes.add(avisar);
  window.addEventListener("storage", avisar);
  return () => {
    ouvintes.delete(avisar);
    window.removeEventListener("storage", avisar);
  };
}

export function Sacola({ children }: { children: ReactNode }) {
  const itens = useSyncExternalStore(assinar, ler, () => VAZIA);
  const [aberta, setAberta] = useState(false);

  const salvar = useCallback((atualizar: (atual: Item[]) => Item[]) => {
    gravar(atualizar(ler()).filter((i) => i.quantidade > 0));
  }, []);

  const valor = useMemo<ContextoSacola>(
    () => ({
      itens,
      quantidadeTotal: itens.reduce((t, i) => t + i.quantidade, 0),
      adicionar: (slug, quantidade = 1) => {
        salvar((atual) => {
          const existente = atual.find((i) => i.slug === slug);
          if (!existente) return [...atual, { slug, quantidade: Math.min(quantidade, MAXIMO_POR_ITEM) }];
          return atual.map((i) => (i.slug === slug ? { ...i, quantidade: Math.min(i.quantidade + quantidade, MAXIMO_POR_ITEM) } : i));
        });
        setAberta(true);
      },
      definir: (slug, quantidade) =>
        salvar((atual) => atual.map((i) => (i.slug === slug ? { ...i, quantidade: Math.min(quantidade, MAXIMO_POR_ITEM) } : i))),
      limpar: () => salvar(() => []),
      abrir: () => setAberta(true),
    }),
    [itens, salvar],
  );

  return (
    <Contexto value={valor}>
      {children}
      {aberta && <Gaveta fechar={() => setAberta(false)} />}
    </Contexto>
  );
}

function Gaveta({ fechar }: { fechar: () => void }) {
  const { itens, definir } = useSacola();
  const { cotacao, erro } = useCotacao(itens);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", tecla);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
    };
  }, [fechar]);

  return (
    <>
      <div className="sacola-fundo" onClick={fechar} aria-hidden />
      <aside className="sacola" role="dialog" aria-modal="true" aria-labelledby="titulo-sacola">
        <div className="sacola-topo">
          <h2 id="titulo-sacola" className="lead" style={{ fontWeight: 800 }}>
            Sacola
          </h2>
          <button className="link" onClick={fechar} autoFocus>
            Fechar
          </button>
        </div>

        {itens.length === 0 ? (
          <div className="sacola-itens">
            <p className="suave">A sacola está vazia. A amostra de degustação custa R$ 5,00 e é o jeito mais barato de conhecer a casa.</p>
            <Link className="link" href="/produto/amostra-degustacao" onClick={fechar}>
              Ver a amostra
            </Link>
          </div>
        ) : (
          <ul className="sacola-itens">
            {itens.map((item) => {
              const linha = cotacao?.itens.find((l) => l.slug === item.slug);
              return (
                <li key={item.slug} className="sacola-item">
                  <Link href={`/produto/${item.slug}`} onClick={fechar} style={{ fontWeight: 600 }}>
                    {linha?.nome ?? item.slug}
                  </Link>
                  <span style={{ fontWeight: 800 }}>{linha ? formatarBRL(linha.subtotalCentavos) : ""}</span>
                  <Quantidade valor={item.quantidade} mudar={(q) => definir(item.slug, q)} nome={linha?.nome ?? item.slug} />
                  <button className="link suave" onClick={() => definir(item.slug, 0)}>
                    Remover
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {itens.length > 0 && (
          <div className="sacola-base">
            {erro && <p className="aviso">{erro}</p>}
            <p className="total">
              <span>Total</span>
              <span aria-live="polite">{cotacao ? formatarBRL(cotacao.totalCentavos) : "calculando"}</span>
            </p>
            <Link className="botao" href="/checkout" onClick={fechar}>
              Ir para o pagamento
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

export function Quantidade({ valor, mudar, nome }: { valor: number; mudar: (q: number) => void; nome: string }) {
  return (
    <div className="quantidade" role="group" aria-label={`Quantidade de ${nome}`}>
      <button type="button" onClick={() => mudar(valor - 1)} aria-label="Menos um">
        −
      </button>
      <output aria-live="polite">{valor}</output>
      <button type="button" onClick={() => mudar(Math.min(valor + 1, MAXIMO_POR_ITEM))} aria-label="Mais um" disabled={valor >= MAXIMO_POR_ITEM}>
        +
      </button>
    </div>
  );
}

export function BotaoSacola() {
  const { quantidadeTotal, abrir } = useSacola();
  return (
    <button className="botao-sacola" onClick={abrir}>
      Sacola <span className="contador">{quantidadeTotal}</span>
    </button>
  );
}

export function Adicionar({ slug, quantidade = 1, texto = "Pôr na sacola", className = "botao" }: { slug: string; quantidade?: number; texto?: string; className?: string }) {
  const { adicionar } = useSacola();
  return (
    <button type="button" className={className} onClick={() => adicionar(slug, quantidade)}>
      {texto}
    </button>
  );
}

export function AdicionarKit({ slugs }: { slugs: string[] }) {
  const { adicionar } = useSacola();
  return (
    <button type="button" className="botao" onClick={() => slugs.forEach((s) => adicionar(s))}>
      Pôr o kit inteiro na sacola
    </button>
  );
}
