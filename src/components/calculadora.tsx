"use client";

import { useId, useState } from "react";
import { cafePara, lerProporcao } from "@/domain/receita";

export function Calculadora({ proporcao }: { proporcao: string }) {
  const receita = lerProporcao(proporcao);
  const [liquido, setLiquido] = useState(receita?.liquido ?? 250);
  const id = useId();
  if (!receita) return null;

  const passo = receita.unidade === "g" ? 2 : receita.liquido >= 1000 ? 100 : 10;
  const maximo = receita.liquido * 4;
  // O mínimo cai num múltiplo do passo para o controle chegar exatamente ao máximo.
  const minimo = Math.max(passo, Math.round(receita.liquido / 2 / passo) * passo);
  const nomeLiquido = receita.unidade === "g" ? "de bebida" : "de água";

  return (
    <section className="calculadora etiqueta" aria-labelledby={`${id}-titulo`}>
      <div>
        <h2 id={`${id}-titulo`} className="lead" style={{ fontWeight: 800 }}>
          Quanto café para quanto {receita.unidade === "g" ? "de bebida" : "de água"}
        </h2>
        <p className="suave">Base do método: {proporcao}, uma parte de café para {receita.razao.toFixed(1).replace(".", ",")} de líquido.</p>
      </div>
      <Gotejador nivel={(liquido - minimo) / (maximo - minimo)} />
      <div className="numeros" aria-live="polite">
        <p>
          <strong>{cafePara(liquido, receita.razao).toString().replace(".", ",")} g</strong>
          <span className="suave">de café moído</span>
        </p>
        <p>
          <strong>
            {liquido >= 1000 ? `${(liquido / 1000).toString().replace(".", ",")} l` : `${liquido} ${receita.unidade}`}
          </strong>
          <span className="suave">{nomeLiquido}</span>
        </p>
      </div>
      <div>
        <label htmlFor={id} style={{ fontWeight: 600 }}>
          Arraste para mudar o tamanho do preparo
        </label>
        <input id={id} type="range" min={minimo} max={maximo} step={passo} value={liquido} onChange={(e) => setLiquido(Number(e.target.value))} />
      </div>
      <div className="picote" aria-hidden />
    </section>
  );
}

// V60 sobre a jarra: as gotas caem sem parar e o nível acompanha o tamanho do preparo.
function Gotejador({ nivel }: { nivel: number }) {
  const altura = 18 + nivel * 52;
  return (
    <svg className="gotejador" viewBox="0 0 200 190" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
        <path d="M52 20h96l-34 52h-28z" />
        <path d="M46 20h108" strokeLinecap="round" />
        <path d="M86 72h28v8H86z" />
      </g>
      <g className="gotas" fill="currentColor">
        <circle cx="100" cy="88" r="3.4" />
        <circle cx="100" cy="88" r="3.4" />
        <circle cx="100" cy="88" r="3.4" />
      </g>
      <clipPath id="jarra-calculadora">
        <path d="M62 104h76l-8 74H70z" />
      </clipPath>
      <rect className="liquido" x="56" y={178 - altura} width="88" height={altura} clipPath="url(#jarra-calculadora)" />
      <path d="M62 104h76l-8 74H70z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M138 116c14 0 16 30 -2 34" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
