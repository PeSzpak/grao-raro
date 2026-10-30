"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { bandeira, luhnValido, maximoDeParcelas } from "@/domain/cartao";
import { cpfValido, somenteDigitos } from "@/domain/cpf";
import { formatarBRL } from "@/domain/dinheiro";
import { useCotacao, useSacola } from "./sacola";

type Metodo = "pix" | "credito" | "debito";
type Erros = Record<string, string>;

const ETAPAS = ["Seus dados", "Pagamento", "Confirmação"];

const mascara = {
  cpf: (v: string) =>
    somenteDigitos(v)
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2"),
  telefone: (v: string) =>
    somenteDigitos(v)
      .slice(0, 11)
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d)(\d{4})$/, "$1-$2"),
  cep: (v: string) => somenteDigitos(v).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2"),
  cartao: (v: string) => somenteDigitos(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 "),
  validade: (v: string) => somenteDigitos(v).slice(0, 4).replace(/(\d{2})(\d)/, "$1/$2"),
};

function Campo({
  id,
  rotulo,
  erro,
  className,
  children,
}: {
  id: string;
  rotulo: string;
  erro?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`campo ${className ?? ""}`}>
      <label htmlFor={id}>{rotulo}</label>
      {children}
      {erro && (
        <span id={`${id}-erro`} className="erro">
          {erro}
        </span>
      )}
    </div>
  );
}

