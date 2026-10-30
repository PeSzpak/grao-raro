import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <main className="pagina" style={{ minHeight: "70svh", display: "grid", placeItems: "center" }}>
      <div className="etiqueta" style={{ padding: 48, maxWidth: 560, display: "grid", gap: 24 }}>
        <h1 className="titulo">Lote não encontrado</h1>
        <p>Esse endereço não leva a nenhum café, guia ou pedido da casa.</p>
        <div className="picote" aria-hidden />
        <Link className="botao" href="/cafes">
          Ver os cafés
        </Link>
      </div>
    </main>
  );
}
