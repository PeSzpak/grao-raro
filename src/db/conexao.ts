// O mysql2 ignora o ssl-mode da URI do Aiven e conectaria sem criptografia; aqui ele vira a opção ssl.
type OpcoesDeConexao = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: { ca?: string; rejectUnauthorized: boolean };
};

export function opcoesDeConexao(url: string, certificado?: string): OpcoesDeConexao {
  const u = new URL(url);
  const modo = u.searchParams.get("ssl-mode")?.toUpperCase();
  const opcoes = {
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.slice(1),
  };
  if (!modo || modo === "DISABLED") return opcoes;
  return { ...opcoes, ssl: certificado ? { ca: certificado, rejectUnauthorized: true } : { rejectUnauthorized: false } };
}

// Variáveis de ambiente em uma linha só costumam trazer o PEM com "\n" escrito.
export function certificadoDoAmbiente() {
  return process.env.DATABASE_CA?.replace(/\\n/g, "\n") || undefined;
}