export function Checkout() {
  const router = useRouter();
  const { itens, limpar } = useSacola();
  const { cotacao, erro: erroCotacao } = useCotacao(itens);
  const id = useId();
  const formulario = useRef<HTMLFormElement>(null);

  const [etapa, setEtapa] = useState(0);
  const [dados, setDados] = useState({ nome: "", email: "", cpf: "", telefone: "", cep: "", numero: "", aceite: false });
  const [endereco, setEndereco] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<Metodo>("pix");
  const [cartao, setCartao] = useState({ numero: "", nome: "", validade: "", cvv: "" });
  const [parcelas, setParcelas] = useState(1);
  const [virado, setVirado] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const [pedidoId, setPedidoId] = useState<string | null>(null);

  const total = cotacao?.totalCentavos ?? 0;
  const marca = bandeira(cartao.numero);
  const limiteParcelas = maximoDeParcelas(total, marca);
  const bloqueados = cotacao?.itens.filter((i) => !i.pagamentoRealLiberado) ?? [];

  const cep = somenteDigitos(dados.cep);
  useEffect(() => {
    if (cep.length !== 8) return;
    const controle = new AbortController();
    fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controle.signal })
      .then((r) => r.json())
      .then((r) => setEndereco(r.erro ? "CEP não encontrado" : `${r.logradouro}, ${r.bairro}, ${r.localidade} - ${r.uf}`))
      .catch(() => {});
    return () => controle.abort();
  }, [cep]);

  function validar(qual: number): Erros {
    const e: Erros = {};
    if (qual === 0) {
      if (dados.nome.trim().split(/\s+/).length < 2) e.nome = "Informe nome e sobrenome";
      if (!/^\S+@\S+\.\S+$/.test(dados.email)) e.email = "E-mail inválido";
      if (!cpfValido(dados.cpf)) e.cpf = "CPF inválido";
      if (somenteDigitos(dados.telefone).length < 10) e.telefone = "Telefone com DDD";
      if (cep.length !== 8) e.cep = "CEP com 8 dígitos";
      if (!dados.numero.trim()) e.numero = "Número do endereço";
      if (!dados.aceite) e.aceite = "Marque para continuar";
    }
    if (qual === 1 && metodo === "credito") {
      if (!luhnValido(cartao.numero)) e.numeroCartao = "Número do cartão inválido";
      if (cartao.nome.trim().length < 3) e.nomeCartao = "Nome como está no cartão";
      const [mes, ano] = cartao.validade.split("/").map(Number);
      const agora = new Date();
      const vencido = !mes || mes > 12 || !ano || 2000 + ano < agora.getFullYear() || (2000 + ano === agora.getFullYear() && mes < agora.getMonth() + 1);
      if (vencido) e.validade = "Validade inválida";
      if (!/^\d{3,4}$/.test(cartao.cvv)) e.cvv = "CVV com 3 ou 4 dígitos";
    }
    return e;
  }

  function avancar() {
    const e = validar(etapa);
    setErros(e);
    if (Object.keys(e).length > 0) {
      requestAnimationFrame(() => formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setEtapa(etapa + 1);
  }

  async function pagar() {
    setEnviando(true);
    setFalha(null);
    try {
      let idPedido = pedidoId;
      if (!idPedido) {
        const r = await fetch("/api/pedidos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome: dados.nome, email: dados.email, cpf: dados.cpf, itens, aceiteAcademico: dados.aceite }),
        });
        const corpo = await r.json();
        if (!r.ok) throw new Error(corpo.erro);
        idPedido = corpo.id as string;
        setPedidoId(idPedido);
      }

      const [mes, ano] = cartao.validade.split("/");
      const r = await fetch(`/api/pedidos/${idPedido}/pagamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          metodo === "credito"
            ? {
                metodo,
                parcelas,
                cartao: { nome: cartao.nome, numero: cartao.numero, mes, ano: `20${ano}`, cvv: cartao.cvv },
                titular: { nome: dados.nome, email: dados.email, cpf: dados.cpf, cep: dados.cep, numeroEndereco: dados.numero, telefone: dados.telefone },
              }
            : { metodo },
        ),
      });
      const pagamento = await r.json();
      if (!r.ok) throw new Error(pagamento.erro);

      if (pagamento.status === "recusado") {
        setFalha(`Cartão recusado: ${pagamento.motivoRecusa ?? "tente outro cartão ou outro meio"}`);
        setEtapa(1);
        return;
      }
      limpar();
      if (metodo === "debito" && pagamento.invoiceUrl) window.location.assign(pagamento.invoiceUrl);
      else router.push(`/pedido/${idPedido}`);
    } catch (e) {
      setFalha((e as Error).message || "Não foi possível concluir. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (itens.length === 0 && !pedidoId) {
    return (
      <div className="painel" style={{ maxWidth: 560 }}>
        <h1 className="titulo">Sacola vazia</h1>
        <p>Escolha um café ou comece pela amostra de R$ 5,00, que é o produto liberado para pagamento real neste projeto.</p>
        <Link className="botao" href="/produto/amostra-degustacao">
          Ver a amostra
        </Link>
      </div>
    );
  }

  const campo = (nome: keyof typeof dados, valor: string) => setDados((d) => ({ ...d, [nome]: valor }));
  const invalido = (chave: string) => ({ "aria-invalid": Boolean(erros[chave]), "aria-describedby": erros[chave] ? `${id}-${chave}-erro` : undefined });

  return (
    <div className="checkout">
      <div>
        <h1 className="titulo" style={{ marginBottom: 32 }}>
          Pagamento
        </h1>
        <ol className="etapas" aria-label="Etapas do checkout">
          {ETAPAS.map((nome, i) => (
            <li key={nome} aria-current={i === etapa ? "step" : undefined} className={i < etapa ? "feita" : undefined}>
              {nome}
            </li>
          ))}
        </ol>

        <form
          ref={formulario}
          className="painel"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (etapa < 2) avancar();
            else pagar();
          }}
        >
          {falha && (
            <p className="aviso" role="alert">
              {falha}
            </p>
          )}

          {etapa === 0 && (
            <fieldset className="campos">
              <legend className="lead" style={{ fontWeight: 800, marginBottom: 8 }}>
                Seus dados
              </legend>
              <Campo id={`${id}-nome`} rotulo="Nome completo" erro={erros.nome}>
                <input id={`${id}-nome`} autoComplete="name" value={dados.nome} onChange={(e) => campo("nome", e.target.value)} {...invalido("nome")} />
              </Campo>
              <Campo id={`${id}-email`} rotulo="E-mail" erro={erros.email} className="metade">
                <input id={`${id}-email`} type="email" autoComplete="email" value={dados.email} onChange={(e) => campo("email", e.target.value)} {...invalido("email")} />
              </Campo>
              <Campo id={`${id}-telefone`} rotulo="Celular" erro={erros.telefone} className="metade">
                <input id={`${id}-telefone`} inputMode="tel" autoComplete="tel-national" value={dados.telefone} onChange={(e) => campo("telefone", mascara.telefone(e.target.value))} {...invalido("telefone")} />
              </Campo>
              <Campo id={`${id}-cpf`} rotulo="CPF" erro={erros.cpf} className="metade">
                <input id={`${id}-cpf`} inputMode="numeric" value={dados.cpf} onChange={(e) => campo("cpf", mascara.cpf(e.target.value))} {...invalido("cpf")} />
              </Campo>
              <Campo id={`${id}-cep`} rotulo="CEP" erro={erros.cep} className="terco">
                <input id={`${id}-cep`} inputMode="numeric" autoComplete="postal-code" value={dados.cep} onChange={(e) => campo("cep", mascara.cep(e.target.value))} {...invalido("cep")} />
              </Campo>
              <Campo id={`${id}-numero`} rotulo="Número" erro={erros.numero} className="terco">
                <input id={`${id}-numero`} value={dados.numero} onChange={(e) => campo("numero", e.target.value.slice(0, 10))} {...invalido("numero")} />
              </Campo>
              {endereco && cep.length === 8 && (
                <p className="suave" aria-live="polite">
                  {endereco}
                </p>
              )}
              <div>
                <label className="aceite">
                  <input type="checkbox" checked={dados.aceite} onChange={(e) => setDados((d) => ({ ...d, aceite: e.target.checked }))} {...invalido("aceite")} />
                  <span>Entendo que este é um projeto acadêmico, que o pedido não será enviado e que o valor pago será estornado.</span>
                </label>
                {erros.aceite && (
                  <span id={`${id}-aceite-erro`} className="erro pequeno" style={{ color: "var(--erro)" }}>
                    {erros.aceite}
                  </span>
                )}
              </div>
            </fieldset>
          )}

          {etapa === 1 && (
            <fieldset style={{ display: "grid", gap: 24 }}>
              <legend className="lead" style={{ fontWeight: 800, marginBottom: 16 }}>
                Como você quer pagar
              </legend>
              <div className="meios" role="tablist" aria-label="Meio de pagamento">
                {(["pix", "credito", "debito"] as const).map((m) => (
                  <button key={m} type="button" role="tab" aria-selected={metodo === m} onClick={() => setMetodo(m)}>
                    {{ pix: "Pix", credito: "Crédito", debito: "Débito" }[m]}
                  </button>
                ))}
              </div>

              {metodo === "pix" && <p>O QR Code aparece na próxima tela e vale por 30 minutos. A confirmação chega sozinha, sem você precisar avisar.</p>}
              {metodo === "debito" && (
                <p>O cartão de débito é digitado na página segura do Asaas, que abre depois da confirmação. Ao pagar, você volta para acompanhar o pedido aqui.</p>
              )}
              {metodo === "credito" && (
                <div style={{ display: "grid", gap: 24 }}>
                  <div className={`cartao-credito ${virado ? "virado" : ""}`} aria-hidden>
                    <div className="giro">
                      <div className="face">
                        <span>{marca ?? "Cartão"}</span>
                        <span className="numero">{cartao.numero || "•••• •••• •••• ••••"}</span>
                        <span style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <span>{cartao.nome.toUpperCase() || "NOME NO CARTÃO"}</span>
                          <span>{cartao.validade || "MM/AA"}</span>
                        </span>
                      </div>
                      <div className="face verso">
                        <div className="tarja" />
                        <span style={{ alignSelf: "end" }}>CVV {cartao.cvv || "•••"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="campos">
                    <Campo id={`${id}-numeroCartao`} rotulo="Número do cartão" erro={erros.numeroCartao}>
                      <input
                        id={`${id}-numeroCartao`}
                        inputMode="numeric"
                        autoComplete="cc-number"
                        value={cartao.numero}
                        onChange={(e) => setCartao((c) => ({ ...c, numero: mascara.cartao(e.target.value) }))}
                        {...invalido("numeroCartao")}
                      />
                    </Campo>
                    <Campo id={`${id}-nomeCartao`} rotulo="Nome impresso no cartão" erro={erros.nomeCartao}>
                      <input id={`${id}-nomeCartao`} autoComplete="cc-name" value={cartao.nome} onChange={(e) => setCartao((c) => ({ ...c, nome: e.target.value }))} {...invalido("nomeCartao")} />
                    </Campo>
                    <Campo id={`${id}-validade`} rotulo="Validade" erro={erros.validade} className="terco">
                      <input
                        id={`${id}-validade`}
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/AA"
                        value={cartao.validade}
                        onChange={(e) => setCartao((c) => ({ ...c, validade: mascara.validade(e.target.value) }))}
                        {...invalido("validade")}
                      />
                    </Campo>
                    <Campo id={`${id}-cvv`} rotulo="CVV" erro={erros.cvv} className="terco">
                      <input
                        id={`${id}-cvv`}
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        value={cartao.cvv}
                        onFocus={() => setVirado(true)}
                        onBlur={() => setVirado(false)}
                        onChange={(e) => setCartao((c) => ({ ...c, cvv: somenteDigitos(e.target.value).slice(0, 4) }))}
                        {...invalido("cvv")}
                      />
                    </Campo>
                    <Campo id={`${id}-parcelas`} rotulo="Parcelas" className="terco">
                      <select id={`${id}-parcelas`} value={Math.min(parcelas, limiteParcelas)} onChange={(e) => setParcelas(Number(e.target.value))}>
                        {Array.from({ length: limiteParcelas }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}x de {formatarBRL(Math.ceil(total / n))}
                          </option>
                        ))}
                      </select>
                    </Campo>
                  </div>
                  <p className="pequeno suave">Os dados do cartão vão direto para o Asaas e não ficam gravados em lugar nenhum.</p>
                </div>
              )}
            </fieldset>
          )}

          {etapa === 2 && (
            <div style={{ display: "grid", gap: 16 }}>
              <h2 className="lead" style={{ fontWeight: 800 }}>
                Confira antes de pagar
              </h2>
              <dl className="ficha">
                {[
                  ["Nome", dados.nome],
                  ["E-mail", dados.email],
                  ["CPF", dados.cpf],
                  [
                    "Pagamento",
                    metodo === "pix"
                      ? "Pix"
                      : metodo === "debito"
                        ? "Débito, na página do Asaas"
                        : `${marca ?? "Crédito"} final ${somenteDigitos(cartao.numero).slice(-4)}, ${Math.min(parcelas, limiteParcelas)}x`,
                  ],
                ].map(([rotulo, valor]) => (
                  <div key={rotulo}>
                    <dt>{rotulo}</dt>
                    <span className="pontilhado" aria-hidden />
                    <dd>{valor}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="navegacao-etapas">
            {etapa > 0 ? (
              <button type="button" className="botao botao-tom" onClick={() => setEtapa(etapa - 1)} disabled={enviando}>
                Voltar
              </button>
            ) : (
              <span />
            )}
            <button type="submit" className="botao" disabled={enviando || (etapa === 2 && (bloqueados.length > 0 || !cotacao))}>
              {etapa < 2 ? "Continuar" : enviando ? "Processando" : `Pagar ${formatarBRL(total)}`}
            </button>
          </div>
        </form>
      </div>

      <aside className="resumo etiqueta" aria-label="Resumo do pedido">
        <h2 className="lead" style={{ fontWeight: 800 }}>
          Seu pedido
        </h2>
        {erroCotacao && <p className="aviso">{erroCotacao}</p>}
        <ul>
          {(cotacao?.itens ?? []).map((i) => (
            <li key={i.slug}>
              <span>
                {i.quantidade}x {i.nome}
              </span>
              <span style={{ fontWeight: 600 }}>{formatarBRL(i.subtotalCentavos)}</span>
            </li>
          ))}
        </ul>
        <div className="picote" aria-hidden />
        <p className="total">
          <span>Total</span>
          <span>{cotacao ? formatarBRL(total) : "calculando"}</span>
        </p>
        {bloqueados.length > 0 && (
          <p className="pequeno" role="note">
            Neste projeto acadêmico só a Amostra de degustação pode ser paga de verdade. Tire da sacola: {bloqueados.map((b) => b.nome).join(", ")}.
          </p>
        )}
      </aside>
    </div>
  );
}
