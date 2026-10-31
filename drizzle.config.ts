import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";
import { certificadoDoAmbiente, opcoesDeConexao } from "./src/db/conexao";

loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  out: "./db/migrations",
  dbCredentials: opcoesDeConexao(process.env.DATABASE_URL!, certificadoDoAmbiente()),
});
