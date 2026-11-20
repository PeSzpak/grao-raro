import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { especificacao } from "./openapi";

const METODOS_HTTP = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function rotas(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? rotas(join(pasta, e.name)) : e.name === "route.ts" ? [join(pasta, e.name)] : [],
  );
}

describe("OpenAPI", () => {
  it("documenta todas as rotas e métodos que existem em src/app/api", async () => {
    const raiz = join(process.cwd(), "src/app");
    for (const arquivo of rotas(join(raiz, "api"))) {
      const caminho = "/" + relative(raiz, arquivo).replace(/\/route\.ts$/, "").replace(/\[(\w+)\]/g, "{$1}");
      const modulo = await import(/* @vite-ignore */ arquivo);
      for (const metodo of METODOS_HTTP.filter((m) => m in modulo)) {
        expect(especificacao.paths, `${metodo} ${caminho}`).toHaveProperty([caminho, metodo.toLowerCase()]);
      }
    }
  });

  it("não documenta rota que não existe", () => {
    const raiz = join(process.cwd(), "src/app");
    const existentes = new Set(
      rotas(join(raiz, "api")).map((a) => "/" + relative(raiz, a).replace(/\/route\.ts$/, "").replace(/\[(\w+)\]/g, "{$1}")),
    );
    for (const caminho of Object.keys(especificacao.paths)) expect(existentes, caminho).toContain(caminho);
  });

  it("docs/openapi.json está igual à especificação (rode npm run openapi)", () => {
    const exportada = JSON.parse(readFileSync(join(process.cwd(), "docs/openapi.json"), "utf8"));
    expect(exportada).toEqual(JSON.parse(JSON.stringify(especificacao)));
  });
});
