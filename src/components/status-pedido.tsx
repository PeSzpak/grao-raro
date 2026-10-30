"use client";

import { useEffect, useState } from "react";

type Status = "pendente" | "aprovado" | "recusado" | "expirado" | "cancelado" | "estornado" | "contestado";

const TEXTO: Record<Status, string> = {
  pendente: "Aguardando pagamento",
  aprovado: "Pagamento aprovado",
  recusado: "Pagamento recusado",
  expirado: "Prazo de pagamento acabou",
  cancelado: "Pedido cancelado",
  estornado: "Valor estornado",
  contestado: "Pagamento contestado",
};

export function StatusPedido({ id, inicial, expiraEm, pix, invoiceUrl }: { id: string; inicial: Status; expiraEm: string | null; pix: { payload: string; imagem: string | null } | null; invoiceUrl: string | null }) {
  const [status, setStatus] = useState<Status>(inicial);
  const [agora, setAgora] = useState(() => Date.now());
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (status !== "pendente") return;
    const consulta = setInterval(async () => {
      const r = await fetch(`/api/pedidos/${id}/status`, { cache: "no-store" }).catch(() => null);
      if (r?.ok) setStatus((await r.json()).status);
    }, 3000);
    const relogio = setInterval(() => setAgora(Date.now()), 1000);
    return () => {
      clearInterval(consulta);
      clearInterval(relogio);
    };
  }, [id, status]);

  const restante = expiraEm ? Math.max(0, new Date(expiraEm).getTime() - agora) : 0;
  const minutos = String(Math.floor(restante / 60000)).padStart(2, "0");
  const segundos = String(Math.floor((restante % 60000) / 1000)).padStart(2, "0");

  async function copiar() {
    if (!pix) return;
    await navigator.clipboard.writeText(pix.payload);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <p className="estado" data-status={status} role="status" aria-live="polite">
        {TEXTO[status]}
      </p>

      {status === "aprovado" && <p className="lead">Recebemos o pagamento. Como é um projeto acadêmico, o valor será estornado pelo painel administrativo.</p>}

      {status === "pendente" && pix && (
        <div className="qr etiqueta">
          {pix.imagem && (
            // eslint-disable-next-line @next/next/no-img-element -- QR Code em base64 vindo do Asaas, sem otimização possível
            <img src={`data:image/png;base64,${pix.imagem}`} alt="QR Code do Pix" width={300} height={300} />
          )}
          <p className="relogio" aria-label={`Vale por mais ${minutos} minutos e ${segundos} segundos`}>
            {minutos}:{segundos}
          </p>
          <p className="copia-cola">{pix.payload}</p>
          <button type="button" className="botao" onClick={copiar} style={{ width: "100%" }}>
            {copiado ? "Copiado" : "Copiar o código Pix"}
          </button>
          <p className="pequeno suave" style={{ textAlign: "center" }}>
            Abra o app do seu banco, escolha Pix copia e cola e cole o código. Esta tela muda sozinha quando o pagamento cair.
          </p>
        </div>
      )}

      {status === "pendente" && !pix && invoiceUrl && (
        <a className="botao" href={invoiceUrl}>
          Abrir a página de pagamento do Asaas
        </a>
      )}
    </div>
  );
}
