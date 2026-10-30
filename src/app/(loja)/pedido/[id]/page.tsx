import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StatusPedido } from "@/components/status-pedido";
import { formatarBRL } from "@/domain/dinheiro";
import { pagamentoAtual } from "@/services/pagamentos";
import { buscarPedido } from "@/services/pedidos";

export const metadata: Metadata = { title: "Seu pedido", robots: { index: false } };

export default function PaginaPedido({ params }: PageProps<"/pedido/[id]">) {
  return (
    <main className="pagina">
      <Suspense fallback={<p className="suave">Carregando o pedido</p>}>
        <Pedido params={params} />
      </Suspense>
    </main>
  );
}

async function Pedido({ params }: Pick<PageProps<"/pedido/[id]">, "params">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const pedido = await buscarPedido(id);
  if (!pedido) notFound();
  const pagamento = await pagamentoAtual(id);

  return (
    <div className="pedido">
      <div>
        <h1 className="titulo">Pedido de {pedido.nome.split(" ")[0]}</h1>
        <p className="suave" style={{ marginTop: 12 }}>
          Número {pedido.id.slice(0, 8)}
        </p>
        <div style={{ marginTop: 40 }}>
          <StatusPedido
            id={pedido.id}
            inicial={pedido.status}
            expiraEm={pedido.expiraEm?.toISOString() ?? null}
            pix={pagamento?.pix ? { payload: pagamento.pix.payload, imagem: pagamento.pix.imagem } : null}
            invoiceUrl={pagamento?.invoiceUrl ?? null}
          />
        </div>
      </div>

      <aside className="resumo etiqueta" aria-label="Itens do pedido">
        <h2 className="lead" style={{ fontWeight: 800 }}>
          O que você pediu
        </h2>
        <ul>
          {pedido.itens.map((i) => (
            <li key={i.slug}>
              <span>
                {i.quantidade}x {i.nome}
              </span>
              <span style={{ fontWeight: 600 }}>{formatarBRL(i.precoUnitarioCentavos * i.quantidade)}</span>
            </li>
          ))}
        </ul>
        <div className="picote" aria-hidden />
        <p className="total">
          <span>Total</span>
          <span>{formatarBRL(pedido.totalCentavos)}</span>
        </p>
        <p className="pequeno suave">
          {pagamento ? { pix: "Pix", credito: `Crédito em ${pagamento.parcelas}x`, debito: "Débito" }[pagamento.metodo] : "Sem pagamento ainda"}
        </p>
        <Link className="link" href="/cafes">
          Continuar comprando
        </Link>
      </aside>
    </div>
  );
}
