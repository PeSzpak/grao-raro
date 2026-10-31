"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { formatarBRL } from "@/domain/dinheiro";

type Pedido = {
  id: string;
  status: string;
  nome: string;
  email: string;
  totalCentavos: number;
  criadoEm: string;
  pagamento: { metodo: string; status: string; parcelas: number; motivoRecusa: string | null } | null;
  historico: { de: string | null; para: string; origem: string; em: string }[];
};

const ORIGEM: Record<string, string> = { criacao: "criação", consulta: "consulta ao Asaas", webhook: "webhook", admin: "painel", expiracao: "expiração" };

const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function Admin() {
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const r = await fetch("/api/admin/pedidos", { cache: "no-store" });
    if (r.status === 401) return setAutenticado(false);
    setPedidos(await r.json());
    setAutenticado(true);
  }, []);

  useEffect(() => {
    let ativo = true;
    fetch("/api/admin/pedidos", { cache: "no-store" }).then(async (r) => {
      if (!ativo) return;
      if (r.status === 401) return setAutenticado(false);
      setPedidos(await r.json());
      setAutenticado(true);
    });
    return () => {
      ativo = false;
    };
  }, []);

  async function estornar(id: string) {
    setMensagem(null);
    const r = await fetch(`/api/admin/pedidos/${id}/estorno`, { method: "POST" });
    const corpo = await r.json();
    setConfirmando(null);
    setMensagem(r.ok ? `Pedido ${id.slice(0, 8)} estornado.` : [corpo.erro, corpo.detalhes].filter(Boolean).join(": "));
    await carregar();
  }

  if (autenticado === null) return <p className="suave">Carregando</p>;
  if (!autenticado) return <Login entrou={carregar} />;

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div className="pagina-cabeca" style={{ marginBottom: 0 }}>
        <h1 className="titulo">Pedidos</h1>
        <button type="button" className="botao botao-tom" onClick={carregar}>
          Atualizar
        </button>
      </div>
      {mensagem && (
        <p className="aviso" role="status">
          {mensagem}
        </p>
      )}
      {pedidos.length === 0 ? (
        <p className="lead suave">Nenhum pedido ainda.</p>
      ) : (
        <div className="rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Comprador</th>
                <th>Total</th>
                <th>Pagamento</th>
                <th>Histórico</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td>
                    {dataHora.format(new Date(p.criadoEm))}
                    <br />
                    <span className="suave">{p.id.slice(0, 8)}</span>
                  </td>
                  <td>
                    {p.nome}
                    <br />
                    <span className="suave">{p.email}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatarBRL(p.totalCentavos)}</td>
                  <td>
                    <span className="estado" data-status={p.status} style={{ fontSize: "1rem" }}>
                      {p.status}
                    </span>
                    <br />
                    <span className="suave">
                      {p.pagamento ? `${p.pagamento.metodo}${p.pagamento.parcelas > 1 ? ` ${p.pagamento.parcelas}x` : ""}` : "sem pagamento"}
                    </span>
                  </td>
                  <td className="suave">
                    {p.historico.map((h, i) => (
                      <span key={i} style={{ display: "block" }}>
                        {h.para} <span className="pequeno">por {ORIGEM[h.origem] ?? h.origem}</span>
                      </span>
                    ))}
                  </td>
                  <td>
                    {p.status === "aprovado" &&
                      (confirmando === p.id ? (
                        <span style={{ display: "flex", gap: 8 }}>
                          <button type="button" className="botao" onClick={() => estornar(p.id)}>
                            Confirmar estorno
                          </button>
                          <button type="button" className="link" onClick={() => setConfirmando(null)}>
                            Cancelar
                          </button>
                        </span>
                      ) : (
                        <button type="button" className="botao botao-tom" onClick={() => setConfirmando(p.id)}>
                          Estornar
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Login({ entrou }: { entrou: () => void }) {
  const id = useId();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  return (
    <form
      className="painel"
      style={{ maxWidth: 440 }}
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await fetch("/api/admin/sessao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ senha }) });
        if (r.ok) entrou();
        else setErro("Senha errada");
      }}
    >
      <h1 className="titulo">Painel</h1>
      <div className="campo">
        <label htmlFor={id}>Senha de administrador</label>
        <input id={id} type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} aria-invalid={Boolean(erro)} />
        {erro && (
          <span className="erro" role="alert">
            {erro}
          </span>
        )}
      </div>
      <button className="botao">Entrar</button>
    </form>
  );
}
