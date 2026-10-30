"use client";

import { useRef, useState, type ReactNode } from "react";

export function FileiraMetodos({ titulo, children }: { titulo: ReactNode; children: ReactNode }) {
  const fileira = useRef<HTMLDivElement>(null);
  const [andou, setAndou] = useState(0);

  const rolar = (direcao: number) => fileira.current?.scrollBy({ left: direcao * 312, behavior: "smooth" });
  const medir = () => {
    const f = fileira.current;
    if (f) setAndou(f.scrollLeft / Math.max(1, f.scrollWidth - f.clientWidth));
  };

  return (
    <section className="metodos-faixa" aria-labelledby="titulo-metodos">
      <div className="metodos-topo moldura">
        {titulo}
        <div className="setas">
          <button type="button" onClick={() => rolar(-1)} aria-label="Método anterior">
            ←
          </button>
          <button type="button" onClick={() => rolar(1)} aria-label="Próximo método">
            →
          </button>
        </div>
      </div>
      <div className="progresso" aria-hidden>
        <span style={{ width: `${12 + andou * 88}%` }} />
      </div>
      <div className="fileira" ref={fileira} onScroll={medir}>
        {children}
      </div>
    </section>
  );
}
