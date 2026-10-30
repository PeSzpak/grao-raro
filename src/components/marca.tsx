import { useId } from "react";

// Grão em traço dentro de um selo redondo, a mesma marca do cabeçalho, do rodapé e do ícone da aba.
export function Grao({ tamanho = 36 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" fill="none" aria-hidden className="grao">
      <circle cx="24" cy="24" r="22.5" stroke="currentColor" strokeWidth="1.5" />
      <g transform="rotate(-28 24 24)">
        <ellipse cx="24" cy="24" rx="9.5" ry="14" stroke="currentColor" strokeWidth="2.2" />
        <path d="M24 10.5c-4.5 5-4.5 9.5 0 13.5s4.5 8.5 0 13.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function Marca({ tamanho = 36 }: { tamanho?: number }) {
  return (
    <span className="marca">
      <Grao tamanho={tamanho} />
      <span>Grão Raro</span>
    </span>
  );
}

// Selo de torrefação com o texto correndo em volta do grão.
export function Selo({ texto }: { texto: string }) {
  const id = useId();
  return (
    <svg className="selo" viewBox="0 0 200 200" aria-hidden>
      <defs>
        <path id={id} d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0" />
      </defs>
      <g className="selo-giro">
        <text>
          <textPath href={`#${id}`} textLength="488" lengthAdjust="spacing">
            {texto}
          </textPath>
        </text>
      </g>
      <g transform="translate(64 64) scale(1.5)">
        <g transform="rotate(-28 24 24)" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="24" cy="24" rx="9.5" ry="14" />
          <path d="M24 10.5c-4.5 5-4.5 9.5 0 13.5s4.5 8.5 0 13.5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

// Xícara em traço com três fios de vapor subindo.
export function XicaraComVapor({ tamanho = 120 }: { tamanho?: number }) {
  return (
    <svg className="xicara" width={tamanho} height={tamanho} viewBox="0 0 120 120" fill="none" aria-hidden>
      <g className="vapor" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M44 52c-6-8 6-12 0-20s6-12 0-20" />
        <path d="M60 52c-6-8 6-12 0-20s6-12 0-20" />
        <path d="M76 52c-6-8 6-12 0-20s6-12 0-20" />
      </g>
      <g stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M26 62h68v10c0 18-15 30-34 30S26 90 26 72V62z" />
        <path d="M94 68h6a9 9 0 0 1 0 18h-8" />
        <path d="M18 110h84" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// Curvas de nível: lembram o mapa das encostas de onde os cafés vêm.
export function CurvasDeNivel() {
  const curvas = Array.from({ length: 14 }, (_, i) => {
    const raio = 40 + i * 34;
    const pontos = Array.from({ length: 13 }, (_, k) => {
      const angulo = (k / 12) * Math.PI * 2;
      const onda = 1 + 0.12 * Math.sin(angulo * 3 + i * 0.7) + 0.06 * Math.cos(angulo * 5 + i);
      return [600 + Math.cos(angulo) * raio * 1.5 * onda, 300 + Math.sin(angulo) * raio * onda];
    });
    const d = pontos
      .map(([x, y], k) => {
        if (k === 0) return `M${x.toFixed(1)} ${y.toFixed(1)}`;
        const [px, py] = pontos[k - 1];
        return `Q${px.toFixed(1)} ${py.toFixed(1)} ${((px + x) / 2).toFixed(1)} ${((py + y) / 2).toFixed(1)}`;
      })
      .join(" ");
    return <path key={i} d={`${d}Z`} />;
  });
  return (
    <svg className="curvas" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.2">
        {curvas}
      </g>
    </svg>
  );
}
