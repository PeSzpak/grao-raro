import { writeFileSync } from "node:fs";
import { especificacao } from "@/lib/openapi";

// Exporta a especificação servida em /api/openapi.json para docs/openapi.json. Não abre conexão com o banco.
writeFileSync("docs/openapi.json", JSON.stringify(especificacao, null, 2) + "\n");
console.log(`docs/openapi.json com ${Object.keys(especificacao.paths).length} caminhos`);
