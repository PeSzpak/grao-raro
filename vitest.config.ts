import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    fileParallelism: false,
    // Banco separado do de desenvolvimento: os testes mexem no estoque.
    env: {
      DATABASE_URL: "mysql://graoraro:graoraro@127.0.0.1:3307/graoraro_teste",
      SESSION_SECRET: "segredo-de-teste",
    },
  },
});
