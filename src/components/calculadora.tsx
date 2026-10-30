"use client";

import { useId, useState } from "react";
import { cafePara, lerProporcao } from "@/domain/receita";

export function Calculadora({ proporcao }: { proporcao: string }) {
  const receita = lerProporcao(proporcao);
  const [liquido, setLiquido] = useState(receita?.liquido ?? 250);
  const id = useId();
  if (!receita) return null;

  const minimo = Math.max(receita.unidade === "g" ? 18 : 100, Math.round(receita.liquido / 2));
  const maximo = receita.liquido * 4;
  const passo = receita.unidade === "g" ? 2 : receita.liquido >= 1000 ? 100 : 10;
  const nomeLiquido = receita.unidade === "g" ? "de bebida" : "de água";

  return (
    <section className="calculadora etiqueta" aria-labelledby={`${id}-titulo`}>
      <div>
        <h2 id={`${id}-titulo`} className="lead" style={{ fontWeight: 800 }}>
          Quanto café para quanto {receita.unidade === "g" ? "de bebida" : "de água"}
        </h2>
        <p className="suave">Base do método: {proporcao}, uma parte de café para {receita.razao.toFixed(1).replace(".", ",")} de líquido.</p>
      </div>
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
