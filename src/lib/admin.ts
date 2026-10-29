import { createHmac, timingSafeEqual } from "node:crypto";
import { erro } from "./http";

const COOKIE = "admin";
const DURACAO_MS = 8 * 60 * 60 * 1000;

function iguais(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function assinar(expira: number) {
  const segredo = process.env.SESSION_SECRET;
  if (!segredo) throw new Error("SESSION_SECRET não definida");
  return createHmac("sha256", segredo).update(`admin.${expira}`).digest("base64url");
}

export function senhaCorreta(senha: string) {
  const esperada = process.env.ADMIN_PASSWORD;
  return Boolean(esperada) && iguais(senha, esperada!);
}

export function cookieDeSessao() {
  const expira = Date.now() + DURACAO_MS;
  const seguro = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${expira}.${assinar(expira)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${DURACAO_MS / 1000}${seguro}`;
}

export function adminAutenticado(req: Request) {
  const valor = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  if (!valor) return false;
  const [expira, assinatura] = valor.split(".");
  return Number(expira) > Date.now() && Boolean(assinatura) && iguais(assinatura, assinar(Number(expira)));
}

export const naoAutorizado = () => erro(401, "Entre no painel com a senha de administrador");
